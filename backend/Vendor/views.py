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
from django.db.models import Sum, F, Case, When, DecimalField
from decimal import Decimal
import logging

from typing import Dict, Optional, Tuple

# Configure logging
logger = logging.getLogger(__name__)


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
        
        # Get orders with vendor-specific calculations using database aggregation
        vendor_orders = Order.objects.filter(
            order_items__vendor=vendor
        ).distinct().annotate(
            # Calculate vendor subtotal with promotion price logic
            vendor_subtotal=Sum(
                Case(
                    When(
                        order_items__product__promotion_price__gt=0,
                        order_items__product__promotion_price__lt=F('order_items__product__price'),
                        then=F('order_items__product__promotion_price') * F('order_items__quantity')
                    ),
                    default=F('order_items__product__price') * F('order_items__quantity'),
                    output_field=DecimalField(max_digits=10, decimal_places=2)
                ),
                filter=models.Q(order_items__vendor=vendor)
            )
        ).select_related('picker').prefetch_related(
            'order_items__product', 
            'order_items__vendor'
        )
        
        processed_orders = []
        
        for order in vendor_orders:
            # Get vendor-specific items
            vendor_items = order.order_items.filter(vendor=vendor)
            
            # Calculate proportional shipping and tax
            if order.subtotal > 0:
                vendor_proportion = order.vendor_subtotal / order.subtotal
                vendor_shipping = order.shipping_fee * vendor_proportion
                vendor_tax = order.tax * vendor_proportion
            else:
                vendor_shipping = Decimal('0.00')
                vendor_tax = Decimal('0.00')
            
            vendor_total = order.vendor_subtotal + vendor_shipping + vendor_tax
            
            # Process items
            processed_items = []
            for item in vendor_items:
                effective_price = (
                    item.product.promotion_price 
                    if (item.product.promotion_price and 
                        item.product.promotion_price > 0 and 
                        item.product.promotion_price < item.product.price)
                    else item.product.price
                )
                
                processed_items.append({
                    'id': item.id,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'original_price': item.product.price,
                    'promotion_price': item.product.promotion_price,
                    'effective_price': effective_price,
                    'total': effective_price * item.quantity,
                    'size': item.size,
                    'color': item.color,
                    'is_packed': item.is_packed,
                    'packed_at': item.packed_at
                })
            
            # Check if all vendor items are packed
            all_vendor_items_packed = all(item.is_packed for item in vendor_items)
            
            order_data = {
                'id': order.id,
                'order_number': order.order_number,
                'first_name': order.first_name,
                'last_name': order.last_name,
                'email': order.email,
                'address': order.address,
                'subtotal': order.vendor_subtotal,
                'shipping_fee': vendor_shipping,
                'tax': vendor_tax,
                'total': vendor_total,
                'order_status': order.order_status,
                'created_at': order.created_at,
                'order_items': processed_items,
                'packed': all_vendor_items_packed,
                'confirm': order.confirm,
                'picker': {
                    'id': order.picker.id if order.picker else None,
                    'name': f"{order.picker.first_name} {order.picker.last_name}" if order.picker else None,
                    'email': order.picker.email if order.picker else None,
                    'phone': order.picker.phone_number if order.picker else None
                } if order.picker else None
            }
            
            processed_orders.append(order_data)
        
        # Sort by creation date (newest first)
        processed_orders.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'success': True,
            'count': len(processed_orders),
            'orders': processed_orders
        }, status=status.HTTP_200_OK)



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
    
    # Cache for bank codes - will be populated from Paystack API
    _bank_codes_cache = {}
    _cache_timestamp = None
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        vendor_orders = Order.objects.filter(order_items__vendor=vendor).values_list('id', flat=True)
        return Transaction.objects.filter(order__id__in=vendor_orders)
    
    def _get_paystack_banks(self) -> Dict[str, str]:
        """
        Fetch bank codes from Paystack API and cache them
        Returns dict mapping bank names to bank codes
        """
        from datetime import datetime, timedelta
        
        # Check if cache is valid (refresh every 24 hours)
        if (self._bank_codes_cache and self._cache_timestamp and 
            datetime.now() - self._cache_timestamp < timedelta(hours=24)):
            return self._bank_codes_cache
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{settings.PAYSTACK_BASE_URL}/bank",
                headers=headers,
                params={
                    'country': 'nigeria',
                    'use_cursor': 'false',
                    'perPage': 100
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') and data.get('data'):
                    # Create mapping of bank names to codes
                    bank_codes = {}
                    for bank in data['data']:
                        bank_name = bank['name'].lower().strip()
                        bank_code = bank['code']
                        bank_codes[bank_name] = bank_code
                        
                        # Add common aliases
                        if 'guaranty trust bank' in bank_name or 'gtbank' in bank_name:
                            bank_codes['gtbank'] = bank_code
                            bank_codes['guaranty trust bank'] = bank_code
                        elif 'united bank for africa' in bank_name or 'uba' in bank_name:
                            bank_codes['uba'] = bank_code
                            bank_codes['united bank for africa'] = bank_code
                        elif 'first bank' in bank_name:
                            bank_codes['first bank'] = bank_code
                            bank_codes['first bank of nigeria'] = bank_code
                        elif 'access bank' in bank_name:
                            bank_codes['access bank'] = bank_code
                        elif 'zenith bank' in bank_name:
                            bank_codes['zenith bank'] = bank_code
                        elif 'fcmb' in bank_name or 'first city monument bank' in bank_name:
                            bank_codes['fcmb'] = bank_code
                            bank_codes['first city monument bank'] = bank_code
                    
                    # Update cache
                    self._bank_codes_cache = bank_codes
                    self._cache_timestamp = datetime.now()
                    
                    logger.info(f"Successfully fetched {len(bank_codes)} bank codes from Paystack")
                    return bank_codes
                else:
                    logger.error(f"Invalid response from Paystack banks API: {data}")
            else:
                logger.error(f"Failed to fetch banks from Paystack: {response.status_code} - {response.text}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching banks from Paystack: {str(e)}")
        
        # Return fallback bank codes if API fails
        return self._get_fallback_bank_codes()
    
    def _get_fallback_bank_codes(self) -> Dict[str, str]:
        """
        Fallback bank codes in case Paystack API is unavailable
        These are the most common Nigerian banks
        """
        return {
            'access bank': '044',
            'guaranty trust bank': '058',
            'gtbank': '058',
            'first bank of nigeria': '011',
            'first bank': '011',
            'united bank for africa': '033',
            'uba': '033',
            'zenith bank': '057',
            'union bank': '032',
            'fidelity bank': '070',
            'sterling bank': '232',
            'stanbic ibtc bank': '221',
            'standard chartered': '068',
            'citibank': '023',
            'heritage bank': '030',
            'keystone bank': '082',
            'polaris bank': '076',
            'providus bank': '101',
            'suntrust bank': '100',
            'titan trust bank': '102',
            'unity bank': '215',
            'wema bank': '035',
            'ecobank': '050',
            'fcmb': '214',
            'first city monument bank': '214',
            'jaiz bank': '301',
            'taj bank': '302',
            'globus bank': '103',
            'premium trust bank': '105',
        }
    
    def _get_bank_code(self, bank_name: str) -> Optional[str]:
        """Get bank code from bank name using Paystack API"""
        if not bank_name:
            return None
        
        # Get latest bank codes
        bank_codes = self._get_paystack_banks()
        
        # Normalize bank name for lookup
        normalized_name = bank_name.lower().strip()
        
        # Direct lookup
        if normalized_name in bank_codes:
            return bank_codes[normalized_name]
        
        # Partial match lookup
        for bank, code in bank_codes.items():
            if bank in normalized_name or normalized_name in bank:
                return code
        
        logger.warning(f"Bank code not found for: {bank_name}")
        return None
    
    @action(detail=False, methods=['get'])
    def supported_banks(self, request):
        """Get list of supported banks"""
        try:
            bank_codes = self._get_paystack_banks()
            
            # Convert to list of bank objects
            banks = []
            processed_codes = set()  # Avoid duplicates
            
            for bank_name, bank_code in bank_codes.items():
                if bank_code not in processed_codes:
                    banks.append({
                        'name': bank_name.title(),
                        'code': bank_code
                    })
                    processed_codes.add(bank_code)
            
            # Sort by name
            banks.sort(key=lambda x: x['name'])
            
            return Response({
                'banks': banks,
                'total': len(banks),
                'last_updated': self._cache_timestamp.isoformat() if self._cache_timestamp else None
            })
            
        except Exception as e:
            logger.error(f"Error fetching supported banks: {str(e)}")
            return Response(
                {"error": "Failed to fetch supported banks"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def verify_account(self, request):
        """Verify bank account details"""
        bank_code = request.data.get('bank_code')
        account_number = request.data.get('account_number')
        
        if not bank_code or not account_number:
            return Response(
                {"error": "Bank code and account number are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not account_number.isdigit() or len(account_number) != 10:
            return Response(
                {"error": "Account number must be 10 digits"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{settings.PAYSTACK_BASE_URL}/bank/resolve",
                headers=headers,
                params={
                    'account_number': account_number,
                    'bank_code': bank_code
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') and data.get('data'):
                    return Response({
                        'success': True,
                        'account_name': data['data']['account_name'],
                        'account_number': data['data']['account_number'],
                        'bank_code': bank_code
                    })
                else:
                    return Response(
                        {"error": "Could not verify account details"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "Account verification failed"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Account verification error: {str(e)}")
            return Response(
                {"error": "Account verification service temporarily unavailable"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
            wallet = Wallet.objects.create(vendor=vendor, balance=0)
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
        """
        Handle vendor withdrawal requests with proper validation and error handling
        """
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            logger.error(f"Vendor profile not found for user {request.user.id}")
            return Response(
                {"error": "Vendor profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate withdrawal amount
        validation_response = self._validate_withdrawal_request(request.data, vendor)
        if validation_response:
            return validation_response
        
        amount = Decimal(str(request.data.get('amount')))
        
        try:
            wallet = Wallet.objects.get(vendor=vendor)
        except Wallet.DoesNotExist:
            logger.error(f"Wallet not found for vendor {vendor.id}")
            return Response(
                {"error": "Wallet not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check minimum withdrawal amount
        min_withdrawal = getattr(settings, 'MIN_WITHDRAWAL_AMOUNT', 5000)
        if amount < min_withdrawal:
            return Response(
                {"error": f"Minimum withdrawal amount is ₦{min_withdrawal}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check maximum withdrawal amount
        max_withdrawal = getattr(settings, 'MAX_WITHDRAWAL_AMOUNT', 1000000)
        if amount > max_withdrawal:
            return Response(
                {"error": f"Maximum withdrawal amount is ₦{max_withdrawal}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if there are pending withdrawals
        pending_withdrawals = Withdrawal.objects.filter(
            vendor=vendor, 
            status__in=['PENDING', 'PROCESSING']
        ).count()
        
        if pending_withdrawals > 0:
            return Response(
                {"error": "You have pending withdrawal requests. Please wait for them to be processed."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use database transaction for atomic operations
        with transaction.atomic():
            # Lock the wallet to prevent concurrent modifications
            wallet = Wallet.objects.select_for_update().get(vendor=vendor)
            
            if wallet.balance < amount:
                return Response(
                    {"error": "Insufficient balance"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate unique reference
            reference = f"WDR-{uuid.uuid4().hex[:10].upper()}"
            
            # Create withdrawal record
            withdrawal = Withdrawal.objects.create(
                vendor=vendor,
                amount=amount,
                reference=reference,
                status="PENDING",
                created_at=timezone.now()
            )
            
            # Process withdrawal based on environment
            if settings.DEBUG or getattr(settings, 'TESTING', False):
                # Development/Testing mode - simulate successful withdrawal
                result = self._process_test_withdrawal(withdrawal, wallet, amount)
            else:
                # Production mode - use real payment processor
                result = self._process_production_withdrawal(withdrawal, wallet, amount)
            
            return Response(result)
    
    def _validate_withdrawal_request(self, data: Dict, vendor) -> Optional[Response]:
        """Validate withdrawal request data"""
        
        # Check amount
        amount = data.get('amount')
        if not amount:
            return Response(
                {"error": "Amount is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
            if amount <= 0:
                return Response(
                    {"error": "Amount must be greater than 0"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid amount format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check bank details
        if not all([vendor.bank_name, vendor.account_number, vendor.account_name]):
            return Response(
                {"error": "Bank account details are incomplete. Please update your profile."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate account number format
        if not vendor.account_number.isdigit() or len(vendor.account_number) != 10:
            return Response(
                {"error": "Invalid account number format. Must be 10 digits."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return None
    
    def _process_test_withdrawal(self, withdrawal, wallet, amount) -> Dict:
        """Process withdrawal in test/development mode"""
        
        try:
            # Simulate processing delay and random success/failure for testing
            import random
            import time
            
            # Simulate API call delay
            time.sleep(1)
            
            # 95% success rate for testing
            if random.random() < 0.95:
                # Successful withdrawal
                wallet.balance -= amount
                wallet.save()
                
                withdrawal.status = "COMPLETED"
                withdrawal.processed_at = timezone.now()
                withdrawal.payment_reference = f"TEST-{uuid.uuid4().hex[:8]}"
                withdrawal.notes = "Test withdrawal - automatically processed"
                withdrawal.save()
                
                logger.info(f"Test withdrawal completed: {withdrawal.reference}")
                
                return {
                    "success": True,
                    "message": "Withdrawal request processed successfully (TEST MODE)",
                    "reference": withdrawal.reference,
                    "status": "completed",
                    "amount": float(amount),
                    "new_balance": float(wallet.balance)
                }
            else:
                # Simulate failure
                withdrawal.status = "FAILED"
                withdrawal.processed_at = timezone.now()
                withdrawal.notes = "Test withdrawal - simulated failure"
                withdrawal.save()
                
                logger.warning(f"Test withdrawal failed: {withdrawal.reference}")
                
                return {
                    "success": False,
                    "message": "Withdrawal failed (TEST MODE - simulated failure)",
                    "reference": withdrawal.reference,
                    "status": "failed"
                }
                
        except Exception as e:
            logger.error(f"Test withdrawal error: {str(e)}")
            withdrawal.status = "FAILED"
            withdrawal.notes = f"Test error: {str(e)}"
            withdrawal.save()
            
            return {
                "success": False,
                "message": "Withdrawal processing failed",
                "reference": withdrawal.reference,
                "status": "failed"
            }
    
    def _process_production_withdrawal(self, withdrawal, wallet, amount) -> Dict:
        """Process withdrawal in production mode using Paystack"""
        
        try:
            vendor = withdrawal.vendor
            
            # Get or create Paystack recipient
            recipient_code = self._get_or_create_paystack_recipient(vendor)
            if not recipient_code:
                withdrawal.status = "FAILED"
                withdrawal.notes = "Failed to create payment recipient"
                withdrawal.save()
                
                return {
                    "success": False,
                    "message": "Failed to create payment recipient",
                    "reference": withdrawal.reference,
                    "status": "failed"
                }
            
            # Process transfer via Paystack
            transfer_result = self._initiate_paystack_transfer(
                recipient_code, amount, withdrawal.reference
            )
            
            if transfer_result['success']:
                # Deduct amount from wallet
                wallet.balance -= amount
                wallet.save()
                
                withdrawal.status = "PROCESSING"
                withdrawal.payment_reference = transfer_result['transfer_code']
                withdrawal.notes = "Transfer initiated successfully"
                withdrawal.save()
                
                logger.info(f"Paystack transfer initiated: {withdrawal.reference}")
                
                return {
                    "success": True,
                    "message": "Withdrawal request submitted successfully",
                    "reference": withdrawal.reference,
                    "status": "processing",
                    "amount": float(amount),
                    "new_balance": float(wallet.balance),
                    "estimated_completion": "1-2 business days"
                }
            else:
                withdrawal.status = "FAILED"
                withdrawal.notes = f"Paystack error: {transfer_result['message']}"
                withdrawal.save()
                
                return {
                    "success": False,
                    "message": transfer_result['message'],
                    "reference": withdrawal.reference,
                    "status": "failed"
                }
                
        except Exception as e:
            logger.error(f"Production withdrawal error: {str(e)}")
            withdrawal.status = "FAILED"
            withdrawal.notes = f"System error: {str(e)}"
            withdrawal.save()
            
            return {
                "success": False,
                "message": "An unexpected error occurred. Please try again later.",
                "reference": withdrawal.reference,
                "status": "failed"
            }
    
    def _get_or_create_paystack_recipient(self, vendor) -> Optional[str]:
        """Get existing or create new Paystack recipient"""
        
        # Check if vendor already has a recipient code
        if hasattr(vendor, 'paystack_recipient_code') and vendor.paystack_recipient_code:
            return vendor.paystack_recipient_code
        
        # Create new recipient
        bank_code = self._get_bank_code(vendor.bank_name)
        if not bank_code:
            logger.error(f"Bank code not found for: {vendor.bank_name}")
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
            "currency": "NGN"
        }
        
        try:
            response = requests.post(
                f"{settings.PAYSTACK_BASE_URL}/transferrecipient",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 201:
                recipient_code = response.json()['data']['recipient_code']
                
                # Save recipient code to vendor
                vendor.paystack_recipient_code = recipient_code
                vendor.save()
                
                logger.info(f"Created Paystack recipient for vendor {vendor.id}")
                return recipient_code
            else:
                logger.error(f"Failed to create Paystack recipient: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack API error: {str(e)}")
            return None
    
    def _initiate_paystack_transfer(self, recipient_code: str, amount: Decimal, reference: str) -> Dict:
        """Initiate transfer via Paystack API"""
        
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "source": "balance",
            "amount": int(amount * 100),  # Convert to kobo
            "recipient": recipient_code,
            "reason": f"Vendor withdrawal - {reference}",
            "reference": reference
        }
        
        try:
            response = requests.post(
                f"{settings.PAYSTACK_BASE_URL}/transfer",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response_data = response.json()
            
            if response.status_code in [200, 201] and response_data.get('status'):
                return {
                    'success': True,
                    'transfer_code': response_data['data']['transfer_code'],
                    'message': 'Transfer initiated successfully'
                }
            else:
                return {
                    'success': False,
                    'message': response_data.get('message', 'Unknown error occurred')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack transfer error: {str(e)}")
            return {
                'success': False,
                'message': 'Payment service temporarily unavailable'
            }
    
    @action(detail=False, methods=['get'])
    def withdrawal_history(self, request):
        """Get withdrawal history for vendor"""
        try:
            vendor = request.user.vendor_profile
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get paginated withdrawals
        withdrawals = Withdrawal.objects.filter(vendor=vendor).order_by('-created_at')
        
        # Apply pagination if needed
        page_size = request.GET.get('page_size', 20)
        try:
            page_size = min(int(page_size), 100)  # Max 100 per page
        except ValueError:
            page_size = 20
        
        # Simple pagination
        offset = 0
        try:
            page = int(request.GET.get('page', 1))
            offset = (page - 1) * page_size
        except ValueError:
            pass
        
        total_count = withdrawals.count()
        withdrawals = withdrawals[offset:offset + page_size]
        
        serializer = WithdrawalSerializer(withdrawals, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page_size': page_size,
            'current_page': (offset // page_size) + 1,
            'total_pages': (total_count + page_size - 1) // page_size
        })
    
    @action(detail=False, methods=['get'])
    def withdrawal_limits(self, request):
        """Get withdrawal limits and fees"""
        return Response({
            'min_amount': getattr(settings, 'MIN_WITHDRAWAL_AMOUNT', 1000),
            'max_amount': getattr(settings, 'MAX_WITHDRAWAL_AMOUNT', 1000000),
            'processing_fee': getattr(settings, 'WITHDRAWAL_FEE', 0),
            'processing_time': '1-2 business days',
            'daily_limit': getattr(settings, 'DAILY_WITHDRAWAL_LIMIT', 500000),
            'monthly_limit': getattr(settings, 'MONTHLY_WITHDRAWAL_LIMIT', 2000000)
        })
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

class ProductPromtionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, product_id):
        try:
            # Correct way to use get() method
            new_price = request.data.get('promotional_price')
            
            if new_price is None:
                return Response({
                    'error': 'Promotional price is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                new_price = float(new_price)
                if new_price < 0:
                    raise ValueError("Price cannot be negative")
            except (TypeError, ValueError):
                return Response({
                    'error': 'Invalid price format'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            user = request.user
            if user.user_type.lower() != "vendor":
                return Response({
                    'error': 'You are not permitted to carry out this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                product = Product.objects.get(id=product_id, vendor=user)
            except Product.DoesNotExist:
                return Response({
                    'error': 'Product not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if new_price >= product.price:
                return Response({
                    'error': 'Promotional price must be less than original price'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            product.promotion_price = new_price
            product.save()
            
            return Response({
                'success': True,
                'message': 'Promotional price has been saved successfully',
                'data': {
                    'product_id': product.id,
                    'original_price': product.price,
                    'promotional_price': product.promotion_price
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class BulkDiscountAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Verify user is a vendor
            user = request.user
            if user.user_type.lower() != "vendor":
                return Response({
                    'error': 'Only vendors can apply bulk discounts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get all products for this vendor
            products = Product.objects.filter(vendor=user)
            if not products.exists():
                return Response({
                    'error': 'No products found for this vendor'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get discount parameters
            discount_type = request.data.get('discount_type')
            discount_value = request.data.get('discount_value')
            
            if not discount_type or not discount_value:
                return Response({
                    'error': 'Both discount_type and discount_value are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                discount_value = float(discount_value)
                if discount_value <= 0:
                    raise ValueError("Discount must be greater than 0")
            except (TypeError, ValueError):
                return Response({
                    'error': 'Invalid discount value'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process discount based on type
            updated_products = []
            
            with transaction.atomic():
                for product in products:
                    original_price = float(product.price)
                    
                    if discount_type:
                        if discount_value > 100:
                            return Response({
                                'error': 'Percentage discount cannot exceed 100%'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        # Calculate discount amount
                        discount_amount = (discount_value / 100) * original_price
                        new_price = original_price - discount_amount
                    
                    elif discount_type:
                        if discount_value >= original_price:
                            continue  # Skip products where discount is greater than price
                        new_price = original_price - discount_value
                    
                    else:
                        return Response({
                            'error': 'Invalid discount type. Must be "percentage" or "fixed"'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Update product with new promotional price
                    product.promotion_price = round(new_price, 2)
                    product.save()
                    
                    updated_products.append({
                        'product_id': product.id,
                        'name': product.name,
                        'original_price': original_price,
                        'promotional_price': product.promotion_price
                    })
            
            return Response({
                'success': True,
                'message': f'Bulk discount applied successfully to {len(updated_products)} products',
                'discount_type': discount_type,
                'discount_value': discount_value,
                'updated_products': updated_products
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to apply bulk discount: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request):
        """Remove all promotional prices for vendor's products"""
        try:
            user = request.user
            if user.user_type.lower() != "vendor":
                return Response({
                    'error': 'Only vendors can remove bulk discounts'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get all products and set promotional prices to original price instead of null
            products = Product.objects.filter(vendor=user)
            updated_count = 0
            
            with transaction.atomic():
                for product in products:
                    if product.promotion_price is not None:
                        product.promotion_price = 0.00  # Set to original price instead of null
                        product.save()
                        updated_count += 1
            
            return Response({
                'success': True,
                'message': f'Removed promotional prices from {updated_count} products'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to remove bulk discount: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)