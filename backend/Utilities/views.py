# views.py for admin utilities (APIView version)

import csv
import json
from datetime import datetime
from django.http import HttpResponse, JsonResponse
from django.core.mail import send_mail, EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Count, Q
from django.core.paginator import Paginator
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from User.models import User, Vendor, Picker, StudentPicker, KYCVerification, Student
from User.serializers import UserSerializer  # Assuming you have serializers


class DownloadUsersListView(APIView):
    """Download complete list of registered users as CSV"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            # Get all users with related data
            users = User.objects.select_related(
                'student_profile', 
                'vendor_profile', 
                'picker_profile', 
                'student_picker_profile',
                'kyc'
            ).all()

            # Create HTTP response with CSV content type
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="users_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'

            writer = csv.writer(response)
            
            # Write CSV headers
            writer.writerow([
                'ID', 'Email', 'First Name', 'Last Name', 'Phone Number', 
                'User Type', 'Institution', 'State', 'Date Joined', 
                'Is Active', 'Is Verified', 'KYC Status', 'Profile Complete'
            ])

            # Write user data
            for user in users:
                kyc_status = 'None'
                if hasattr(user, 'kyc'):
                    kyc_status = user.kyc.verification_status
                
                profile_complete = 'Yes' if user.profile_pic else 'No'
                
                writer.writerow([
                    user.id,
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.phone_number,
                    user.get_user_type_display(),
                    user.institution,
                    user.state,
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                    'Yes' if user.is_active else 'No',
                    'Yes' if user.is_verified else 'No',
                    kyc_status.title(),
                    profile_complete
                ])

            return response

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error downloading users list: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadVendorsListView(APIView):
    """Download complete list of registered vendors as CSV"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            vendors = Vendor.objects.select_related('user', 'user__kyc').all()

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="vendors_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'

            writer = csv.writer(response)
            
            # Write CSV headers
            writer.writerow([
                'ID', 'Email', 'First Name', 'Last Name', 'Phone Number',
                'Business Name', 'Business Category', 'Specific Category',
                'Rating', 'Total Ratings', 'Is Verified', 'KYC Status',
                'Bank Name', 'Account Number', 'Account Name', 'Institution',
                'State', 'Date Joined', 'Has Products', 'Subscription Status'
            ])

            # Write vendor data
            for vendor in vendors:
                user = vendor.user
                kyc_status = 'None'
                if hasattr(user, 'kyc'):
                    kyc_status = user.kyc.verification_status
                
                # Check if vendor has products (you'll need to adjust based on your Product model)
                has_products = 'Unknown'  # Replace with actual product count logic
                
                writer.writerow([
                    vendor.id,
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.phone_number,
                    vendor.business_name,
                    vendor.get_business_category_display(),
                    vendor.get_specific_category_display() if vendor.specific_category else '',
                    vendor.rating,
                    vendor.total_ratings,
                    'Yes' if vendor.is_verified else 'No',
                    kyc_status.title(),
                    vendor.bank_name,
                    vendor.account_number,
                    vendor.account_name,
                    user.institution,
                    user.state,
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                    has_products,
                    vendor.subscription_status or 'None'
                ])

            return response

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error downloading vendors list: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadPickersListView(APIView):
    """Download complete list of registered pickers as CSV"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            # Get both regular pickers and student pickers
            pickers = Picker.objects.select_related('user', 'user__kyc').all()
            student_pickers = StudentPicker.objects.select_related('user', 'user__kyc').all()

            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="pickers_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'

            writer = csv.writer(response)
            
            # Write CSV headers
            writer.writerow([
                'ID', 'Email', 'First Name', 'Last Name', 'Phone Number',
                'Picker Type', 'Fleet Type', 'Hostel Name', 'Room Number',
                'Is Available', 'Total Deliveries', 'Rating', 'KYC Status',
                'Bank Name', 'Account Number', 'Account Name', 'Institution',
                'State', 'Date Joined'
            ])

            # Write regular pickers data
            for picker in pickers:
                user = picker.user
                kyc_status = 'None'
                if hasattr(user, 'kyc'):
                    kyc_status = user.kyc.verification_status
                
                writer.writerow([
                    picker.id,
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.phone_number,
                    'Regular Picker',
                    picker.get_fleet_type_display(),
                    '',  # No hostel for regular pickers
                    '',  # No room for regular pickers
                    'Yes' if picker.is_available else 'No',
                    picker.total_deliveries,
                    picker.rating,
                    kyc_status.title(),
                    picker.bank_name,
                    picker.account_number,
                    picker.account_name,
                    user.institution,
                    user.state,
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                ])

            # Write student pickers data
            for student_picker in student_pickers:
                user = student_picker.user
                kyc_status = 'None'
                if hasattr(user, 'kyc'):
                    kyc_status = user.kyc.verification_status
                
                writer.writerow([
                    student_picker.id,
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.phone_number,
                    'Student Picker',
                    '',  # No fleet type for student pickers
                    student_picker.hostel_name,
                    student_picker.room_number,
                    'Yes' if student_picker.is_available else 'No',
                    student_picker.total_deliveries,
                    student_picker.rating,
                    kyc_status.title(),
                    student_picker.bank_name,
                    student_picker.account_number,
                    student_picker.account_name,
                    user.institution,
                    user.state,
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                ])

            return response

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error downloading pickers list: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadTransactionsListView(APIView):
    """Download transaction history as CSV"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            # You'll need to implement this based on your Transaction/Order model
            # For now, I'll provide a template structure
            
            # transactions = Transaction.objects.select_related('user').all()
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="transactions_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'

            writer = csv.writer(response)
            
            # Write CSV headers
            writer.writerow([
                'Transaction ID', 'User Email', 'Amount', 'Type', 'Status',
                'Reference', 'Date Created', 'Date Updated', 'Description'
            ])

            # Add your transaction data here
            # for transaction in transactions:
            #     writer.writerow([...])

            return response

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error downloading transactions list: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendKYCReminderView(APIView):
    """Send KYC reminder to users without KYC verification"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            # Get users without KYC or with pending/rejected KYC
            users_without_kyc = User.objects.filter(
                Q(kyc__isnull=True) | 
                Q(kyc__verification_status__in=['pending', 'rejected', 'none'])
            ).exclude(user_type__in=['admin', 'student'])

            if not users_without_kyc.exists():
                return Response({
                    'success': True,
                    'message': 'All users have completed KYC verification',
                    'count': 0
                })

            sent_count = 0
            failed_count = 0

            for user in users_without_kyc:
                try:
                    # Render email template
                    context = {
                        'user_name': f"{user.first_name} {user.last_name}",
                        'user_email': user.email,
                        'kyc_url': f"{settings.FRONTEND_URL}/kyc-verification",  # Adjust URL as needed
                        'support_email': settings.DEFAULT_FROM_EMAIL,
                        'company_name': 'StuMart'
                    }
                    
                    html_content = render_to_string('email/kyc_reminder.html', context)
                    # plain_content = render_to_string('email/kyc_reminder.txt', context)

                    # Send email
                    email = EmailMessage(
                        subject='Complete Your KYC Verification - StuMart',
                        body=html_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[user.email],
                    )
                    email.content_subtype = 'html'
                    email.send()
                    
                    sent_count += 1

                except Exception as e:
                    print(f"Failed to send KYC reminder to {user.email}: {str(e)}")
                    failed_count += 1

            return Response({
                'success': True,
                'message': f'KYC reminder sent successfully to {sent_count} users',
                'count': sent_count,
                'failed_count': failed_count
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error sending KYC reminders: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendProductReminderView(APIView):
    """Send product reminder to vendors without products"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            # Get vendors without products, excluding 'others' category
            # 'others' category vendors need subscriptions to add products
            vendors_without_products = Vendor.objects.filter(
                user__products__isnull=True,  # No products added
                user__kyc__verification_status='approved',  # Only KYC verified vendors
            ).exclude(
                business_category='others'  # Exclude 'others' category as they need subscriptions
            ).distinct()

            if not vendors_without_products.exists():
                return Response({
                    'success': True,
                    'message': 'All eligible vendors have added products',
                    'count': 0
                })

            sent_count = 0
            failed_count = 0

            for vendor in vendors_without_products:
                try:
                    user = vendor.user

                    # Render email template
                    context = {
                        'vendor_name': f"{user.first_name} {user.last_name}",
                        'business_name': vendor.business_name,
                        'vendor_email': user.email,
                        'business_category': vendor.get_business_category_display(),
                        'add_product_url': f"{settings.FRONTEND_URL}/vendor/add-product",
                        'support_email': settings.DEFAULT_FROM_EMAIL,
                        'company_name': 'StuMart'
                    }

                    html_content = render_to_string('email/product_reminder.html', context)
                    # plain_content = render_to_string('emails/product_reminder.txt', context)

                    # Send email
                    email = EmailMessage(
                        subject='Add Your First Product - StuMart',
                        body=html_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[user.email],
                    )
                    email.content_subtype = 'html'
                    email.send()

                    sent_count += 1

                except Exception as e:
                    print(f"Failed to send product reminder to {vendor.user.email}: {str(e)}")
                    failed_count += 1

            return Response({
                'success': True,
                'message': f'Product reminder sent successfully to {sent_count} vendors',
                'count': sent_count,
                'failed_count': failed_count,
                'details': {
                    'total_eligible_vendors': vendors_without_products.count(),
                    'successfully_sent': sent_count,
                    'failed_to_send': failed_count
                }
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error sending product reminders: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # def get(self, request):
    #     """Get count of vendors without products (for preview)"""
    #     try:
    #         vendors_without_products = Vendor.objects.filter(
    #             user__products__isnull=True,
    #             user__kyc__verification_status='approved',  # Only KYC verified vendors
    #         ).exclude(
    #             business_category='others'
    #         ).distinct()

    #         # Get breakdown by category
    #         category_breakdown = vendors_without_products.values('business_category').annotate(
    #             count=models.Count('id')
    #         ).order_by('business_category')

    #         return Response({
    #             'success': True,
    #             'total_count': vendors_without_products.count(),
    #             'category_breakdown': list(category_breakdown),
    #             'message': f'Found {vendors_without_products.count()} eligible vendors without products'
    #         })

    #     except Exception as e:
    #         return Response({
    #             'success': False,
    #             'message': f'Error getting vendor count: {str(e)}'
    #         }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendNewsletterView(APIView):
    """Send newsletter to specified user groups"""
    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            data = request.data
            subject = data.get('subject', '')
            message = data.get('message', '')
            recipient_type = data.get('recipient_type', 'all')  # 'all', 'pickers', 'vendors'

            if not subject or not message:
                return Response({
                    'success': False,
                    'message': 'Subject and message are required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get recipients based on type
            if recipient_type == 'pickers':
                picker_users = User.objects.filter(user_type__in=['picker', 'student_picker'])
                recipients = [user.email for user in picker_users]
                group_name = 'Pickers'
            elif recipient_type == 'vendors':
                vendor_users = User.objects.filter(user_type='vendor')
                recipients = [user.email for user in vendor_users]
                group_name = 'Vendors'
            else:  # all users
                all_users = User.objects.exclude(user_type='admin')
                recipients = [user.email for user in all_users]
                group_name = 'All Users'

            if not recipients:
                return Response({
                    'success': True,
                    'message': f'No {group_name.lower()} found to send newsletter to',
                    'count': 0
                })

            sent_count = 0
            failed_count = 0

            # Send newsletter in batches to avoid overwhelming email service
            batch_size = 50
            for i in range(0, len(recipients), batch_size):
                batch_recipients = recipients[i:i + batch_size]
                
                try:
                    context = {
                        'subject': subject,
                        'message': message,
                        'company_name': 'StuMart',
                        'unsubscribe_url': f"{settings.FRONTEND_URL}/unsubscribe",
                        'support_email': settings.DEFAULT_FROM_EMAIL,
                    }
                    
                    html_content = render_to_string('email/newsletter.html', context)

                    # Send email
                    email = EmailMessage(
                        subject=f'{subject} - StuMart',
                        body=html_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        bcc=batch_recipients,  # Use BCC to hide recipients from each other
                    )
                    email.content_subtype = 'html'
                    email.send()
                    
                    sent_count += len(batch_recipients)

                except Exception as e:
                    print(f"Failed to send newsletter batch: {str(e)}")
                    failed_count += len(batch_recipients)

            return Response({
                'success': True,
                'message': f'Newsletter sent successfully to {sent_count} {group_name.lower()}',
                'count': sent_count,
                'failed_count': failed_count
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error sending newsletter: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminStatsView(APIView):
    """Get statistics for the utilities dashboard"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            stats = {
                'total_users': User.objects.exclude(user_type='admin').count(),
                'total_vendors': Vendor.objects.count(),
                'total_pickers': Picker.objects.count() + StudentPicker.objects.count(),
                'users_without_kyc': User.objects.filter(
                    Q(kyc__isnull=True) | 
                    Q(kyc__verification_status__in=['pending', 'rejected', 'none'])
                ).exclude(user_type='admin').count(),
                'vendors_without_products': 0,  # You'll need to implement based on your Product model
                'pending_kyc': KYCVerification.objects.filter(verification_status='pending').count(),
            }

            return Response({
                'success': True,
                'data': stats
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error fetching stats: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Optional: Create a combined utilities view for related operations
class AdminUtilitiesView(APIView):
    """Combined admin utilities view for multiple operations"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get admin utilities dashboard data"""
        try:
            operation = request.query_params.get('operation', 'stats')
            
            if operation == 'stats':
                return AdminStatsView().get(request)
            elif operation == 'users_count':
                count = User.objects.exclude(user_type='admin').count()
                return Response({'count': count})
            elif operation == 'kyc_pending_count':
                count = User.objects.filter(
                    Q(kyc__isnull=True) | 
                    Q(kyc__verification_status__in=['pending', 'rejected', 'none'])
                ).exclude(user_type='admin').count()
                return Response({'count': count})
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid operation'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error in admin utilities: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Handle admin utility operations"""
        try:
            operation = request.data.get('operation')
            
            if operation == 'send_kyc_reminder':
                return SendKYCReminderView().post(request)
            elif operation == 'send_product_reminder':
                return SendProductReminderView().post(request)
            elif operation == 'send_newsletter':
                return SendNewsletterView().post(request)
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid operation'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error in admin utilities: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)