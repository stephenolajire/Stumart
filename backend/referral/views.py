from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count, Q

from .models import Referral, PayoutHistory
from .serializers import (
    ReferralCreateSerializer,
    ReferralSerializer,
    ReferralDetailSerializer,
    ReferralValidateSerializer,
    PayoutHistorySerializer,
    ReferralListSerializer
)
from .email_utils import send_payout_notification_email, send_bulk_payout_notifications


class CreateReferralView(APIView):
    """
    POST /api/referrals/create/
    Create a new referral code for a user
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ReferralCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            referral = serializer.save()
            response_serializer = ReferralSerializer(referral)
            
            return Response({
                'message': 'Referral code created successfully',
                'referral': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'error': 'Invalid data',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ListAllReferralsView(APIView):
    """
    GET /api/referrals/list/
    Get list of all referrals with statistics (Admin only)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get all referrals
        referrals = Referral.objects.all().order_by('-created_at')
        
        # Update stats for all referrals
        for referral in referrals:
            referral.update_stats()
        
        # Serialize referrals
        serializer = ReferralListSerializer(referrals, many=True)
        
        # Calculate aggregate statistics
        aggregate_stats = {
            'total_referrals': referrals.count(),
            'total_active': referrals.filter(is_active=True).count(),
            'total_lifetime_earnings': float(referrals.aggregate(
                total=Sum('lifetime_earnings')
            )['total'] or 0),
            'total_current_earnings': float(referrals.aggregate(
                total=Sum('total_earnings')
            )['total'] or 0),
            'total_paid_out': float(referrals.aggregate(
                total=Sum('total_paid_out')
            )['total'] or 0),
            'total_pending_payout': float(referrals.aggregate(
                total=Sum('total_earnings')
            )['total'] or 0),
            'total_completed_orders': sum(r.total_referrals for r in referrals),
            'total_lifetime_orders': sum(r.lifetime_referrals for r in referrals),
        }
        
        return Response({
            'referrals': serializer.data,
            'summary': aggregate_stats,
            'total_count': referrals.count()
        }, status=status.HTTP_200_OK)


class GetReferralByCodeView(APIView):
    """
    GET /api/referrals/code/<referral_code>/
    Get referral information by referral code
    """
    permission_classes = [AllowAny]
    
    def get(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        # Update stats before returning
        referral.update_stats()
        
        serializer = ReferralDetailSerializer(referral)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetReferralByEmailView(APIView):
    """
    GET /api/referrals/email/<email>/
    Get referral information by email
    """
    permission_classes = [AllowAny]
    
    def get(self, request, email):
        referral = get_object_or_404(Referral, email=email)
        
        # Update stats before returning
        referral.update_stats()
        
        serializer = ReferralDetailSerializer(referral)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ValidateReferralCodeView(APIView):
    """
    POST /api/referrals/validate/
    Validate if a referral code exists and is active
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ReferralValidateSerializer(data=request.data)
        
        if serializer.is_valid():
            referral_code = serializer.validated_data['referral_code']
            referral = Referral.objects.get(referral_code=referral_code, is_active=True)
            
            return Response({
                'valid': True,
                'message': 'Referral code is valid',
                'referral': {
                    'code': referral.referral_code,
                    'owner': f"{referral.first_name} {referral.last_name}"
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'valid': False,
            'error': serializer.errors.get('referral_code', ['Invalid referral code'])[0]
        }, status=status.HTTP_400_BAD_REQUEST)


class ReferralStatsView(APIView):
    """
    GET /api/referrals/<referral_code>/stats/
    Get detailed statistics for a referral code
    """
    permission_classes = [AllowAny]
    
    def get(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        # Update stats
        referral.update_stats()
        
        stats = referral.get_stats()
        
        return Response({
            'referral_code': referral.referral_code,
            'owner': {
                'first_name': referral.first_name,
                'last_name': referral.last_name,
                'email': referral.email
            },
            'stats': stats,
            'created_at': referral.created_at
        }, status=status.HTTP_200_OK)


class UpdateReferralStatsView(APIView):
    """
    POST /api/referrals/<referral_code>/update-stats/
    Manually trigger stats update for a referral code
    """
    permission_classes = [AllowAny]
    
    def post(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        stats = referral.update_stats()
        
        return Response({
            'message': 'Stats updated successfully',
            'stats': stats
        }, status=status.HTTP_200_OK)


class ResetReferralEarningsView(APIView):
    """
    POST /api/referrals/<referral_code>/reset/
    Reset earnings for a specific referral (process payout)
    Admin only
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        # Update stats first to ensure accurate amounts
        referral.update_stats()
        
        # Store payout info before reset
        payout_amount = referral.total_earnings
        referral_count = referral.total_referrals
        period_end = timezone.now()
        period_start = referral.last_reset_date if referral.last_reset_date else referral.created_at
        
        if payout_amount <= 0:
            return Response({
                'error': 'No earnings to reset',
                'message': 'This referral has no current earnings to payout.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Reset the earnings
            payout_info = referral.reset_earnings()
            
            # Create payout history record
            payout_history = PayoutHistory.objects.create(
                referral=referral,
                amount=payout_amount,
                referral_count=referral_count,
                period_start=period_start,
                period_end=period_end
            )
        
        return Response({
            'message': 'Earnings reset successfully',
            'payout_info': payout_info,
            'referral': {
                'code': referral.referral_code,
                'name': f"{referral.first_name} {referral.last_name}",
                'email': referral.email
            }
        }, status=status.HTTP_200_OK)


class BulkResetEarningsView(APIView):
    """
    POST /api/referrals/bulk-reset/
    Reset earnings for all referrals with earnings > 0
    Admin only
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        # Get all referrals with earnings
        referrals_with_earnings = Referral.objects.filter(
            total_earnings__gt=0,
            is_active=True
        )
        
        if not referrals_with_earnings.exists():
            return Response({
                'message': 'No referrals with earnings to reset',
                'count': 0
            }, status=status.HTTP_200_OK)
        
        reset_count = 0
        total_amount = 0
        payout_records = []
        
        with transaction.atomic():
            for referral in referrals_with_earnings:
                # Update stats first
                referral.update_stats()
                
                if referral.total_earnings > 0:
                    # Store info before reset
                    payout_amount = referral.total_earnings
                    referral_count = referral.total_referrals
                    period_end = timezone.now()
                    period_start = referral.last_reset_date if referral.last_reset_date else referral.created_at
                    
                    # Reset earnings
                    referral.reset_earnings()
                    
                    # Create payout history
                    PayoutHistory.objects.create(
                        referral=referral,
                        amount=payout_amount,
                        referral_count=referral_count,
                        period_start=period_start,
                        period_end=period_end
                    )
                    
                    reset_count += 1
                    total_amount += payout_amount
                    
                    payout_records.append({
                        'referral_code': referral.referral_code,
                        'name': f"{referral.first_name} {referral.last_name}",
                        'email': referral.email,
                        'amount': float(payout_amount)
                    })
        
        return Response({
            'message': f'Successfully reset earnings for {reset_count} referrals',
            'count': reset_count,
            'total_amount': float(total_amount),
            'payouts': payout_records
        }, status=status.HTTP_200_OK)


class SendPayoutEmailView(APIView):
    """
    POST /api/referrals/<referral_code>/send-email/
    Send payout notification email to a specific referral
    Admin only
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        # Get the most recent payout history
        latest_payout = PayoutHistory.objects.filter(referral=referral).first()
        
        if not latest_payout:
            return Response({
                'error': 'No payout history found',
                'message': 'Cannot send email without payout history. Process a payout first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Send email
        success = send_payout_notification_email(
            referral,
            latest_payout.amount,
            latest_payout.period_start,
            latest_payout.period_end
        )
        
        if success:
            # Update payout history
            latest_payout.email_sent = True
            latest_payout.email_sent_at = timezone.now()
            latest_payout.save()
            
            return Response({
                'message': 'Email sent successfully',
                'email': referral.email,
                'amount': float(latest_payout.amount)
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Failed to send email',
                'message': 'There was an error sending the email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkSendPayoutEmailsView(APIView):
    """
    POST /api/referrals/bulk-send-emails/
    Send payout notification emails to all referrals with recent payouts
    Admin only
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        # Get all recent payouts that haven't had emails sent
        recent_payouts = PayoutHistory.objects.filter(
            email_sent=False
        ).select_related('referral')
        
        if not recent_payouts.exists():
            return Response({
                'message': 'No pending payout emails to send',
                'count': 0
            }, status=status.HTTP_200_OK)
        
        # Prepare data for bulk send
        referrals_with_payouts = []
        for payout in recent_payouts:
            referrals_with_payouts.append((
                payout.referral,
                payout.amount,
                payout.period_start,
                payout.period_end
            ))
        
        # Send bulk emails
        result = send_bulk_payout_notifications(referrals_with_payouts)
        
        # Update email_sent status for successful sends
        with transaction.atomic():
            for payout in recent_payouts:
                if payout.referral.email not in result['failed_emails']:
                    payout.email_sent = True
                    payout.email_sent_at = timezone.now()
                    payout.save()
        
        return Response({
            'message': f'Successfully sent {result["success_count"]} emails',
            'success_count': result['success_count'],
            'failed_count': len(result['failed_emails']),
            'failed_emails': result['failed_emails'],
            'total_processed': result['total_processed']
        }, status=status.HTTP_200_OK)


class PayoutHistoryView(APIView):
    """
    GET /api/referrals/<referral_code>/payout-history/
    Get payout history for a referral
    """
    permission_classes = [AllowAny]
    
    def get(self, request, referral_code):
        referral_code = referral_code.upper()
        referral = get_object_or_404(Referral, referral_code=referral_code)
        
        payouts = PayoutHistory.objects.filter(referral=referral)
        serializer = PayoutHistorySerializer(payouts, many=True)
        
        return Response({
            'referral_code': referral.referral_code,
            'payout_history': serializer.data,
            'total_payouts': payouts.count(),
            'total_amount_paid': float(referral.total_paid_out)
        }, status=status.HTTP_200_OK)