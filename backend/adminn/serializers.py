from rest_framework import serializers
from user.models import User, Vendor, Picker, StudentPicker, KYCVerification
from stumart.models import Product, Order, OrderItem, Transaction
from wallet.models import VendorWallets
from adminn.models import Contact


# ======================== Dashboard Stats Serializers ========================

class UserStatsSerializer(serializers.Serializer):
    """Serializer for user statistics"""
    total = serializers.IntegerField()
    new_week = serializers.IntegerField()
    new_month = serializers.IntegerField()
    breakdown = serializers.DictField(child=serializers.IntegerField())


class OrderStatsSerializer(serializers.Serializer):
    """Serializer for order statistics"""
    total = serializers.IntegerField()
    recent = serializers.IntegerField()
    pending = serializers.IntegerField()


class FinancialStatsSerializer(serializers.Serializer):
    """Serializer for financial statistics"""
    total_sales = serializers.FloatField()
    total_profit = serializers.FloatField()
    recent_sales = serializers.FloatField()


class ProductStatsSerializer(serializers.Serializer):
    """Serializer for product statistics"""
    total = serializers.IntegerField()
    out_of_stock = serializers.IntegerField()


class DashboardStatsSerializer(serializers.Serializer):
    """Response serializer for dashboard overview"""
    user_stats = UserStatsSerializer()
    order_stats = OrderStatsSerializer()
    financial_stats = FinancialStatsSerializer()
    product_stats = ProductStatsSerializer()
    last_updated = serializers.DateTimeField()


# ======================== User Management Serializers ========================

class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user details in admin dashboard"""
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'user_type', 'is_verified', 'date_joined', 'institution',
            'profile_pic', 'is_active', 'state'
        ]


class UserUpdateSerializer(serializers.Serializer):
    """Serializer for updating user (is_active, is_verified)"""
    is_active = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)


class UserListResponseSerializer(serializers.Serializer):
    """Response serializer for list of users"""
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone_number = serializers.CharField()
    user_type = serializers.CharField()
    is_verified = serializers.BooleanField()
    date_joined = serializers.DateTimeField()
    institution = serializers.CharField()
    profile_pic = serializers.URLField(allow_null=True)
    is_active = serializers.BooleanField()


# ======================== Vendor Management Serializers ========================

class VendorDetailSerializer(serializers.Serializer):
    """Serializer for vendor details in admin dashboard"""
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    business_name = serializers.CharField()
    business_category = serializers.CharField()
    specific_category = serializers.CharField()
    shop_image = serializers.URLField(allow_null=True)
    rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    is_verified = serializers.BooleanField()
    bank_name = serializers.CharField()
    account_number = serializers.CharField()
    account_name = serializers.CharField()
    date_joined = serializers.DateTimeField()
    user_name = serializers.CharField()
    phone_number = serializers.CharField()
    state = serializers.CharField()
    institution = serializers.CharField()
    total_products = serializers.IntegerField()
    total_sales = serializers.FloatField()


class VendorUpdateSerializer(serializers.Serializer):
    """Serializer for updating vendor verification status"""
    is_verified = serializers.BooleanField(required=False)


# ======================== Picker Management Serializers ========================

class PickerDetailSerializer(serializers.Serializer):
    """Serializer for regular picker details"""
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
    phone_number = serializers.CharField()
    fleet_type = serializers.CharField()
    is_available = serializers.BooleanField()
    total_deliveries = serializers.IntegerField()
    rating = serializers.FloatField()
    bank_name = serializers.CharField()
    account_number = serializers.CharField()
    account_name = serializers.CharField()
    date_joined = serializers.DateTimeField()
    is_verified = serializers.BooleanField()
    picker_type = serializers.CharField(default='picker')


class StudentPickerDetailSerializer(serializers.Serializer):
    """Serializer for student picker details"""
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
    phone_number = serializers.CharField()
    hostel_name = serializers.CharField()
    room_number = serializers.CharField()
    is_available = serializers.BooleanField()
    total_deliveries = serializers.IntegerField()
    rating = serializers.FloatField()
    bank_name = serializers.CharField()
    account_number = serializers.CharField()
    account_name = serializers.CharField()
    date_joined = serializers.DateTimeField()
    is_verified = serializers.BooleanField()
    picker_type = serializers.CharField(default='student_picker')


class PickerUpdateSerializer(serializers.Serializer):
    """Serializer for updating picker"""
    is_available = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)


# ======================== Order Management Serializers ========================

class OrderItemDetailSerializer(serializers.Serializer):
    """Serializer for order items"""
    id = serializers.IntegerField()
    product_name = serializers.CharField()
    quantity = serializers.IntegerField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    size = serializers.CharField(allow_null=True)
    color = serializers.CharField(allow_null=True)
    vendor_name = serializers.CharField()
    total = serializers.DecimalField(max_digits=10, decimal_places=2)


class TransactionDetailSerializer(serializers.Serializer):
    """Serializer for transaction details"""
    id = serializers.IntegerField()
    transaction_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    payment_method = serializers.CharField()
    created_at = serializers.DateTimeField()


class PickerInfoSerializer(serializers.Serializer):
    """Serializer for picker info in order"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()


class OrderListSerializer(serializers.Serializer):
    """Serializer for order list"""
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    items_count = serializers.IntegerField()
    picker = PickerInfoSerializer(required=False, allow_null=True)


class OrderDetailSerializer(serializers.Serializer):
    """Serializer for order detail view"""
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address = serializers.CharField()
    room_number = serializers.CharField(allow_null=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    items = OrderItemDetailSerializer(many=True)
    transaction = TransactionDetailSerializer(allow_null=True)
    picker = PickerInfoSerializer(required=False, allow_null=True)


class OrderUpdateSerializer(serializers.Serializer):
    """Serializer for updating order"""
    status = serializers.CharField(required=False)
    picker_id = serializers.IntegerField(required=False)


# ======================== Payment Management Serializers ========================

class TransactionListSerializer(serializers.Serializer):
    """Serializer for transaction list"""
    id = serializers.IntegerField()
    transaction_id = serializers.CharField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    payment_method = serializers.CharField()
    created_at = serializers.DateTimeField()


class VendorWalletSerializer(serializers.Serializer):
    """Serializer for vendor wallet/payout info"""
    id = serializers.IntegerField()
    vendor_name = serializers.CharField()
    vendor_email = serializers.EmailField()
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    bank_name = serializers.CharField()
    account_number = serializers.CharField()
    account_name = serializers.CharField()
    paystack_recipient_code = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()


# ======================== KYC Verification Serializers ========================

class KYCVerificationDetailSerializer(serializers.Serializer):
    """Serializer for KYC verification details"""
    id = serializers.IntegerField()
    user_id = serializers.IntegerField()
    user_email = serializers.EmailField()
    user_name = serializers.CharField()
    user_type = serializers.CharField()
    id_type = serializers.CharField()
    selfie_image = serializers.URLField(allow_null=True)
    id_image = serializers.URLField(allow_null=True)
    verification_status = serializers.CharField()
    submission_date = serializers.DateTimeField()
    verification_date = serializers.DateTimeField(allow_null=True)
    rejection_reason = serializers.CharField(allow_null=True)


class KYCVerificationUpdateSerializer(serializers.Serializer):
    """Serializer for updating KYC verification"""
    verification_status = serializers.CharField()  # 'approved' or 'rejected'
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


# ======================== Contact Serializers ========================

class ContactSerializer(serializers.ModelSerializer):
    """Serializer for contact form submissions"""
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContactResponseSerializer(serializers.Serializer):
    """Response serializer for contact form"""
    message = serializers.CharField()
    data = ContactSerializer()


# ======================== Vendor Products Serializers ========================

class VendorInfoSerializer(serializers.Serializer):
    """Serializer for vendor info in products list"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    category = serializers.CharField()
    rating = serializers.FloatField()
    verified = serializers.BooleanField()


class ProductDetailSerializer(serializers.Serializer):
    """Serializer for individual product"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    price = serializers.FloatField()
    promotion_price = serializers.FloatField()
    in_stock = serializers.IntegerField()
    image = serializers.URLField(allow_null=True)
    effective_price = serializers.FloatField()
    gender = serializers.CharField()
    keyword = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class VendorProductsListResponseSerializer(serializers.Serializer):
    """Response serializer for vendor products list"""
    success = serializers.BooleanField()
    vendor = VendorInfoSerializer()
    products = ProductDetailSerializer(many=True)
    total_products = serializers.IntegerField()


# ======================== Newsletter Serializers ========================

class SendNewsletterRequestSerializer(serializers.Serializer):
    """Serializer for sending targeted newsletter"""
    state = serializers.CharField()
    institution = serializers.CharField()
    user_type = serializers.CharField()  # 'student', 'vendor', 'picker', 'student_picker', 'all'
    subject = serializers.CharField()
    message = serializers.CharField()
    cta_url = serializers.URLField(required=False, allow_blank=True)
    cta_text = serializers.CharField(required=False, allow_blank=True)
    show_recipient_info = serializers.BooleanField(required=False, default=True)


class SendNewsletterResponseSerializer(serializers.Serializer):
    """Response serializer for newsletter sending"""
    message = serializers.CharField()
    sent = serializers.IntegerField()
    failed = serializers.IntegerField()
    total = serializers.IntegerField()
    filters = serializers.DictField()


class GetUserCountRequestSerializer(serializers.Serializer):
    """Serializer for getting user count by filters"""
    state = serializers.CharField()
    institution = serializers.CharField()
    user_type = serializers.CharField()


class GetUserCountResponseSerializer(serializers.Serializer):
    """Response serializer for user count"""
    count = serializers.IntegerField()
    filters = serializers.DictField()


# ======================== Generic Response Serializers ========================

class SuccessResponseSerializer(serializers.Serializer):
    """Generic success response"""
    status = serializers.CharField()


class ErrorResponseSerializer(serializers.Serializer):
    """Generic error response"""
    error = serializers.CharField()
    details = serializers.CharField(required=False)