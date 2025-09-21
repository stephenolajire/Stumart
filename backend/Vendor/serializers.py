# vendor/serializers.py
from rest_framework import serializers
from User.models import Vendor
from Stumart.models import Product, Order, OrderItem, Transaction
from wallet.models import VendorWallets
from .models import VendorStats, VendorRevenueData, VendorSalesData, Withdrawal
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'in_stock', 'image', 'created_at', 'status', 'promotion_price']
    
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
            'order_status', 'created_at', 'order_items', 'packed', 'confirm', 'picker'
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


# class ReviewSerializer(serializers.ModelSerializer):
#     product_name = serializers.CharField(source='product.name')
#     customer_name = serializers.SerializerMethodField()
    
#     class Meta:
#         model = ProductReview
#         fields = ['id', 'product', 'product_name', 'user', 'customer_name', 'rating', 'comment', 'created_at', 'vendor_response', 'response_date']
    
#     def get_customer_name(self, obj):
#         return f"{obj.user.first_name} {obj.user.last_name}"


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
    vendor_name = serializers.CharField(source='vendor.user.get_full_name', read_only=True)
    bank_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Withdrawal
        fields = [
            'id', 'amount', 'reference', 'status', 'notes',
            'created_at', 'processed_at', 'vendor_name', 'bank_details'
        ]
        read_only_fields = ['reference', 'created_at', 'processed_at']
    
    def get_bank_details(self, obj):
        return {
            'bank_name': obj.vendor.bank_name,
            'account_number': f"***{obj.vendor.account_number[-4:]}" if obj.vendor.account_number else None,
            'account_name': obj.vendor.account_name
        }


class UserAccountSerializer(serializers.ModelSerializer):
    """Serializer for user account information"""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'profile_pic']
        read_only_fields = ['email']  # Email should not be editable in settings
    
    def validate_phone_number(self, value):
        """Validate phone number is unique (excluding current user)"""
        user = self.context['request'].user
        if User.objects.filter(phone_number=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This phone number is already in use.")
        return value


class VendorStoreSerializer(serializers.ModelSerializer):
    """Serializer for vendor store settings"""
    
    class Meta:
        model = Vendor
        fields = ['business_name', 'business_description', 'shop_image']
    
    def validate_business_name(self, value):
        """Validate business name is unique (excluding current vendor)"""
        user = self.context['request'].user
        if hasattr(user, 'vendor_profile'):
            if Vendor.objects.filter(business_name=value).exclude(pk=user.vendor_profile.pk).exists():
                raise serializers.ValidationError("This business name is already taken.")
        return value


class VendorPaymentSerializer(serializers.ModelSerializer):
    """Serializer for vendor payment information"""
    
    class Meta:
        model = Vendor
        fields = ['bank_name', 'account_number', 'account_name']
        read_only_fields = ['account_number']  # Account number should not be editable
    
    def validate_account_number(self, value):
        """Validate account number format"""
        if len(value) != 10:
            raise serializers.ValidationError("Account number must be exactly 10 digits.")
        if not value.isdigit():
            raise serializers.ValidationError("Account number must contain only digits.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password"""
        validate_password(value)
        return value
    
    def validate(self, attrs):
        """Validate that new passwords match"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return attrs
    
    def save(self):
        """Change user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for complete user profile (read-only)"""
    vendor_profile = VendorStoreSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'profile_pic', 
                 'user_type', 'vendor_profile']
        read_only_fields = ['email', 'user_type']