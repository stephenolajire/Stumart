# vendor/views.py
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from User.models import Vendor
from Stumart.models import Product, Order, OrderItem, Transaction, Wallet
from .models import VendorStats, VendorRevenueData, VendorSalesData, ProductReview, Withdrawal
from .serializers import (
    ProductSerializer, OrderSerializer, TransactionSerializer, 
    ReviewSerializer, DashboardStatsSerializer
)
import requests
from django.conf import settings
import uuid
import json
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse

class DashboardStatsView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get vendor associated with the current user
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response({"error": "You are not registered as a vendor"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get or calculate stats
        try:
            stats = VendorStats.objects.get(vendor=vendor)
            # If stats are older than a day, refresh them
            if timezone.now() - stats.last_updated > timedelta(days=1):
                self._update_vendor_stats(vendor, stats)
        except VendorStats.DoesNotExist:
            stats = self._create_vendor_stats(vendor)
        
        # Get chart data
        revenue_data = VendorRevenueData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        sales_data = VendorSalesData.objects.filter(vendor=vendor).order_by('year', 'month')[:6]
        
        # Prepare response data
        data = {
            'totalSales': stats.total_sales,
            'totalOrders': stats.total_orders,
            'totalProducts': stats.total_products,
            'lowStock': stats.low_stock_products,
            'totalRevenue': stats.total_sales,  # Can be adjusted if different from sales
            'pendingReviews': stats.pending_reviews,
            'revenueData': [{'month': rd.month, 'value': rd.value} for rd in revenue_data],
            'salesData': [{'month': sd.month, 'value': sd.value} for sd in sales_data],
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)
    
    def _create_vendor_stats(self, vendor):
        # Calculate all statistics
        total_products = Product.objects.filter(vendor=vendor.user).count()
        low_stock = Product.objects.filter(vendor=vendor.user, in_stock__lt=10).count()
        
        # Get order items for this vendor
        order_items = OrderItem.objects.filter(vendor=vendor)
        total_orders = order_items.values('order').distinct().count()
        total_sales = order_items.aggregate(Sum('price'))['price__sum'] or 0
        
        # Get pending reviews count (reviews without vendor response)
        products = Product.objects.filter(vendor=vendor.user)
        pending_reviews = ProductReview.objects.filter(product__in=products, vendor_response__isnull=True).count()
        
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
        self._update_chart_data(vendor)
        
        return stats
    
    def _update_vendor_stats(self, vendor, stats):
        stats.total_products = Product.objects.filter(vendor=vendor.user).count()
        stats.low_stock_products = Product.objects.filter(vendor=vendor.user, in_stock__lt=10).count()
        
        order_items = OrderItem.objects.filter(vendor=vendor)
        stats.total_orders = order_items.values('order').distinct().count()
        stats.total_sales = order_items.aggregate(Sum('price'))['price__sum'] or 0
        
        products = Product.objects.filter(vendor=vendor.user)
        stats.pending_reviews = ProductReview.objects.filter(product__in=products, vendor_response__isnull=True).count()
        
        stats.save()
        
        # Update chart data
        self._update_chart_data(vendor)
        
        return stats
    
    def _update_chart_data(self, vendor):
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
            
            order_items = OrderItem.objects.filter(
                vendor=vendor,
                order__created_at__gte=start_date,
                order__created_at__lt=end_date
            )
            
            # Calculate revenue
            revenue = order_items.aggregate(Sum('price'))['price__sum'] or 0
            VendorRevenueData.objects.create(
                vendor=vendor,
                month=month_name,
                year=year,
                value=revenue
            )
            
            # Calculate order count
            orders_count = order_items.values('order').distinct().count()
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


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        # Get orders containing items from this vendor
        orders = Order.objects.filter(order_items__vendor=vendor).distinct()
        return orders
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['vendor'] = self.request.user.vendor_profile
        return context
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        status = request.data.get('status')
        if not status:
            return Response({"error": "Status is required"}, status=400)
        
        # Only update items belonging to this vendor
        vendor = request.user.vendor_profile
        items = order.order_items.filter(vendor=vendor)
        
        for item in items:
            # Logic to update item status goes here
            pass
        
        return Response({"success": "Order status updated"})


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
        vendor = request.user.vendor_profile
        vendor_orders = Order.objects.filter(order_items__vendor=vendor)
        
        # Get transaction amounts for these orders
        transactions = Transaction.objects.filter(order__in=vendor_orders)
        
        # Calculate stats
        total_amount = transactions.aggregate(Sum('amount'))['amount__sum'] or 0
        paid_amount = transactions.filter(status='PAID').aggregate(Sum('amount'))['amount__sum'] or 0
        pending_amount = transactions.filter(status__in=['PENDING', 'PROCESSING']).aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            'total_amount': total_amount,
            'paid_amount': paid_amount,
            'pending_amount': pending_amount,
            'total_transactions': transactions.count()
        })
    
    @action(detail=False, methods=['post'])
    def withdraw(self, request):
        vendor = request.user
        
        try:
            wallet = Wallet.objects.get(vendor=vendor)
        except Wallet.DoesNotExist:
            return Response({"error": "Wallet not found"}, status=404)
        
        # Validate withdrawal amount
        amount = request.data.get('amount')
        if not amount:
            return Response({"error": "Amount is required"}, status=400)
        
        try:
            amount = float(amount)
        except ValueError:
            return Response({"error": "Invalid amount format"}, status=400)
        
        if wallet.balance < amount:
            return Response({"error": "Insufficient balance"}, status=400)
        
        # Generate a unique reference for this withdrawal
        reference = f"WDR-{uuid.uuid4().hex[:10]}"
        
        # Check if bank details are available
        if not vendor.account_number or not vendor.bank_name or not vendor.account_name:
            return Response({"error": "Bank account details are incomplete"}, status=400)
        
        # Create withdrawal record
        withdrawal = Withdrawal.objects.create(
            vendor=vendor,
            amount=amount,
            reference=reference,
            status="PROCESSING"
        )
        
        # First, verify if vendor has a recipient code already
        if not hasattr(vendor, 'paystack_recipient_code') or not vendor.paystack_recipient_code:
            # Need to create a recipient first
            recipient = self.create_paystack_recipient(vendor)
            if not recipient:
                withdrawal.status = "FAILED"
                withdrawal.notes = "Failed to create transfer recipient"
                withdrawal.save()
                return Response({"error": "Could not create transfer recipient"}, status=400)
            
            vendor.paystack_recipient_code = recipient
            vendor.save()
        
        # Process withdrawal through Paystack
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "source": "balance",
            "amount": int(amount * 100),  # Paystack uses kobo/cents
            "recipient": vendor.paystack_recipient_code,
            "reason": f"Vendor withdrawal - {reference}"
        }
        
        try:
            # Make API request to Paystack
            response = requests.post(
                f"{settings.PAYSTACK_BASE_URL}/transfer",
                json=payload,
                headers=headers
            )
            
            response_data = response.json()
            
            if response.status_code in [200, 201] and response_data.get('status'):
                # Update withdrawal record with Paystack reference
                withdrawal.payment_reference = response_data['data']['transfer_code']
                withdrawal.status = "PROCESSING"  # Paystack transfers are async
                withdrawal.save()
                
                # Deduct the amount from wallet
                wallet.balance -= amount
                wallet.save()
                
                return Response({
                    "success": "Withdrawal request submitted successfully",
                    "reference": reference,
                    "status": "processing"
                })
            else:
                # Log the error
                withdrawal.status = "FAILED"
                withdrawal.notes = f"Paystack Error: {response_data.get('message')}"
                withdrawal.save()
                
                return Response({
                    "error": "Payment processor error",
                    "message": response_data.get('message', 'Unknown error')
                }, status=400)
                
        except Exception as e:
            # Handle exceptions
            withdrawal.status = "FAILED"
            withdrawal.notes = f"System Error: {str(e)}"
            withdrawal.save()
            
            return Response({
                "error": "Failed to process withdrawal",
                "message": "An unexpected error occurred"
            }, status=500)
    
    def create_paystack_recipient(self, vendor):
        """Create a Paystack recipient for transfers"""
        bank_code = self.get_bank_code(vendor.bank_name)
        
        if not bank_code:
            return None
        
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "type": "nuban",
            "name": vendor.account_name,
            "account_number": vendor.account_number,
            "bank_code": bank_code,
            "currency": "NGN"  # Adjust based on your currency
        }
        
        try:
            response = requests.post(
                f"{settings.PAYSTACK_BASE_URL}/transferrecipient",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 201:
                return response.json()['data']['recipient_code']
        except Exception:
            pass
        
        return None
    
    def get_bank_code(self, bank_name):
        """Maps bank name to Paystack bank code"""
        # This is a simplified example - in production you should use a more complete mapping
        # or fetch the list dynamically from Paystack's API
        bank_codes = {
            "Access Bank": "044",
            "Guaranty Trust Bank": "058",
            "First Bank of Nigeria": "011",
            "United Bank for Africa": "033",
            "Zenith Bank": "057",
            # Add more banks as needed
        }
        
        # Case insensitive lookup with fallback
        for name, code in bank_codes.items():
            if bank_name.lower() in name.lower():
                return code
        
        # If no match is found
        return None 

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