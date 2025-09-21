from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes
from django.db.models import Sum, Avg, Q, F, Count
import random
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from Stumart.models import Order, OrderItem, Transaction
from User.models import User, Picker, StudentPicker, KYCVerification, Vendor, Company, CompanyRider
from .serializers import *
from order .models import PickerWallet, VendorWallets
from django.conf import settings
from django.core.mail import send_mail
from decimal import Decimal
import logging
from User.models import Vendor
from django.db import transaction
from Stumart.models import PickerReview
from Stumart.serializers import PickerReviewSerializer
from rest_framework import generics

logger = logging.getLogger(__name__)

class PickerDashboardView(APIView):
    """
    API view for picker dashboard home page, showing overview statistics
    Support for picker, student_picker, and company user types
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        # Check if the user is a picker, student picker, or company
        if user.user_type not in ['picker', 'student_picker', 'company']:
            return Response({"error": "Only pickers and companies can access this dashboard"}, 
                            status=status.HTTP_403_FORBIDDEN)

        # Handle company user type
        if user.user_type == 'company':
            return self.get_company_dashboard_data(user)
        
        # Handle picker and student_picker user types (existing logic)
        return self.get_picker_dashboard_data(user)

    def get_picker_dashboard_data(self, user):
        """Get dashboard data for picker and student_picker user types"""
        # Get picker model based on user type with proper error handling
        try:
            if user.user_type == 'picker':
                picker_profile = user.picker_profile
            else:  # student_picker
                picker_profile = user.student_picker_profile
        except (User.picker_profile.RelatedObjectDoesNotExist, 
                User.student_picker_profile.RelatedObjectDoesNotExist):
            return Response(
                {"error": f"No {user.user_type.replace('_', ' ')} profile found for this user"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Get available orders count (packed orders ready for pickup)
        available_orders = Order.objects.filter(
            id__in=OrderItem.objects.filter(
                vendor__user__institution=user.institution,
                order__packed=True,
                order__order_status='PAID'
            ).values_list('order_id', flat=True).distinct()
        ).count()

        # ✅ Active deliveries
        active_delivery_ids = OrderItem.objects.filter(
            order__order_status='IN_TRANSIT',
            order__picker=user,
            vendor__user__institution=user.institution
        ).values_list('order_id', flat=True).distinct()

        active_deliveries = Order.objects.filter(id__in=active_delivery_ids).count()

        # ✅ Total earnings (shipping fees for completed deliveries)
        try:
            wallet = PickerWallet.objects.get(picker=user)
            total_earnings = wallet.amount if wallet.amount else 0
        except PickerWallet.DoesNotExist:
            # No wallet exists for this user yet
            total_earnings = 0

        # ✅ Recent Orders
        recent_orders = self.get_recent_orders_for_picker(user)

        # ✅ Final Response for picker/student_picker
        response_data = {
            'stats': {
                'availableOrders': available_orders,
                'activeDeliveries': active_deliveries,
                'earnings': total_earnings,
                'rating': picker_profile.rating,
            },
            'recent_orders': recent_orders
        }

        return Response(response_data)

    def get_company_dashboard_data(self, user):
        """Get dashboard data for company user type using CompanyRider statistics"""
        try:
            company_profile = user.company_profile
        except User.company_profile.RelatedObjectDoesNotExist:
            return Response(
                {"error": "No company profile found for this user"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all riders belonging to this company
        company_riders = CompanyRider.objects.filter(company=company_profile)

        # ✅ Available orders count (orders in company's delivery areas)
        # Get areas that this company serves
        company_areas = company_profile.delivery_areas.all()
        
        # Find orders in company's delivery areas that are packed and ready
        available_orders = Order.objects.filter(
            id__in=OrderItem.objects.filter(
                vendor__user__institution=user.institution,
                order__packed=True,
                order__order_status='PAID'
            ).values_list('order_id', flat=True).distinct(),
            # You might need to add area filtering based on your address structure
            # For now, using institution as proxy
        ).count()

        # ✅ Active deliveries (orders assigned to company riders)
        active_delivery_ids = OrderItem.objects.filter(
            order__order_status='IN_TRANSIT',
            order__company_picker=True,  # Orders assigned to company
            vendor__user__institution=user.institution
        ).values_list('order_id', flat=True).distinct()

        active_deliveries = Order.objects.filter(id__in=active_delivery_ids).count()

        # ✅ Total earnings (sum of all riders' earnings)
        total_earnings = company_riders.aggregate(
            total=Sum('total_earnings')
        )['total'] or 0

        # ✅ Company rating (average of all riders' ratings)
        avg_rating = company_riders.aggregate(
            avg_rating=Avg('rating')
        )['avg_rating'] or 0

        # ✅ Recent Orders for company
        recent_orders = self.get_recent_orders_for_company(user, company_profile)

        # ✅ Additional company-specific stats
        rider_stats = {
            'total_riders': company_riders.count(),
            'active_riders': company_riders.filter(status='active').count(),
            'busy_riders': company_riders.filter(status='busy').count(),
            'offline_riders': company_riders.filter(status='offline').count(),
            'total_completed_deliveries': company_riders.aggregate(
                total=Sum('completed_deliveries')
            )['total'] or 0
        }

        # Top performing rider
        top_rider = company_riders.filter(
            completed_deliveries__gt=0
        ).order_by('-rating', '-completed_deliveries').first()

        top_rider_info = None
        if top_rider:
            top_rider_info = {
                'name': top_rider.name,
                'rating': float(top_rider.rating),
                'completed_deliveries': top_rider.completed_deliveries,
                'total_earnings': float(top_rider.total_earnings)
            }

        # ✅ Final Response for company
        response_data = {
            'stats': {
                'availableOrders': available_orders,
                'activeDeliveries': active_deliveries,
                'earnings': float(total_earnings),
                'rating': float(avg_rating),
            },
            'recent_orders': recent_orders,
            'company_stats': {
                'rider_stats': rider_stats,
                'top_rider': top_rider_info,
                'delivery_areas': [area.name for area in company_areas],
                'company_name': company_profile.user.first_name + " " + company_profile.user.last_name,
            }
        }

        return Response(response_data)

    def get_recent_orders_for_picker(self, user):
        """Get recent orders for individual pickers"""
        recent_orders = []

        # Available Orders (packed and ready for pickup)
        available_order_ids = OrderItem.objects.filter(
            order__packed=True,
            vendor__user__institution=user.institution,
            order__order_status='PAID'
        ).values_list('order_id', flat=True).distinct()

        available_orders_qs = Order.objects.filter(id__in=available_order_ids).order_by('-created_at')[:3]

        for order in available_orders_qs:
            vendor_name = (
                order.order_items.first().vendor.business_name
                if order.order_items.exists() else "Unknown"
            )
            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'vendor_name': vendor_name,
                'delivery_location': f"{order.address}, Room: {order.room_number}" if order.room_number else order.address,
                'status': 'Available',
                'type': 'available'
            })

        # Active Orders (IN_TRANSIT) for this picker
        active_order_ids = OrderItem.objects.filter(
            order__order_status='IN_TRANSIT',
            order__picker=user,
            vendor__user__institution=user.institution
        ).values_list('order_id', flat=True).distinct()

        active_orders_qs = Order.objects.filter(id__in=active_order_ids).order_by('-created_at')[:2]

        for order in active_orders_qs:
            vendor_name = (
                order.order_items.first().vendor.business_name
                if order.order_items.exists() else "Unknown"
            )
            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'vendor_name': vendor_name,
                'delivery_location': f"{order.address}, Room: {order.room_number}" if order.room_number else order.address,
                'status': 'In Transit',
                'type': 'active'
            })

        # Sort by most recent and limit to 5
        recent_orders = sorted(recent_orders, key=lambda x: x['id'], reverse=True)[:5]
        return recent_orders

    def get_recent_orders_for_company(self, user, company_profile):
        """Get recent orders for company (orders in their delivery areas)"""
        recent_orders = []

        # Available Orders in company's delivery areas
        available_order_ids = OrderItem.objects.filter(
            order__packed=True,
            vendor__user__institution=user.institution,
            order__order_status='PAID'
        ).values_list('order_id', flat=True).distinct()

        available_orders_qs = Order.objects.filter(id__in=available_order_ids).order_by('-created_at')[:3]

        for order in available_orders_qs:
            vendor_name = (
                order.order_items.first().vendor.business_name
                if order.order_items.exists() else "Unknown"
            )
            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'vendor_name': vendor_name,
                'delivery_location': f"{order.address}, Room: {order.room_number}" if order.room_number else order.address,
                'status': 'Available',
                'type': 'available',
                'assigned_rider': None
            })

        # Active Orders assigned to company riders
        active_order_ids = OrderItem.objects.filter(
            order__order_status='IN_TRANSIT',
            order__company_picker=True,
            vendor__user__institution=user.institution
        ).values_list('order_id', flat=True).distinct()

        active_orders_qs = Order.objects.filter(id__in=active_order_ids).order_by('-created_at')[:2]

        for order in active_orders_qs:
            vendor_name = (
                order.order_items.first().vendor.business_name
                if order.order_items.exists() else "Unknown"
            )
            
            # Try to find the assigned rider (you might need to add a field to track this)
            assigned_rider = None
            if order.company_picker_email:
                try:
                    rider = CompanyRider.objects.get(
                        email=order.company_picker_email,
                        company=company_profile
                    )
                    assigned_rider = rider.name
                except CompanyRider.DoesNotExist:
                    assigned_rider = "Unknown Rider"

            recent_orders.append({
                'id': order.id,
                'order_number': order.order_number,
                'vendor_name': vendor_name,
                'delivery_location': f"{order.address}, Room: {order.room_number}" if order.room_number else order.address,
                'status': 'In Transit',
                'type': 'active',
                'assigned_rider': assigned_rider
            })

        # Sort by most recent and limit to 5
        recent_orders = sorted(recent_orders, key=lambda x: x['id'], reverse=True)[:5]
        return recent_orders



class AvailableOrdersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        filter_param = request.query_params.get('filter', 'all')
        
        if user.user_type not in ['picker', 'student_picker', 'company']:
            return Response({"error": "Only pickers can access this page"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Base query - get orders that are packed and ready for pickup in the same institution
        base_query = Order.objects.filter(
            id__in=OrderItem.objects.filter(
                vendor__user__institution=user.institution,
                order__packed=True,
                order__order_status='PAID'
            ).values_list('order_id', flat=True).distinct()
        )
        
        # Apply filters
        if filter_param == 'nearby':
            available_orders = base_query.order_by('id')[:10]
        elif filter_param == 'high_value':
            available_orders = base_query.order_by('-total')
        else:  # 'all' or any other value
            available_orders = base_query.order_by('-created_at')
        
        # Prepare detailed response data
        orders_data = []
        for order in available_orders:
            # Get first vendor details from order items
            order_items = OrderItem.objects.filter(order=order)
            first_order_item = order_items.first()
            
            if (first_order_item and first_order_item.vendor):
                vendor = first_order_item.vendor
                vendor_name = vendor.business_name
                pickup_location = f"{vendor.user.institution}, {vendor.user.state}"
            else:
                vendor_name = "Unknown"
                pickup_location = "Unknown"
            
            # Get all items for this order
            items = []
            for item in order_items:
                items.append({
                    'id': item.id,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'price': float(item.price)
                })
            
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'vendor_name': vendor_name,
                'pickup_location': pickup_location,
                'delivery_location': f"{order.address}, Room: {order.room_number}" if order.room_number else order.address,
                'total': float(order.subtotal),
                'shipping_fee': float(order.shipping_fee),
                'items': items
            })
        
        return Response(orders_data)
    
    def post(self, request, order_id):
        user = request.user
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can accept orders"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get the order - check if it's packed and ready for pickup
        try:
            order = Order.objects.get(id=order_id, packed=True)
        except Order.DoesNotExist:
            return Response({"error": "Order not found or not ready for pickup"}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Check if any order item's vendor is in the same institution
        order_items = OrderItem.objects.filter(order=order)
        vendor_institutions = set(item.vendor.user.institution for item in order_items)
        
        if user.institution not in vendor_institutions:
            return Response({
                "error": "You can only accept orders from your institution"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Update order status and assign picker
        order.order_status = 'IN_TRANSIT'
        order.picker = user
        order.save()

        email = order.email
        send_mail(
            subject=f"Order #{order.order_number} Packed",
            message=(
                f"Hello {order.first_name},\n\n"
                f"Your order #{order.order_number} has been picked by a picker and will be delivered soon.\n\n"
                "Thank you for your patronage!"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False
        )
        
        return Response({
            "message": "Order accepted successfully"
        }, status=status.HTTP_200_OK)


class MyDeliveriesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        delivery_status = request.query_params.get('status', 'active')
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker', 'company']:
            return Response({"error": "Only pickers can access this page"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get deliveries based on status
        if delivery_status == 'active':
            deliveries = Order.objects.filter(
                order_status='IN_TRANSIT',
                picker=user,
            ).order_by('-created_at')
        elif delivery_status == 'completed':
            # Fixed: Use __in to check for multiple statuses
            deliveries = Order.objects.filter(
                order_status__in=['COMPLETED', 'DELIVERED'],
                picker=user,
            ).order_by('-created_at')
        else:
            # Handle other cases or default to empty
            deliveries = Order.objects.none()

        # Prepare detailed response data
        deliveries_data = []
        for delivery in deliveries:
            # Get vendor details - Fixed: Get vendor from order items instead
            first_order_item = OrderItem.objects.filter(order=delivery).first()
            if first_order_item and first_order_item.vendor:
                vendor_name = first_order_item.vendor.business_name
            else:
                vendor_name = "Unknown"
            
            # Get customer details
            customer_name = f"{delivery.first_name} {delivery.last_name}"
            
            # Get order items count
            items_count = OrderItem.objects.filter(order=delivery).count()
            
            deliveries_data.append({
                'id': delivery.id,
                'order_number': delivery.order_number,
                'vendor_name': vendor_name,
                'customer_name': customer_name,
                'delivery_location': f"{delivery.address}, Room: {delivery.room_number}" if delivery.room_number else delivery.address,
                'items_count': items_count,
                'total': float(delivery.total),
                'shipping_fee': float(delivery.shipping_fee),
                'status': delivery.order_status,
                'created_at': delivery.created_at.strftime('%Y-%m-%d %H:%M'),
            })

        # print(deliveries_data)
        # Fixed: Sort and limit after the loop, not inside it
        deliveries_data = sorted(deliveries_data, key=lambda x: x['created_at'], reverse=True)
        
        return Response(deliveries_data)
    
    def post(self, request, order_id):
        """
        Mark an order as delivered
        """
        user = request.user
        print(order_id)
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can update deliveries"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get the order
        try:
            order = Order.objects.get(
                id=order_id,
                order_status='IN_TRANSIT',
                picker=user
            )
        except Order.DoesNotExist:
            return Response({"error": "Order not found or not in transit"}, 
                           status=status.HTTP_404_NOT_FOUND)
        
        # Update order status
        order.order_status = 'DELIVERED'
        order.save()

        # Fixed: Check for correct user type (was checking 'student' instead of picker types)
        # if user.user_type in ['picker', 'student_picker']:
        #     try:
        #         wallet, created = PickerWallet.objects.get_or_create(
        #             picker=user,
        #             defaults={'amount': 0}
        #         )
        #         wallet.amount += order.shipping_fee
        #         wallet.save()
        #     except Exception as e:
        #         print(f"Error updating wallet: {e}")
        
        # Update picker statistics with proper error handling
        try:
            if user.user_type == 'picker':
                picker = user.picker_profile
                picker.total_deliveries += 1
                picker.save()
            else:  # student_picker
                student_picker = user.student_picker_profile
                student_picker.total_deliveries += 1
                student_picker.save()
        except (User.picker_profile.RelatedObjectDoesNotExist, 
                User.student_picker_profile.RelatedObjectDoesNotExist):
            print(f"No picker profile found for user {user.email}")
        
        return Response({"message": "Order marked as delivered"}, 
                       status=status.HTTP_200_OK)


class EarningsView(APIView):
    """
    API view for showing picker earnings
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get('period', 'week')

        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can access this page"},
                            status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = None  # All time

        # Define base queryset
        base_query = Order.objects.filter(picker=user)
        if start_date:
            base_query = base_query.filter(created_at__gte=start_date)

        # Get total earnings and order count
        earnings_data = base_query.aggregate(
            total_earnings=Sum('shipping_fee'),
            order_count=Count('id')
        )

        # Wallet balance
        wallet = PickerWallet.objects.get(picker=user)
        amount = wallet.amount

        # Daily earnings breakdown
        daily_earnings = []
        if period in ['week', 'month']:
            days_back = 7 if period == 'week' else 30

            for i in range(days_back, -1, -1):
                day = now - timedelta(days=i)
                day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)

                day_total = base_query.filter(
                    created_at__range=(day_start, day_end)
                ).aggregate(
                    daily_total=Sum('shipping_fee')
                )['daily_total'] or 0

                daily_earnings.append({
                    'date': day_start.strftime('%Y-%m-%d'),
                    'amount': float(day_total)
                })

        response_data = {
            'wallet_balance': float(amount),
            'total_earnings': float(earnings_data['total_earnings'] or 0),
            'order_count': earnings_data['order_count'] or 0,
            'average_per_order': float(earnings_data['total_earnings'] / earnings_data['order_count']) if earnings_data['order_count'] else 0,
            'period': period,
            'daily_earnings': daily_earnings
        }

        return Response(response_data)


class ReviewsView(APIView):
    """
    API view for displaying picker reviews and ratings
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can access this page"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # For the purpose of this example, we'll simulate reviews
        # In a real application, you'd have a Review model to store these
        
        # Get the picker's rating
        if user.user_type == 'picker':
            picker = user.picker_profile
            rating = picker.rating
        else:
            student_picker = user.student_picker_profile
            rating = student_picker.rating
        
        # Simulate some reviews
        reviews = [
            {
                'id': 1,
                'order_number': 'ORD123456',
                'customer_name': 'John Doe',
                'rating': 5,
                'comment': 'Very fast delivery and friendly service!',
                'date': (timezone.now() - timedelta(days=2)).strftime('%Y-%m-%d')
            },
            {
                'id': 2,
                'order_number': 'ORD123457',
                'customer_name': 'Jane Smith',
                'rating': 4,
                'comment': 'Good service, arrived on time.',
                'date': (timezone.now() - timedelta(days=5)).strftime('%Y-%m-%d')
            },
            {
                'id': 3,
                'order_number': 'ORD123458',
                'customer_name': 'Bob Johnson',
                'rating': 5,
                'comment': 'Excellent service! Will use again.',
                'date': (timezone.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            }
        ]
        
        response_data = {
            'average_rating': float(rating),
            'total_reviews': len(reviews),
            'reviews': reviews
        }
        
        return Response(response_data)


class SettingsView(APIView):
    """
    API view for picker profile settings
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can access this page"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Get picker or student picker profile
        if user.user_type == 'picker':
            profile = user.picker_profile
            profile_data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'institution': user.institution,
                'state': user.state,
                'profile_pic': user.profile_pic.url if user.profile_pic else None,
                'fleet_type': profile.fleet_type,
                'is_available': profile.is_available,
                'bank_name': profile.bank_name,
                'account_number': profile.account_number,
                'account_name': profile.account_name,
                'is_verified': user.is_verified
            }
        else:
            profile = user.student_picker_profile
            profile_data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'institution': user.institution,
                'state': user.state,
                'profile_pic': user.profile_pic.url if user.profile_pic else None,
                'hostel_name': profile.hostel_name,
                'room_number': profile.room_number,
                'is_available': profile.is_available,
                'bank_name': profile.bank_name,
                'account_number': profile.account_number,
                'account_name': profile.account_name,
                'is_verified': user.is_verified
            }
        
        return Response(profile_data)
    
    def patch(self, request):
        """
        Update picker profile settings
        """
        user = request.user
        
        # Check if the user is a picker or student picker
        if user.user_type not in ['picker', 'student_picker']:
            return Response({"error": "Only pickers can update their profile"}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Update user fields
        user_fields = ['first_name', 'last_name', 'phone_number']
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        # Handle profile picture separately
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        
        # Save user changes
        user.save()
        
        # Update picker or student picker profile
        if user.user_type == 'picker':
            profile = user.picker_profile
            picker_fields = ['fleet_type', 'is_available', 'bank_name', 'account_number', 'account_name']
            for field in picker_fields:
                if field in request.data:
                    setattr(profile, field, request.data[field])
            profile.save()
        else:
            profile = user.student_picker_profile
            student_picker_fields = ['hostel_name', 'room_number', 'is_available', 'bank_name', 'account_number', 'account_name']
            for field in student_picker_fields:
                if field in request.data:
                    setattr(profile, field, request.data[field])
            profile.save()
        
        return Response({"message": "Profile updated successfully"}, 
                       status=status.HTTP_200_OK)


class OrderDetailView(APIView):
    """
    API view for getting detailed information about a specific order
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id):
        user = request.user
        
        if user.user_type not in ['picker', 'student_picker']:
            return Response({
                "error": "Only pickers can access this page"
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            order = Order.objects.get(id=order_id)
            
            # Check permissions:
            # 1. User's institution matches order user's institution OR
            # 2. User is the assigned picker for this order
            if not (user):
                return Response({
                    "error": "You don't have permission to view this order"
                }, status=status.HTTP_403_FORBIDDEN)
            
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Get customer details
        customer_name = f"{order.first_name} {order.last_name}"
        customer_phone = order.phone
        
        # Group items by vendor
        vendor_items = {}
        for item in OrderItem.objects.filter(order=order).select_related('vendor', 'vendor__user', 'product'):
            if item.vendor.id not in vendor_items:
                vendor_items[item.vendor.id] = {
                    'vendor_info': {
                        'id': item.vendor.id,
                        'name': item.vendor.business_name,
                        'phone': item.vendor.user.phone_number,
                        'location': f"{item.vendor.user.institution}, {item.vendor.user.state}",
                        'category': item.vendor.business_category,
                    },
                    'items': []
                }
            
            vendor_items[item.vendor.id]['items'].append({
                'id': item.id,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price': float(item.price),
                'size': item.size,
                'color': item.color,
                'subtotal': float(item.price * item.quantity)
            })
        
        # Calculate subtotals per vendor
        for vendor_data in vendor_items.values():
            vendor_data['subtotal'] = sum(item['subtotal'] for item in vendor_data['items'])
        
        # Prepare response
        order_data = {
            'id': order.id,
            'order_number': order.order_number,
            'vendors': list(vendor_items.values()),
            'customer': {
                'name': customer_name,
                'phone': customer_phone,
                'address': order.address,
                'room_number': order.room_number
            },
            'order_summary': {
                'subtotal': float(order.subtotal),
                'shipping_fee': float(order.shipping_fee),
                'tax': float(order.tax),
                'total': float(order.total)
            },
            'status': order.order_status,
            'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
            'is_assigned': bool(order.picker),
            'is_assigned_to_me': order.picker == user
        }
        
        return Response(order_data)


class ConfirmDeliveryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, id):
        user = request.user
        
        try:
            if user.user_type != 'student':
                return Response("You are not permitted", status=status.HTTP_401_UNAUTHORIZED)
                        
            order = Order.objects.get(id=id)
            picker = order.picker
            
            if order.order_status == "DELIVERED":
                # First, update order status to COMPLETED
                order.order_status = "COMPLETED"
                order.save()
                
                # Update picker wallet
                wallet, created = PickerWallet.objects.get_or_create(picker=picker)
                
                if not created:
                    # Convert both values to Decimal for consistent arithmetic
                    current_amount = Decimal(str(wallet.amount if wallet.amount else '0'))
                    shipping_fee = Decimal(str(order.shipping_fee))
                    wallet.amount = current_amount + shipping_fee
                else:
                    # Use the shipping_fee directly since it's already a Decimal
                    wallet.amount = order.shipping_fee
                
                wallet.save()
                
                # Calculate vendor totals from order items
                order_items = order.order_items.all()  # Assuming reverse FK name is orderitem_set
                vendor_totals = {}
                
                for item in order_items:
                    vendor_id = item.vendor.id
                    item_total = item.quantity * item.price
                    
                    if vendor_id in vendor_totals:
                        vendor_totals[vendor_id] += item_total
                    else:
                        vendor_totals[vendor_id] = item_total
                
                # Update vendor wallets and send emails
                vendor_emails_sent = []
                for vendor_id, amount in vendor_totals.items():
                    try:
                        vendor = Vendor.objects.get(id=vendor_id)
                        wallet, created = VendorWallets.objects.get_or_create(
                            vendor=vendor,
                            defaults={'balance': 0}
                        )
                        wallet.balance += amount
                        wallet.save()
                        logger.info(f"Updated wallet for vendor {vendor_id}, new balance: {wallet.balance}")
                        
                        # Send email notification to vendor
                        try:
                            subject = f"Order #{order.id} Delivered - Payment Credited"
                            message = f"""
                            Dear {vendor.name if hasattr(vendor, 'name') else 'Vendor'},

                            We are pleased to inform you that Order #{order.id} has been successfully delivered.

                            Order Details:
                            - Order ID: {order.id}
                            - Amount Credited: ${amount}
                            - Current Wallet Balance: ${wallet.balance}
                            - Delivery Date: {order.updated_at.strftime('%Y-%m-%d %H:%M:%S') if order.updated_at else 'N/A'}

                            The payment for your items has been credited to your wallet.

                            Thank you for your business!

                            Best regards,
                            Your Platform Team
                            """
                            
                            send_mail(
                                subject=subject,
                                message=message,
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                recipient_list=[vendor.email] if hasattr(vendor, 'email') and vendor.email else [],
                                fail_silently=False,
                            )
                            vendor_emails_sent.append(vendor_id)
                            logger.info(f"Email sent to vendor {vendor_id}")
                            
                        except Exception as email_error:
                            logger.error(f"Failed to send email to vendor {vendor_id}: {str(email_error)}")
                            # Continue processing other vendors even if email fails
                            
                    except Vendor.DoesNotExist:
                        logger.error(f"Vendor with ID {vendor_id} not found when processing payment")
                        continue
                
                return Response({
                    "status": "success",
                    "message": "Order has been delivered successfully",
                    "details": {
                        "order_id": order.id,
                        "picker_payment": float(order.shipping_fee),
                        "vendor_payments": {str(k): float(v) for k, v in vendor_totals.items()},
                        "emails_sent_to_vendors": vendor_emails_sent
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "status": "error",
                    "message": "Order is not in DELIVERED status"
                }, status=status.HTTP_400_BAD_REQUEST)
                    
        except Order.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Order does not exist"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in ConfirmDeliveryView: {str(e)}")
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

# Get reviews for a picker
class PickerReviewsAPIView(APIView):
    """
    Get all reviews for a picker (either regular picker or student picker)
    Returns reviews with statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            picker_profile = None
            picker_type = None
            
            # Check if user is a regular picker
            if user.user_type == 'picker':
                try:
                    picker_profile = user.picker_profile
                    picker_type = 'picker'
                except AttributeError:
                    pass
            
            # Check if user is a student picker
            elif user.user_type == 'student_picker':
                try:
                    picker_profile = user.student_picker_profile
                    picker_type = 'student_picker'
                except AttributeError:
                    pass
            
            # If no picker profile found, return error
            if not picker_profile:
                return Response(
                    {'error': 'No picker profile found for this user'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all reviews for this picker
            reviews = PickerReview.objects.filter(
                picker=user
            ).select_related(
                'reviewer', 'order', 'picker'
            ).order_by('-created_at')
            
            # Calculate review statistics
            stats = reviews.aggregate(
                total_reviews=Count('id'),
                average_rating=Avg('rating')
            )
            
            # Handle case where there are no reviews (Avg returns None)
            if stats['average_rating'] is None:
                stats['average_rating'] = 0
            
            # Get rating breakdown (count of each rating 1-5)
            rating_breakdown = {}
            for rating in range(1, 6):
                rating_breakdown[rating] = reviews.filter(rating=rating).count()
            
            stats['rating_breakdown'] = rating_breakdown
            
            # Serialize reviews
            review_serializer = PickerReviewSerializer(
                reviews,
                many=True,
                context={'request': request}
            )
            
            # Format picker info based on picker type
            if picker_type == 'picker':
                picker_info = {
                    'id': picker_profile.id,
                    'picker_name': f"{user.first_name} {user.last_name}",
                    'fleet_type': picker_profile.fleet_type,
                    'total_deliveries': picker_profile.total_deliveries,
                    'is_available': picker_profile.is_available,
                    'picker_type': 'Regular Picker'
                }
            else:  # student_picker
                picker_info = {
                    'id': picker_profile.id,
                    'picker_name': f"{user.first_name} {user.last_name}",
                    'hostel_name': picker_profile.hostel_name,
                    'room_number': picker_profile.room_number,
                    'total_deliveries': picker_profile.total_deliveries,
                    'is_available': picker_profile.is_available,
                    'picker_type': 'Student Picker'
                }
            
            # Format the response data
            response_data = {
                'reviews': review_serializer.data,
                'stats': {
                    'total_reviews': stats['total_reviews'],
                    'average_rating': round(float(stats['average_rating']), 1),
                    'rating_breakdown': stats['rating_breakdown']
                },
                'picker_info': picker_info
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in PickerReviewsAPIView: {str(e)}")
            
            return Response(
                {'error': 'An error occurred while fetching picker reviews'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )