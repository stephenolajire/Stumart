# vendor/views.py
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from User.models import Vendor
from rest_framework.views import APIView
from Stumart.models import Product, Order, OrderItem, Transaction, Wallet
from .models import VendorStats, VendorRevenueData, VendorSalesData, Withdrawal
from .serializers import (
    ProductSerializer, OrderSerializer, TransactionSerializer,  DashboardStatsSerializer, WithdrawalSerializer
)
from Stumart.models import *
from django.db import transaction
import requests
from django.conf import settings
import uuid
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse
from decimal import Decimal
from rest_framework import generics
from Stumart.serializers import VendorReviewSerializer
from Stumart.models import VendorReview

class DashboardStatsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get vendor associated with the current user
        try:
            vendor = request.user.vendor_profile
            print(f"Found vendor: {vendor}")
        except Vendor.DoesNotExist:
            return Response({"error": "You are not registered as a vendor"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or create fresh stats (don't delete existing ones unnecessarily)
        stats = self._get_or_create_vendor_stats(vendor)

        all_products = Product.objects.filter(vendor=request.user)
        low_stock = all_products.filter(in_stock__lt=5).count()
        
        # Get chart data
        revenue_data = VendorRevenueData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        sales_data = VendorSalesData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        
        # Get real-time wallet balance
        try:
            wallet = Wallet.objects.get(vendor=vendor)
            wallet_balance = float(wallet.balance)
        except Wallet.DoesNotExist:
            wallet_balance = 0.0
        
        # Prepare response data - use wallet balance for real-time revenue
        data = {
            'totalSales': wallet_balance,  # Use actual wallet balance
            'totalOrders': stats.total_orders,
            'totalProducts': all_products.count(),
            'lowStock': low_stock,
            'totalRevenue': wallet_balance,  # Use actual wallet balance
            'pendingReviews': stats.pending_reviews,
            'revenueData': [{'month': rd.month, 'value': float(rd.value)} for rd in revenue_data],
            'salesData': [{'month': sd.month, 'value': sd.value} for sd in sales_data],
        }
        
        return Response(data, status=status.HTTP_200_OK)
    
    def _get_or_create_vendor_stats(self, vendor):
        """Get existing stats or create new ones, always update financial data in real-time"""
        try:
            stats = VendorStats.objects.get(vendor=vendor)
            # Always update financial data in real-time for immediate wallet reflection
            stats = self._update_financial_stats(stats, vendor)
            return stats
        except VendorStats.DoesNotExist:
            return self._create_vendor_stats(vendor)
    
    def _update_financial_stats(self, stats, vendor):
        """Update only financial stats without recalculating everything"""
        # Get real-time order items
        order_items = OrderItem.objects.filter(vendor=vendor)
        
        # Update order count and sales from actual data
        total_orders = order_items.values('order').distinct().count()
        
        # Get wallet balance for real-time revenue
        try:
            wallet = Wallet.objects.get(vendor=vendor)
            total_sales = wallet.balance
        except Wallet.DoesNotExist:
            total_sales = 0
        
        # Update the stats object
        stats.total_orders = total_orders
        stats.total_sales = total_sales
        stats.save()
        
        return stats
    
    def _create_vendor_stats(self, vendor):
        
        # Debug products
        products_by_user = Product.objects.filter(vendor=vendor.user)
        
        # Calculate all statistics
        total_products = products_by_user.count()
        low_stock = products_by_user.filter(in_stock__lt=5).count()
        
        
        # Get order items for this vendor
        order_items = OrderItem.objects.filter(vendor=vendor)
        
        total_orders = order_items.values('order').distinct().count()
        
        # Get actual wallet balance instead of calculating from order items
        try:
            wallet = Wallet.objects.get(vendor=vendor)
            total_sales = wallet.balance
            
        except Wallet.DoesNotExist:
            # Fallback to calculation if no wallet exists
            total_sales = order_items.aggregate(Sum('price'))['price__sum'] or 0
            
        
        # Create stats object
        stats = VendorStats.objects.create(
            vendor=vendor,
            total_sales=total_sales,
            total_orders=total_orders,
            total_products=total_products,
            low_stock_products=low_stock,
        )
        
        # Generate/update chart data
        self._update_chart_data(vendor, order_items)
        
        return stats
    
    def _update_chart_data(self, vendor, order_items=None):
       
        
        # If order_items not provided, try to get them
        if order_items is None:
            try:
                order_items = OrderItem.objects.filter(vendor=vendor)
            except:
                order_items = OrderItem.objects.none()
        
        # Get the last 6 months
        today = timezone.now()
        months = []
        for i in range(5, -1, -1):
            month_date = today - timedelta(days=30*i)
            months.append((month_date.strftime("%b"), month_date.year, month_date.month))
        
        # Clear previous data and recreate
        VendorRevenueData.objects.filter(vendor=vendor).delete()
        VendorSalesData.objects.filter(vendor=vendor).delete()
        
        for month_name, year, month_num in months:
            # Get order items for this month
            start_date = datetime(year, month_num, 1)
            if month_num == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month_num + 1, 1)
            
            month_order_items = order_items.filter(
                order__created_at__gte=start_date,
                order__created_at__lt=end_date
            )
            
            # Calculate revenue from completed orders only
            completed_orders = month_order_items.filter(order__order_status='COMPLETED')
            revenue = completed_orders.aggregate(Sum('price'))['price__sum'] or 0
            
            VendorRevenueData.objects.create(
                vendor=vendor,
                month=month_name,
                year=year,
                value=revenue
            )
            
            # Calculate order count
            orders_count = month_order_items.values('order').distinct().count()
            VendorSalesData.objects.create(
                vendor=vendor,
                month=month_name,
                year=year,
                value=orders_count
            )
            
            
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        return Product.objects.filter(vendor=vendor.user)
    
    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)


class OrderView(APIView):
    def get(self, request):
        vendor = request.user.vendor_profile
        # Get all orders that contain items from this vendor
        order_items = OrderItem.objects.filter(vendor=vendor)
        orders = Order.objects.filter(order_items__in=order_items).distinct()
        
        serializer = OrderSerializer(orders, many=True, context={'vendor': vendor})
        return Response(serializer.data)


class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        vendor = request.user.vendor_profile
        products = Product.objects.filter(vendor=vendor.user)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        try:
            product = Product.objects.get(pk=pk, vendor=request.user)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)
        
        new_stock = request.data.get('stock')
        if new_stock is None:
            return Response({"error": "Stock value is required"}, status=400)
        
        product.in_stock = new_stock
        product.save()
        return Response({"success": "Stock updated", "new_stock": new_stock})


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        # Get transactions for orders with items from this vendor
        vendor_orders = Order.objects.filter(order_items__vendor=vendor).values_list('id', flat=True)
        return Transaction.objects.filter(order__id__in=vendor_orders)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find orders containing items from this vendor with PAID status
        vendor_order_items = OrderItem.objects.filter(vendor=vendor)
        vendor_orders = Order.objects.filter(
            order_items__in=vendor_order_items,
            order_status='PAID'
        ).distinct()
        
        # Get transaction amounts for these paid orders
        transactions = Transaction.objects.filter(order__in=vendor_orders)
        
        # Get wallet balance with fallback to 0
        try:
            wallet_balance = Wallet.objects.get(vendor=vendor).balance
        except Wallet.DoesNotExist:
            wallet = Wallet.objects.create(
                vendor=vendor,
                balance=0
            )
            wallet_balance = wallet.balance
        
        # Calculate stats from paid orders only
        total_amount = vendor_orders.aggregate(Sum('subtotal'))['subtotal__sum'] or 0
        pending_amount = Order.objects.filter(
            order_status__in=['PENDING', 'PROCESSING']
        ).aggregate(Sum('total'))['total__sum'] or 0
        
        return Response({
            'total_amount': float(total_amount),
            'paid_amount': float(wallet_balance),
            'pending_amount': float(pending_amount),
            'total_transactions': transactions.count()
        })
    
    @action(detail=False, methods=['post'])
    def withdraw(self, request):
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            wallet = Wallet.objects.get(vendor=vendor)
        except Wallet.DoesNotExist:
            return Response({"error": "Wallet not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate withdrawal amount
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = float(amount)
        except ValueError:
            return Response({"error": "Invalid amount format"}, status=status.HTTP_400_BAD_REQUEST)
        
        if wallet.balance < amount:
            return Response({"error": "Insufficient balance"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate a unique reference for this withdrawal
        reference = f"WDR-{uuid.uuid4().hex[:10]}"
        
        # Check if bank details are available
        if not vendor.bank_name or not vendor.account_number or not vendor.account_name:
            return Response({"error": "Bank account details are incomplete"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create withdrawal record
        withdrawal = Withdrawal.objects.create(
            vendor=vendor,
            amount=amount,
            reference=reference,
            status="PROCESSING"
        )
        
        # For real payment processing with Paystack, you'd use the code you already have
        # But for testing or if you're not yet integrated with Paystack, you could simplify:
        
        # Deduct the amount from wallet
        wallet.balance -= Decimal(str(amount))
        wallet.save()
        
        return Response({
            "success": "Withdrawal request submitted successfully",
            "reference": reference,
            "status": "processing"
        })
    @action(detail=False, methods=['get'])
    def withdrawal_history(self, request):
        vendor = request.user.vendor_profile
        
        # Get all withdrawals for this vendor
        withdrawals = Withdrawal.objects.filter(vendor=vendor).order_by('-created_at')
        
        # Serialize the data
        serializer = WithdrawalSerializer(withdrawals, many=True)
        
        return Response(serializer.data)
    
    # @action(detail=False, methods=['post'])
    # def withdraw(self, request):
    #     vendor = request.user
        
    #     try:
    #         wallet = Wallet.objects.get(vendor=vendor)
    #     except Wallet.DoesNotExist:
    #         return Response({"error": "Wallet not found"}, status=404)
        
    #     # Validate withdrawal amount
    #     amount = request.data.get('amount')
    #     if not amount:
    #         return Response({"error": "Amount is required"}, status=400)
        
    #     try:
    #         amount = float(amount)
    #     except ValueError:
    #         return Response({"error": "Invalid amount format"}, status=400)
        
    #     if wallet.balance < amount:
    #         return Response({"error": "Insufficient balance"}, status=400)
        
    #     # Generate a unique reference for this withdrawal
    #     reference = f"WDR-{uuid.uuid4().hex[:10]}"
        
    #     # Check if bank details are available
    #     if not vendor.account_number or not vendor.bank_name or not vendor.account_name:
    #         return Response({"error": "Bank account details are incomplete"}, status=400)
        
    #     # Create withdrawal record
    #     withdrawal = Withdrawal.objects.create(
    #         vendor=vendor,
    #         amount=amount,
    #         reference=reference,
    #         status="PROCESSING"
    #     )
        
    #     # First, verify if vendor has a recipient code already
    #     if not hasattr(vendor, 'paystack_recipient_code') or not vendor.paystack_recipient_code:
    #         # Need to create a recipient first
    #         recipient = self.create_paystack_recipient(vendor)
    #         if not recipient:
    #             withdrawal.status = "FAILED"
    #             withdrawal.notes = "Failed to create transfer recipient"
    #             withdrawal.save()
    #             return Response({"error": "Could not create transfer recipient"}, status=400)
            
    #         vendor.paystack_recipient_code = recipient
    #         vendor.save()
        
    #     # Process withdrawal through Paystack
    #     headers = {
    #         "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    #         "Content-Type": "application/json"
    #     }
        
    #     payload = {
    #         "source": "balance",
    #         "amount": int(amount * 100),  # Paystack uses kobo/cents
    #         "recipient": vendor.paystack_recipient_code,
    #         "reason": f"Vendor withdrawal - {reference}"
    #     }
        
    #     try:
    #         # Make API request to Paystack
    #         response = requests.post(
    #             f"{settings.PAYSTACK_BASE_URL}/transfer",
    #             json=payload,
    #             headers=headers
    #         )
            
    #         response_data = response.json()
            
    #         if response.status_code in [200, 201] and response_data.get('status'):
    #             # Update withdrawal record with Paystack reference
    #             withdrawal.payment_reference = response_data['data']['transfer_code']
    #             withdrawal.status = "PROCESSING"  # Paystack transfers are async
    #             withdrawal.save()
                
    #             # Deduct the amount from wallet
    #             wallet.balance -= amount
    #             wallet.save()
                
    #             return Response({
    #                 "success": "Withdrawal request submitted successfully",
    #                 "reference": reference,
    #                 "status": "processing"
    #             })
    #         else:
    #             # Log the error
    #             withdrawal.status = "FAILED"
    #             withdrawal.notes = f"Paystack Error: {response_data.get('message')}"
    #             withdrawal.save()
                
    #             return Response({
    #                 "error": "Payment processor error",
    #                 "message": response_data.get('message', 'Unknown error')
    #             }, status=400)
                
    #     except Exception as e:
    #         # Handle exceptions
    #         withdrawal.status = "FAILED"
    #         withdrawal.notes = f"System Error: {str(e)}"
    #         withdrawal.save()
            
    #         return Response({
    #             "error": "Failed to process withdrawal",
    #             "message": "An unexpected error occurred"
    #         }, status=500)
    
    # def create_paystack_recipient(self, vendor):
    #     """Create a Paystack recipient for transfers"""
    #     bank_code = self.get_bank_code(vendor.bank_name)
        
    #     if not bank_code:
    #         return None
        
    #     headers = {
    #         "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    #         "Content-Type": "application/json"
    #     }
        
    #     payload = {
    #         "type": "nuban",
    #         "name": vendor.account_name,
    #         "account_number": vendor.account_number,
    #         "bank_code": bank_code,
    #         "currency": "NGN"  # Adjust based on your currency
    #     }
        
    #     try:
    #         response = requests.post(
    #             f"{settings.PAYSTACK_BASE_URL}/transferrecipient",
    #             json=payload,
    #             headers=headers
    #         )
            
    #         if response.status_code == 201:
    #             return response.json()['data']['recipient_code']
    #     except Exception:
    #         pass
        
    #     return None
    
    # def get_bank_code(self, bank_name):
    #     """Maps bank name to Paystack bank code"""
    #     # This is a simplified example - in production you should use a more complete mapping
    #     # or fetch the list dynamically from Paystack's API
    #     bank_codes = {
    #         "Access Bank": "044",
    #         "Guaranty Trust Bank": "058",
    #         "First Bank of Nigeria": "011",
    #         "United Bank for Africa": "033",
    #         "Zenith Bank": "057",
    #         # Add more banks as needed
    #     }
        
    #     # Case insensitive lookup with fallback
    #     for name, code in bank_codes.items():
    #         if bank_name.lower() in name.lower():
    #             return code
        
    #     # If no match is found
    #     return None 

@csrf_exempt
@require_POST
def paystack_webhook(request):
    payload = json.loads(request.body)
    event = payload.get('event')
    
    if event == 'transfer.success':
        transfer_code = payload['data']['transfer_code']
        # Find the withdrawal by payment_reference
        try:
            withdrawal = Withdrawal.objects.get(payment_reference=transfer_code)
            withdrawal.status = 'COMPLETED'
            withdrawal.save()
        except Withdrawal.DoesNotExist:
            pass
    
    elif event == 'transfer.failed':
        transfer_code = payload['data']['transfer_code']
        try:
            withdrawal = Withdrawal.objects.get(payment_reference=transfer_code)
            withdrawal.status = 'FAILED'
            withdrawal.notes = payload['data'].get('reason', 'Transfer failed')
            withdrawal.save()
            
            # Refund the amount back to wallet
            wallet = Wallet.objects.get(vendor=withdrawal.vendor)
            wallet.balance += withdrawal.amount
            wallet.save()
        except Withdrawal.DoesNotExist:
            pass
    
    return HttpResponse(status=200)
    

class VendorDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        vendor = request.user.vendor_profile
        user = request.user
        image = user.profile_pic
        image_url= image.url if image else None
        
        # Get vendor details
        vendor_details = {
            'id': vendor.id,
            'name': vendor.business_name,
            'image': image_url,
        }
        
        return Response(vendor_details)
    

class VendorReviewsAPIView(APIView):
    """
    Get all reviews for a vendor
    Returns reviews with statistics
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the vendor associated with the authenticated user
            # Using the related_name="vendor_profile" from the Vendor model
            vendor = request.user.vendor_profile
            
            # Get all reviews for this vendor
            reviews = VendorReview.objects.filter(
                vendor=vendor
            ).select_related(
                'reviewer', 'order', 'vendor'
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
            review_serializer = VendorReviewSerializer(
                reviews,
                many=True,
                context={'request': request}
            )
            
            # Format the response data
            response_data = {
                'reviews': review_serializer.data,
                'stats': {
                    'total_reviews': stats['total_reviews'],
                    'average_rating': round(float(stats['average_rating']), 1),
                    'rating_breakdown': stats['rating_breakdown']
                },
                'vendor_info': {
                    'id': vendor.id,
                    'business_name': vendor.business_name,
                    'business_category': vendor.business_category
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except AttributeError:
            return Response(
                {'error': 'No vendor profile found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor profile not found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ProductReviewsAPIView: {str(e)}")
            
            return Response(
                {'error': 'An error occurred while fetching reviews'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PickerDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get order_id from query parameters
            order_id = request.query_params.get('order_id')
            if not order_id:
                return Response(
                    {'error': 'Order ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the order and ensure it belongs to the vendor
            order = get_object_or_404(
                Order.objects.select_related('picker'), 
                id=order_id,
                order_items__vendor=request.user.vendor_profile
            )

            if not order.picker:
                return Response(
                    {'error': 'No picker assigned to this order'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get picker details
            picker = order.picker
            profile_pic = picker.profile_pic.url if picker.profile_pic else None

            # If profile pic exists, make it an absolute URI
            if profile_pic:
                profile_pic = request.build_absolute_uri(profile_pic)

            picker_details = {
                'id': picker.id,
                'first_name': picker.first_name,
                'last_name': picker.last_name,
                'email': picker.email,
                'phone_number': picker.phone_number,
                'profile_picture': profile_pic
            }

            return Response(picker_details, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateStockAPIView(APIView):
    """API View to handle stock update operations"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Fetch product data for the update stock modal"""
        try:
            # Get the product and ensure it belongs to the current user
            product = get_object_or_404(
                Product.objects.select_related('vendor').prefetch_related(
                    'sizes', 'colors', 'additional_images'
                ),
                id=product_id,
                vendor=request.user
            )
            
            # Prepare response data
            product_data = {
                'id': product.id,
                'name': product.name,
                'stock': product.in_stock,
                'price':product.price,
                'sizes': [
                    {
                        'size': size.size,
                        'quantity': size.quantity
                    }
                    for size in product.sizes.all()
                ],
                'colors': [
                    {
                        'color': color.color,
                        'quantity': color.quantity
                    }
                    for color in product.colors.all()
                ],
                'additional_images': [
                    {
                        'id': img.id,
                        'url': img.image.url if img.image else None
                    }
                    for img in product.additional_images.all()
                ],
                'business_category': self.get_business_category(request.user)
            }
            
            return Response({
                'success': True,
                'product': product_data
            }, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Product not found or you do not have permission to access it.'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, product_id):
        try:
            # Get the product and ensure it belongs to the current user
            product = get_object_or_404(
                Product,
                id=product_id,
                vendor=request.user
            )
            
            # Get request data
            data = request.data
            print("request.data:", data)
            business_category = self.get_business_category(request.user)
            
            # Start database transaction
            with transaction.atomic():
                
                # Handle price update if provided
                if 'price' in data and data['price'] is not None:
                    try:
                        new_price = float(data['price'])
                        if new_price >= 0:  # Validate price is not negative
                            product.price = new_price
                    except (ValueError, TypeError):
                        return Response({
                            'success': False,
                            'error': 'Invalid price format'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Handle stock update for ALL business categories
                if 'in_stock' in data and data['in_stock'] is not None:
                    try:
                        additional_stock = int(data['in_stock'])
                        if additional_stock >= 0:  # Only allow positive additions
                            product.in_stock += additional_stock
                    except (ValueError, TypeError):
                        return Response({
                            'success': False,
                            'error': 'Invalid stock quantity format'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Handle fashion-specific sizes and colors (in addition to stock update)
                if business_category == 'fashion':
                    sizes_data = []
                    colors_data = []
                    
                    # Parse sizes data if provided
                    if 'sizes' in data and data['sizes']:
                        if isinstance(data['sizes'], str):
                            try:
                                sizes_data = json.loads(data['sizes'])
                            except json.JSONDecodeError:
                                return Response({
                                    'success': False,
                                    'error': 'Invalid sizes data format'
                                }, status=status.HTTP_400_BAD_REQUEST)
                        else:
                            sizes_data = data['sizes']
                    
                    # Parse colors data if provided
                    if 'colors' in data and data['colors']:
                        if isinstance(data['colors'], str):
                            try:
                                colors_data = json.loads(data['colors'])
                            except json.JSONDecodeError:
                                return Response({
                                    'success': False,
                                    'error': 'Invalid colors data format'
                                }, status=status.HTTP_400_BAD_REQUEST)
                        else:
                            colors_data = data['colors']
                    
                    # Update sizes - increment existing or create new
                    if sizes_data:
                        for size_data in sizes_data:
                            size_name = size_data.get('size', '').strip()
                            quantity = size_data.get('quantity', 0)
                            
                            if size_name and quantity > 0:
                                try:
                                    quantity = int(quantity)
                                    # Try to get existing size
                                    existing_size = ProductSize.objects.filter(
                                        product=product,
                                        size__iexact=size_name  # Case insensitive comparison
                                    ).first()
                                    
                                    if existing_size:
                                        # Increment existing quantity
                                        existing_size.quantity += quantity
                                        existing_size.save()
                                    else:
                                        # Create new size
                                        ProductSize.objects.create(
                                            product=product,
                                            size=size_name,
                                            quantity=quantity
                                        )
                                except (ValueError, TypeError):
                                    return Response({
                                        'success': False,
                                        'error': f'Invalid quantity for size {size_name}'
                                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Update colors - increment existing or create new
                    if colors_data:
                        for color_data in colors_data:
                            color_name = color_data.get('color', '').strip()
                            quantity = color_data.get('quantity', 0)
                            
                            if color_name and quantity > 0:
                                try:
                                    quantity = int(quantity)
                                    # Try to get existing color
                                    existing_color = ProductColor.objects.filter(
                                        product=product,
                                        color__iexact=color_name  # Case insensitive comparison
                                    ).first()
                                    
                                    if existing_color:
                                        # Increment existing quantity
                                        existing_color.quantity += quantity
                                        existing_color.save()
                                    else:
                                        # Create new color
                                        ProductColor.objects.create(
                                            product=product,
                                            color=color_name,
                                            quantity=quantity
                                        )
                                except (ValueError, TypeError):
                                    return Response({
                                        'success': False,
                                        'error': f'Invalid quantity for color {color_name}'
                                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Optional: Recalculate total stock for fashion products based on sizes/colors
                    # This section can be kept if you want fashion products to sync their main stock 
                    # with their size/color quantities, or removed if you want them independent
                    if sizes_data or colors_data:
                        total_size_stock = sum(
                            size.quantity for size in ProductSize.objects.filter(product=product)
                        )
                        total_color_stock = sum(
                            color.quantity for color in ProductColor.objects.filter(product=product)
                        )
                        
                        # Update main stock based on sizes/colors if they were modified
                        if total_size_stock > 0 and total_color_stock > 0:
                            # If both sizes and colors exist, you might want to use a different logic
                            # This assumes they're independent tracking
                            product.in_stock = max(total_size_stock, total_color_stock)
                        elif total_size_stock > 0:
                            product.in_stock = total_size_stock
                        elif total_color_stock > 0:
                            product.in_stock = total_color_stock
                
                # Handle additional images if provided
                new_images = request.FILES.getlist('new_images')
                added_images = []
                
                if new_images:
                    for image_file in new_images:
                        if image_file and self.is_valid_image(image_file):
                            new_image = ProductImage.objects.create(
                                product=product,
                                image=image_file
                            )
                            added_images.append({
                                'id': new_image.id,
                                'url': new_image.image.url
                            })
                        else:
                            return Response({
                                'success': False,
                                'error': f'Invalid image file: {image_file.name if hasattr(image_file, "name") else "Unknown"}'
                            }, status=status.HTTP_400_BAD_REQUEST)
                
                # Save the product with updated information
                product.save()
                
                # Prepare response data with updated information
                updated_product = {
                    'id': product.id,
                    'name': product.name,
                    'stock': product.in_stock,
                    'price': float(product.price),
                    'sizes': [
                        {
                            'size': size.size,
                            'quantity': size.quantity
                        }
                        for size in ProductSize.objects.filter(product=product)
                    ],
                    'colors': [
                        {
                            'color': color.color,
                            'quantity': color.quantity
                        }
                        for color in ProductColor.objects.filter(product=product)
                    ],
                    'additional_images': [
                        {
                            'id': img.id,
                            'url': img.image.url if img.image else None
                        }
                        for img in ProductImage.objects.filter(product=product)
                    ],
                    'new_images_added': added_images
                }
                
                # Create response message based on what was updated
                updates = []
                if 'price' in data and data['price'] is not None:
                    updates.append("price")
                if 'in_stock' in data and data['in_stock'] is not None:
                    updates.append("stock")
                if business_category == 'fashion':
                    if sizes_data:
                        updates.append("sizes")
                    if colors_data:
                        updates.append("colors")
                if new_images:
                    updates.append("images")
                
                update_message = f"Successfully updated: {', '.join(updates)}" if updates else "No changes made"
                
                return Response({
                    'success': True,
                    'message': update_message,
                    'product': updated_product
                }, status=status.HTTP_200_OK)
                
        except ValueError as e:
            return Response({
                'success': False,
                'error': f'Invalid data format: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in UpdateStockAPIView: {str(e)}")  # For debugging
            return Response({
                'success': False,
                'error': f'An error occurred while updating product: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_business_category(self, user):
        """Get the business category for the vendor"""
        try:
            vendor = Vendor.objects.get(user=user)
            return getattr(vendor, 'business_category', 'fashion')
        except Vendor.DoesNotExist:
            return 'fashion'  # Default to fashion
    
    def is_valid_image(self, image_file):
        """Validate uploaded image file"""
        # Check file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return False
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return False
        
        return True


class ProductStockHistoryAPIView(APIView):
    """API View to get stock update history for a product"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        """Get stock update history for a product"""
        try:
            # Get the product and ensure it belongs to the current user
            product = get_object_or_404(
                Product,
                id=product_id,
                vendor=request.user
            )
            
            # Note: You would need to implement a StockHistory model to track changes
            # For now, returning current stock information
            stock_info = {
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.in_stock,
                'last_updated': product.updated_at,
                'sizes': [
                    {
                        'size': size.size,
                        'quantity': size.quantity
                    }
                    for size in product.sizes.all()
                ],
                'colors': [
                    {
                        'color': color.color,
                        'quantity': color.quantity
                    }
                    for color in product.colors.all()
                ]
            }
            
            return Response({
                'success': True,
                'stock_info': stock_info
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



