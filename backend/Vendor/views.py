# vendor/views.py
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from User.models import Vendor
from rest_framework.views import APIView
from Stumart.models import Product, Order, OrderItem, Transaction, Wallet
from .models import VendorStats, VendorRevenueData, VendorSalesData, ProductReview, Withdrawal
from .serializers import (
    ProductSerializer, OrderSerializer, TransactionSerializer, 
    ReviewSerializer, DashboardStatsSerializer, WithdrawalSerializer
)
import requests
from django.conf import settings
import uuid
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse
from decimal import Decimal

class DashboardStatsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get vendor associated with the current user
        try:
            vendor = request.user.vendor_profile
            print(f"Found vendor: {vendor}")
        except Vendor.DoesNotExist:
            return Response({"error": "You are not registered as a vendor"}, status=status.HTTP_403_FORBIDDEN)
        
        # print(f"=== DEBUGGING VENDOR STATS ===")
        # print(f"Current user: {request.user}")
        # print(f"Vendor: {vendor}")
        
        # FORCE RECALCULATION - Delete existing stats to force fresh calculation
        try:
            existing_stats = VendorStats.objects.get(vendor=vendor)
            # print(f"Deleting existing stats: {existing_stats}")
            existing_stats.delete()
            # print("Existing stats deleted")
        except VendorStats.DoesNotExist:
            print("No existing stats found")
        
        # Always create fresh stats
        # print("Creating fresh stats...")
        stats = self._create_vendor_stats(vendor)
        
        # Get chart data
        revenue_data = VendorRevenueData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        sales_data = VendorSalesData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        
        # print(f"Revenue data count: {revenue_data.count()}")
        # print(f"Sales data count: {sales_data.count()}")
        
        # Prepare response data
        data = {
            'totalSales': float(stats.total_sales),
            'totalOrders': stats.total_orders,
            'totalProducts': stats.total_products,
            'lowStock': stats.low_stock_products,
            'totalRevenue': float(stats.total_sales),
            'pendingReviews': stats.pending_reviews,
            'revenueData': [{'month': rd.month, 'value': float(rd.value)} for rd in revenue_data],
            'salesData': [{'month': sd.month, 'value': sd.value} for sd in sales_data],
        }
        
        # print(f"Final data being returned: {data}")
        return Response(data, status=status.HTTP_200_OK)
    
    def _create_vendor_stats(self, vendor):
        # print(f"=== CREATING VENDOR STATS ===")
        
        # Debug products
        products_by_user = Product.objects.filter(vendor=vendor.user)
        # print(f"Products by vendor.user: {products_by_user.count()}")
        # for product in products_by_user:
            # print(f"  - Product: {product.name}, Stock: {product.in_stock}")
        
        # Calculate all statistics
        total_products = products_by_user.count()
        low_stock = products_by_user.filter(in_stock__lt=10).count()
        
        # print(f"Total products: {total_products}")
        # print(f"Low stock products: {low_stock}")
        
        # # Debug order items - try different approaches
        # print(f"=== CHECKING ORDER ITEMS ===")
        
        # Method 1: Direct vendor field (if exists)
        try:
            order_items_direct = OrderItem.objects.filter(vendor=vendor)
            # print(f"OrderItems with direct vendor field: {order_items_direct.count()}")
        except Exception as e:
            # print(f"Direct vendor filter failed: {e}")
            order_items_direct = OrderItem.objects.none()
        
        # Method 2: Through product relationship
        try:
            order_items_through_product = OrderItem.objects.filter(product__vendor=vendor.user)
            # print(f"OrderItems through product.vendor: {order_items_through_product.count()}")
            for item in order_items_through_product[:5]:  # Show first 5
                print(f"  - Order: {item.order.id}, Product: {item.product.name}, Price: {item.price}")
        except Exception as e:
            # print(f"Product relationship filter failed: {e}")
            order_items_through_product = OrderItem.objects.none()
        
        # Method 3: Through product vendor_id
        try:
            order_items_through_vendor_id = OrderItem.objects.filter(product__vendor_id=vendor.user.id)
            # print(f"OrderItems through product.vendor_id: {order_items_through_vendor_id.count()}")
        except Exception as e:
            # print(f"Vendor ID relationship filter failed: {e}")
            order_items_through_vendor_id = OrderItem.objects.none()
        
        # Use the method that works
        if order_items_direct.exists():
            order_items = order_items_direct
            # print("Using direct vendor relationship")
        elif order_items_through_product.exists():
            order_items = order_items_through_product
            # print("Using product.vendor relationship")
        elif order_items_through_vendor_id.exists():
            order_items = order_items_through_vendor_id
            # print("Using product.vendor_id relationship")
        else:
            order_items = OrderItem.objects.none()
            # print("No order items found with any method!")
            
            # Additional debugging - let's see ALL OrderItems
            all_order_items = OrderItem.objects.all()
            print(f"Total OrderItems in system: {all_order_items.count()}")
            for item in all_order_items[:3]:
                # print(f"  - OrderItem: {item.id}, Product: {item.product.name if hasattr(item, 'product') else 'No product'}")
                if hasattr(item, 'product') and hasattr(item.product, 'vendor'):
                    print(f"    Product vendor: {item.product.vendor}")
                if hasattr(item, 'vendor'):
                    print(f"    Direct vendor: {item.vendor}")
        
        total_orders = order_items.values('order').distinct().count()
        total_sales = order_items.aggregate(Sum('price'))['price__sum'] or 0
        
       
        # Get pending reviews count
        products = products_by_user
        try:
            pending_reviews = ProductReview.objects.filter(product__in=products, vendor_response__isnull=True).count()
            # print(f"Pending reviews: {pending_reviews}")
        except Exception as e:
            # print(f"Error calculating pending reviews: {e}")
            pending_reviews = 0
        
        # Create stats object
        stats = VendorStats.objects.create(
            vendor=vendor,
            total_sales=total_sales,
            total_orders=total_orders,
            total_products=total_products,
            low_stock_products=low_stock,
            pending_reviews=pending_reviews
        )
        
        
        # Generate/update chart data
        self._update_chart_data(vendor, order_items)
        
        return stats
    
    def _update_chart_data(self, vendor, order_items=None):
        # print(f"=== UPDATING CHART DATA ===")
        
        # If order_items not provided, try to get them
        if order_items is None:
            try:
                order_items = OrderItem.objects.filter(product__vendor=vendor.user)
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
            
            
            # Calculate revenue
            revenue = month_order_items.aggregate(Sum('price'))['price__sum'] or 0
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
            return Response({"error": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Find orders containing items from this vendor
        vendor_order_items = OrderItem.objects.filter(vendor=vendor)
        vendor_orders = Order.objects.filter(order_items__in=vendor_order_items).distinct()
        
        # Get transaction amounts for these orders
        transactions = Transaction.objects.filter(order__in=vendor_orders)
        wallet_balance = Wallet.objects.get(vendor=vendor).balance
        
        # Calculate stats
        total_amount = vendor_orders.aggregate(Sum('subtotal'))['subtotal__sum'] or 0
        paid_amount = transactions.filter(status='PAID').aggregate(Sum('amount'))['amount__sum'] or 0
        pending_amount = transactions.filter(status__in=['PENDING', 'PROCESSING']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            'total_amount': float(total_amount),  # Convert Decimal to float for JSON
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

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        products = Product.objects.filter(vendor=vendor.user)
        return ProductReview.objects.filter(product__in=products)
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        review = self.get_object()
        response = request.data.get('response')
        
        if not response:
            return Response({"error": "Response is required"}, status=400)
        
        review.vendor_response = response
        review.response_date = timezone.now()
        review.save()
        
        return Response({"success": "Response added to review"})
    

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