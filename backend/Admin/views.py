# admin_dashboard/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from User.models import User, Vendor, Picker, StudentPicker, KYCVerification
from Stumart.models import Product, Order, OrderItem, Transaction
from order.models import VendorWallets
from .serializers import*
from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)
from django.template.loader import render_to_string
from django.utils.html import strip_tags

class DashboardStatsAPIView(APIView):
    """API endpoint for dashboard overview statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Authorization check
        if user.user_type != 'admin':
            return Response(
                {'error': 'Permission denied. Admin access required.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Date calculations
            today = timezone.now().date()
            last_week = today - timedelta(days=7)
            last_month = today - timedelta(days=30)
            
            # User statistics with optimized queries
            user_stats = self._get_user_stats(last_week, last_month)
            
            # Order statistics
            order_stats = self._get_order_stats(last_week)
            
            # Financial statistics
            financial_stats = self._get_financial_stats(last_week)
            
            # Product statistics
            product_stats = self._get_product_stats()
            
            return Response({
                'user_stats': user_stats,
                'order_stats': order_stats,
                'financial_stats': financial_stats,
                'product_stats': product_stats,
                'last_updated': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Dashboard stats error for user {user.id}: {str(e)}")
            return Response(
                {'error': 'An error occurred while fetching dashboard statistics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_user_stats(self, last_week, last_month):
        """Get user statistics with optimized queries"""
        # Single query to get user counts by type and date ranges
        user_counts = User.objects.aggregate(
            total=Count('id'),
            new_week=Count('id', filter=Q(date_joined__gte=last_week)),
            new_month=Count('id', filter=Q(date_joined__gte=last_month)),
            students=Count('id', filter=Q(user_type='student')),
            vendors=Count('id', filter=Q(user_type='vendor')),
            pickers=Count('id', filter=Q(user_type__in=['picker', 'student_picker']))
        )
        
        return {
            'total': user_counts['total'],
            'new_week': user_counts['new_week'],
            'new_month': user_counts['new_month'],
            'breakdown': {
                'students': user_counts['students'],
                'vendors': user_counts['vendors'],
                'pickers': user_counts['pickers']
            }
        }
    
    def _get_order_stats(self, last_week):
        """Get order statistics"""
        # First get all orders for different statuses
        total_paid = Order.objects.filter(order_status='PAID').count()
        recent_paid = Order.objects.filter(
            order_status='PAID',
            created_at__gte=last_week
        ).count()
        pending_orders = Order.objects.filter(order_status='PENDING').count()
        
        return {
            'total': total_paid,
            'recent': recent_paid,
            'pending': pending_orders
        }
    
    def _get_financial_stats(self, last_week):
        financial_data = Order.objects.filter(order_status='PAID').aggregate(
            total_sales=Sum('total'),
            total_profit=Sum('tax'),  # This should probably be a proper profit calculation
            recent_sales=Sum('total', filter=Q(created_at__gte=last_week))
        )
        
        return {
            'total_sales': float(financial_data['total_sales'] or 0),
            'total_profit': float(financial_data['total_profit'] or 0),
            'recent_sales': float(financial_data['recent_sales'] or 0)
        }
    
    def _get_product_stats(self):
        """Get product statistics"""
        product_counts = Product.objects.aggregate(
            total=Count('id'),
            out_of_stock=Count('id', filter=Q(in_stock=0))
        )
        
        return {
            'total': product_counts['total'],
            'out_of_stock': product_counts['out_of_stock']
        }


class UsersAPIView(APIView):
    """API endpoint for user management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        user_type = request.query_params.get('user_type', '')
        verified = request.query_params.get('verified', '')
        
        users = User.objects.all()
        
        if query:
            users = users.filter(
                Q(email__icontains=query) | 
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) |
                Q(phone_number__icontains=query)
            )
        
        if user_type:
            users = users.filter(user_type=user_type)
            
        if verified:
            is_verified = verified.lower() == 'true'
            users = users.filter(is_verified=is_verified)
            
        user_data = []
        for user in users:
            user_dict = {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'user_type': user.user_type,
                'is_verified': user.is_verified,
                'date_joined': user.date_joined,
                'institution': user.institution,
                'profile_pic': str(user.profile_pic) if user.profile_pic else None,
                'is_active': user.is_active
            }
            user_data.append(user_dict)
            # print("API Response:", user_data)
            
        return Response(user_data)
    
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Update fields from request
            if 'is_active' in request.data:
                user.is_active = request.data['is_active']
            if 'is_verified' in request.data:
                user.is_verified = request.data['is_verified']
            
            user.save()
            return Response({'status': 'success'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class VendorsAPIView(APIView):
    """API endpoint for vendor management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        category = request.query_params.get('category', '')
        verified = request.query_params.get('verified', '')
        
        # Use select_related to fetch user data efficiently
        vendors = Vendor.objects.select_related('user').all()
        
        if query:
            vendors = vendors.filter(
                Q(user__email__icontains=query) | 
                Q(business_name__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query)
            )
        
        if category:
            vendors = vendors.filter(business_category=category)
            
        if verified:
            is_verified = verified.lower() == 'true'
            # Filter by user's verification status
            vendors = vendors.filter(user__is_verified=is_verified)
            
        vendor_data = []
        for vendor in vendors:
            vendor_dict = {
                'id': vendor.id,
                'user_id': vendor.user.id,
                'email': vendor.user.email,
                'business_name': vendor.business_name,
                'business_category': vendor.business_category,
                'specific_category': vendor.specific_category,
                'shop_image': str(vendor.shop_image) if vendor.shop_image else None,
                'rating': vendor.rating,
                'total_ratings': vendor.total_ratings,
                'is_verified': vendor.user.is_verified,
                'bank_name': vendor.bank_name,
                'account_number': vendor.account_number,
                'account_name': vendor.account_name,
                'date_joined': vendor.user.date_joined,
                'user_name': f"{vendor.user.first_name} {vendor.user.last_name}",
                'phone_number': vendor.user.phone_number,
                'state':vendor.user.state,
                'institution':vendor.user.institution
            }
            
            # Get total products
            vendor_dict['total_products'] = Product.objects.filter(vendor=vendor.user).count()
            
            # Get total sales
            vendor_dict['total_sales'] = OrderItem.objects.filter(vendor=vendor).aggregate(
                total=Sum('price'))['total'] or 0
            
            vendor_data.append(vendor_dict)
            
        return Response(vendor_data)
    
    def put(self, request, vendor_id):
        try:
            vendor = Vendor.objects.select_related('user').get(id=vendor_id)
            
            # Update fields from request
            if 'is_verified' in request.data:
                # Update both vendor and user verification status
                is_verified = request.data['is_verified']
                vendor.user.is_verified = is_verified
                vendor.user.save()
            
            vendor.save()
            return Response({'status': 'success'})
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)


class PickersAPIView(APIView):
    """API endpoint for picker management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        picker_type = request.query_params.get('picker_type', '')  # 'picker' or 'student_picker'
        is_available = request.query_params.get('is_available', '')
        
        print(f"Debug - Parameters: query={query}, picker_type={picker_type}, is_available={is_available}")
        
        pickers_data = []
        
        # Get regular pickers
        if not picker_type or picker_type == 'picker':
            pickers = Picker.objects.select_related('user').all()
            print(f"Debug - Regular pickers count: {pickers.count()}")
            
            # Apply filters if provided
            if query:
                pickers = pickers.filter(
                    Q(user__email__icontains=query) | 
                    Q(user__first_name__icontains=query) |
                    Q(user__last_name__icontains=query) |
                    Q(user__phone_number__icontains=query)
                )
                print(f"Debug - After query filter, pickers count: {pickers.count()}")
                
            if is_available:
                is_avail = is_available.lower() == 'true'
                pickers = pickers.filter(is_available=is_avail)
                print(f"Debug - After availability filter, pickers count: {pickers.count()}")
                
            # Add to response data
            for picker in pickers:
                picker_dict = {
                    'id': picker.id,
                    'user_id': picker.user.id,
                    'email': picker.user.email,
                    'name': f"{picker.user.first_name} {picker.user.last_name}",
                    'phone_number': picker.user.phone_number,
                    'fleet_type': picker.fleet_type,
                    'is_available': picker.is_available,
                    'total_deliveries': picker.total_deliveries,
                    'rating': picker.rating,
                    'bank_name': picker.bank_name,
                    'account_number': picker.account_number,
                    'account_name': picker.account_name,
                    'date_joined': picker.user.date_joined,
                    'is_verified': picker.user.is_verified,
                    'picker_type': 'picker'
                }
                pickers_data.append(picker_dict)
        
        # Get student pickers
        if not picker_type or picker_type == 'student_picker':
            student_pickers = StudentPicker.objects.select_related('user').all()
            print(f"Debug - Student pickers count: {student_pickers.count()}")
            
            # Apply filters if provided
            if query:
                student_pickers = student_pickers.filter(
                    Q(user__email__icontains=query) | 
                    Q(user__first_name__icontains=query) |
                    Q(user__last_name__icontains=query) |
                    Q(user__phone_number__icontains=query) |
                    Q(hostel_name__icontains=query)
                )
                print(f"Debug - After query filter, student pickers count: {student_pickers.count()}")
                
            if is_available:
                is_avail = is_available.lower() == 'true'
                student_pickers = student_pickers.filter(is_available=is_avail)
                print(f"Debug - After availability filter, student pickers count: {student_pickers.count()}")
                
            # Add to response data
            for picker in student_pickers:
                picker_dict = {
                    'id': picker.id,
                    'user_id': picker.user.id,
                    'email': picker.user.email,
                    'name': f"{picker.user.first_name} {picker.user.last_name}",
                    'phone_number': picker.user.phone_number,
                    'hostel_name': picker.hostel_name,
                    'room_number': picker.room_number,
                    'is_available': picker.is_available,
                    'total_deliveries': picker.total_deliveries,
                    'rating': picker.rating,
                    'bank_name': picker.bank_name,
                    'account_number': picker.account_number,
                    'account_name': picker.account_name,
                    'date_joined': picker.user.date_joined,
                    'is_verified': picker.user.is_verified,
                    'picker_type': 'student_picker'
                }
                pickers_data.append(picker_dict)
        
            print(f"Debug - Final data count: {len(pickers_data)}")
        return Response(pickers_data)
    
    def put(self, request, picker_id, picker_type='picker'):
        try:
            if picker_type == 'picker':
                picker = Picker.objects.get(id=picker_id)
            else:
                picker = StudentPicker.objects.get(id=picker_id)
            
            # Update fields from request
            if 'is_available' in request.data:
                picker.is_available = request.data['is_available']
            
            if 'is_verified' in request.data and hasattr(picker, 'user'):
                picker.user.is_verified = request.data['is_verified']
                picker.user.save()
            
            picker.save()
            return Response({'status': 'success'})
        except (Picker.DoesNotExist, StudentPicker.DoesNotExist):
            return Response({'error': 'Picker not found'}, status=status.HTTP_404_NOT_FOUND)


class OrdersAPIView(APIView):
    """API endpoint for order management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, order_id=None):
        # If order_id is provided, return detailed view
        if order_id is not None:
            return self.get_order_detail(request, order_id)
        
        # Otherwise continue with list view
        query = request.query_params.get('query', '')
        status_filter = request.query_params.get('status', '')
        
        orders = Order.objects.all().order_by('-created_at')
        
        if query:
            orders = orders.filter(
                Q(order_number__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(phone__icontains=query)
            )
            
        if status_filter:
            orders = orders.filter(order_status=status_filter)
            
        order_data = []
        for order in orders:
            order_dict = {
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': f"{order.first_name} {order.last_name}",
                'email': order.email,
                'phone': order.phone,
                'address': order.address,
                'subtotal': order.subtotal,
                'shipping_fee': order.shipping_fee,
                'tax': order.tax,
                'total': order.total,
                'status': order.order_status,
                'created_at': order.created_at,
                'items_count': order.order_items.count()
            }
            
            # Get picker info if assigned
            if order.picker:
                order_dict['picker'] = {
                    'id': order.picker.id,
                    'name': f"{order.picker.first_name} {order.picker.last_name}",
                    'email': order.picker.email
                }
            
            order_data.append(order_dict)
            
        return Response(order_data)
    
    def get_order_detail(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
            
            # Get order items
            items = []
            for item in order.order_items.all():
                items.append({
                    'id': item.id,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'price': item.price,
                    'size': item.size,
                    'color': item.color,
                    'vendor_name': item.vendor.business_name,
                    'total': item.quantity * item.price
                })
            
            # Get transaction info
            transaction = Transaction.objects.filter(order=order).first()
            transaction_info = None
            if transaction:
                transaction_info = {
                    'id': transaction.id,
                    'transaction_id': transaction.transaction_id,
                    'amount': transaction.amount,
                    'status': transaction.status,
                    'payment_method': transaction.payment_method,
                    'created_at': transaction.created_at
                }
            
            order_detail = {
                'id': order.id,
                'order_number': order.order_number,
                'customer_name': f"{order.first_name} {order.last_name}",
                'email': order.email,
                'phone': order.phone,
                'address': order.address,
                'room_number': order.room_number,
                'subtotal': order.subtotal,
                'shipping_fee': order.shipping_fee,
                'tax': order.tax,
                'total': order.total,
                'status': order.order_status,
                'created_at': order.created_at,
                'items': items,
                'transaction': transaction_info
            }
            
            if order.picker:
                order_detail['picker'] = {
                    'id': order.picker.id,
                    'name': f"{order.picker.first_name} {order.picker.last_name}",
                    'email': order.picker.email
                }
            
            return Response(order_detail)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
            
            # Update fields from request
            if 'status' in request.data:
                order.order_status = request.data['status']
            
            if 'picker_id' in request.data:
                try:
                    picker = User.objects.get(id=request.data['picker_id'])
                    if picker.user_type in ['picker', 'student_picker']:
                        order.picker = picker
                except User.DoesNotExist:
                    return Response({'error': 'Picker not found'}, status=status.HTTP_404_NOT_FOUND)
            
            order.save()
            return Response({'status': 'success'})
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


class PaymentsAPIView(APIView):
    """API endpoint for payment management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        query = request.query_params.get('query', '')
        status_filter = request.query_params.get('status', '')
        
        transactions = Transaction.objects.all().order_by('-created_at')
        
        if query:
            transactions = transactions.filter(
                Q(transaction_id__icontains=query) |
                Q(order__order_number__icontains=query) |
                Q(order__email__icontains=query)
            )
            
        if status_filter:
            transactions = transactions.filter(status=status_filter)
            
        transaction_data = []
        for transaction in transactions:
            transaction_dict = {
                'id': transaction.id,
                'transaction_id': transaction.transaction_id,
                'order_number': transaction.order.order_number,
                'customer_name': f"{transaction.order.first_name} {transaction.order.last_name}",
                'amount': transaction.amount,
                'status': transaction.status,
                'payment_method': transaction.payment_method,
                'created_at': transaction.created_at
            }
            transaction_data.append(transaction_dict)
            
        return Response(transaction_data)
    
    def get_vendor_wallets(self, request):
        """Get all vendor wallets for payouts"""
        wallets = VendorWallets.objects.all().select_related('vendor__user')
        
        wallet_data = []
        for wallet in wallets:
            wallet_dict = {
                'id': wallet.id,
                'vendor_name': wallet.vendor.business_name,
                'vendor_email': wallet.vendor.user.email,
                'balance': wallet.balance,
                'bank_name': wallet.vendor.bank_name,
                'account_number': wallet.vendor.account_number,
                'account_name': wallet.vendor.account_name,
                'paystack_recipient_code': wallet.vendor.paystack_recipient_code,
                'created_at': wallet.created_at
            }
            wallet_data.append(wallet_dict)
            
        return Response(wallet_data)


class KYCVerificationAPIView(APIView):
    """API endpoint for KYC verification management"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status', '')
        user_type = request.query_params.get('user_type', '')
        
        verifications = KYCVerification.objects.all().select_related('user')
        
        if status_filter:
            verifications = verifications.filter(verification_status=status_filter)
            
        if user_type:
            verifications = verifications.filter(user__user_type=user_type)
            
        verification_data = []
        for verification in verifications:
            # Build absolute URIs for images
            selfie_image_url = None
            id_image_url = None
            
            if verification.selfie_image:
                selfie_image_url = request.build_absolute_uri(verification.selfie_image.url)
            
            if verification.id_image:
                id_image_url = request.build_absolute_uri(verification.id_image.url)
            
            verification_dict = {
                'id': verification.id,
                'user_id': verification.user.id,
                'user_email': verification.user.email,
                'user_name': f"{verification.user.first_name} {verification.user.last_name}",
                'user_type': verification.user.user_type,
                'id_type': verification.id_type,
                'selfie_image': selfie_image_url,
                'id_image': id_image_url,
                'verification_status': verification.verification_status,
                'submission_date': verification.submission_date,
                'verification_date': verification.verification_date,
                'rejection_reason': verification.rejection_reason
            }
            verification_data.append(verification_dict)
            
        return Response(verification_data)
    
    def put(self, request, verification_id):
        try:
            verification = KYCVerification.objects.get(id=verification_id)
            
            if 'verification_status' in request.data:
                verification.verification_status = request.data['verification_status']
                
                # Prepare email context
                context = {
                    'user': verification.user,
                    'verification_status': verification.verification_status,
                }
                
                if verification.verification_status == 'approved':
                    verification.verification_date = timezone.now()
                    # verification.user.is_verified = True
                    # verification.user.save()
                    
                elif verification.verification_status == 'rejected':
                    if 'rejection_reason' in request.data:
                        verification.rejection_reason = request.data['rejection_reason']
                        context['rejection_reason'] = verification.rejection_reason
                        # verification.user.is_verified = False
                        # verification.user.save()
                
                # Render and send email
                html_message = render_to_string(
                    'email/verification.html',
                    context
                )
                plain_message = strip_tags(html_message)
                
                subject = 'KYC Verification {}'.format(
                    'Approved' if verification.verification_status == 'approved' 
                    else 'Rejected'
                )
                
                try:
                    send_mail(
                        subject=subject,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[verification.user.email],
                        html_message=html_message,
                        message=plain_message,
                        fail_silently=False,
                    )
                except Exception as e:
                    logger.error(f"Failed to send verification email: {str(e)}")
                
                verification.save()
                return Response({'status': 'success'})
                
        except KYCVerification.DoesNotExist:
            return Response(
                {'error': 'Verification not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"KYC verification update error: {str(e)}")
            return Response(
                {'error': 'An error occurred while updating verification'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class ContactView(APIView):
    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        
        if serializer.is_valid():
            contact = serializer.save()
            
            # Send confirmation email to user
            send_mail(
                subject='Thank you for contacting StuMart',
                message=f"""Dear {contact.name},

                Thank you for reaching out to us. We have received your message and will get back to you shortly.

                Your message details:
                Subject: {contact.subject}
                Message: {contact.message}

                Best regards,
                The StuMart Team""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[contact.email],
                fail_silently=False,
            )
            
            # Send notification to admin
            send_mail(
                subject=f'New Contact Form Submission - {contact.subject}',
                message=f"""New contact form submission from {contact.name}

                Email: {contact.email}
                Subject: {contact.subject}
                Message: {contact.message}""",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Your message has been sent successfully!',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)