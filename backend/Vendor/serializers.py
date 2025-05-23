# vendor/serializers.py
from rest_framework import serializers
from User.models import Vendor
from Stumart.models import Product, Order, OrderItem, Transaction, Wallet
from .models import VendorStats, VendorRevenueData, VendorSalesData, ProductReview, Withdrawal


class ProductSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'in_stock', 'image', 'created_at', 'status']
    
    def get_status(self, obj):
        if obj.in_stock == 0:
            return "out-of-stock"
        elif obj.in_stock < 10:
            return "low-stock"
        else:
            return "active"
    
    def get_category(self, obj):
        return obj.gender  # Using gender field as category for now


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name')
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price', 'size', 'color']


class OrderSerializer(serializers.ModelSerializer):
    order_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'first_name', 'last_name', 'email', 
            'address', 'subtotal', 'shipping_fee', 'tax', 'total',
            'order_status', 'created_at', 'order_items', 'packed'
        ]
    
    def get_order_items(self, obj):
        # Get vendor from context
        vendor = self.context.get('vendor')
        if not vendor:
            return []
            
        # Filter order items to only show this vendor's items
        vendor_items = obj.order_items.filter(vendor=vendor)
        
        # Serialize the items
        return OrderItemSerializer(vendor_items, many=True).data


class TransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number')
    customer = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source='created_at')
    
    class Meta:
        model = Transaction
        fields = ['id', 'transaction_id', 'amount', 'status', 'payment_method', 'date', 'order_number', 'customer']
    
    def get_customer(self, obj):
        return f"{obj.order.first_name} {obj.order.last_name}"


class ReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name')
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'product_name', 'user', 'customer_name', 'rating', 'comment', 'created_at', 'vendor_response', 'response_date']
    
    def get_customer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class StatisticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorStats
        exclude = ['id', 'vendor']


class RevenueDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorRevenueData
        fields = ['month', 'value']


class SalesDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorSalesData
        fields = ['month', 'value']


class DashboardStatsSerializer(serializers.Serializer):
    totalSales = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalOrders = serializers.IntegerField()
    totalProducts = serializers.IntegerField()
    lowStock = serializers.IntegerField()
    totalRevenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingReviews = serializers.IntegerField()
    revenueData = RevenueDataSerializer(many=True)
    salesData = SalesDataSerializer(many=True)


class WithdrawalSerializer(serializers.ModelSerializer):
    # vendor = serializers.SerializerMethodField()

    class Meta:
        model = Withdrawal
        fields = ['id', 'vendor', 'amount', 'reference', 'payment_reference', 'status', 'created_at']