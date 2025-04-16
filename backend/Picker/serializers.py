from rest_framework import serializers
from Stumart.models import Order, OrderItem
from User.models import User, Picker, StudentPicker

class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderItem model
    """
    product_name = serializers.CharField(source='product.name')
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'quantity', 'price', 'size', 'color']


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for basic Order information
    """
    vendor_name = serializers.SerializerMethodField()
    delivery_location = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'vendor_name', 'delivery_location', 'total', 'shipping_fee', 'order_status', 'created_at']
    
    def get_vendor_name(self, obj):
        if hasattr(obj.user, 'vendor_profile'):
            return obj.user.vendor_profile.business_name
        return "Unknown"
    
    def get_delivery_location(self, obj):
        if obj.room_number:
            return f"{obj.address}, Room: {obj.room_number}"
        return obj.address


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed Order information
    """
    vendor = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    is_assigned = serializers.SerializerMethodField()
    is_assigned_to_me = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'vendor', 'customer', 'items', 'subtotal', 
                  'shipping_fee', 'tax', 'total', 'order_status', 'created_at',
                  'is_assigned', 'is_assigned_to_me']
    
    def get_vendor(self, obj):
        if hasattr(obj.user, 'vendor_profile'):
            vendor = obj.user.vendor_profile
            return {
                'name': vendor.business_name,
                'phone': vendor.user.phone_number if vendor.user else "Unknown",
                'location': f"{vendor.user.institution}, {vendor.user.state}" if vendor.user else "Unknown"
            }
        return {
            'name': "Unknown",
            'phone': "Unknown",
            'location': "Unknown"
        }
    
    def get_customer(self, obj):
        return {
            'name': f"{obj.first_name} {obj.last_name}",
            'phone': obj.phone,
            'address': obj.address,
            'room_number': obj.room_number
        }
    
    def get_items(self, obj):
        items = OrderItem.objects.filter(order=obj)
        return OrderItemSerializer(items, many=True).data
    
    def get_is_assigned(self, obj):
        return bool(obj.picker or obj.student_picker)
    
    def get_is_assigned_to_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        user = request.user
        return (obj.picker == user) or (obj.student_picker == user)


class AvailableOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for available orders that can be accepted by pickers
    """
    vendor_name = serializers.SerializerMethodField()
    pickup_location = serializers.SerializerMethodField()
    delivery_location = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'vendor_name', 'pickup_location', 
                 'delivery_location', 'total', 'shipping_fee', 'items']
    
    def get_vendor_name(self, obj):
        if hasattr(obj.user, 'vendor_profile'):
            return obj.user.vendor_profile.business_name
        return "Unknown"
    
    def get_pickup_location(self, obj):
        if hasattr(obj.user, 'vendor_profile') and obj.user.vendor_profile.user:
            vendor = obj.user.vendor_profile
            return f"{vendor.user.institution}, {vendor.user.state}"
        return "Unknown"
    
    def get_delivery_location(self, obj):
        if obj.room_number:
            return f"{obj.address}, Room: {obj.room_number}"
        return obj.address
    
    def get_items(self, obj):
        items = OrderItem.objects.filter(order=obj)
        return OrderItemSerializer(items, many=True).data


class DeliverySerializer(serializers.ModelSerializer):
    """
    Serializer for delivery information
    """
    vendor_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    delivery_location = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'vendor_name', 'customer_name', 
                  'delivery_location', 'items_count', 'total', 'shipping_fee', 
                  'order_status', 'created_at']
    
    def get_vendor_name(self, obj):
        if hasattr(obj.user, 'vendor_profile'):
            return obj.user.vendor_profile.business_name
        return "Unknown"
    
    def get_customer_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_delivery_location(self, obj):
        if obj.room_number:
            return f"{obj.address}, Room: {obj.room_number}"
        return obj.address
    
    def get_items_count(self, obj):
        return OrderItem.objects.filter(order=obj).count()


class DailyEarningSerializer(serializers.Serializer):
    """
    Serializer for daily earnings data
    """
    date = serializers.DateField()
    amount = serializers.FloatField()


class EarningSerializer(serializers.Serializer):
    """
    Serializer for earnings information
    """
    total_earnings = serializers.FloatField()
    order_count = serializers.IntegerField()
    average_per_order = serializers.FloatField()
    period = serializers.CharField()
    daily_earnings = DailyEarningSerializer(many=True)


class ReviewItemSerializer(serializers.Serializer):
    """
    Serializer for individual review items
    """
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    customer_name = serializers.CharField()
    rating = serializers.IntegerField()
    comment = serializers.CharField()
    date = serializers.DateField()


class ReviewSerializer(serializers.Serializer):
    """
    Serializer for reviews
    """
    average_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    reviews = ReviewItemSerializer(many=True)


class ProfileSerializer(serializers.Serializer):
    """
    Serializer for picker profile
    """
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    institution = serializers.CharField()
    state = serializers.CharField()
    profile_pic = serializers.ImageField(required=False, allow_null=True)
    is_verified = serializers.BooleanField()
    
    # Fields for regular picker
    fleet_type = serializers.CharField(required=False, allow_null=True)
    
    # Fields for student picker
    hostel_name = serializers.CharField(required=False, allow_null=True)
    room_number = serializers.CharField(required=False, allow_null=True)
    
    # Common fields for both
    is_available = serializers.BooleanField(required=False)
    bank_name = serializers.CharField(required=False, allow_null=True)
    account_number = serializers.CharField(required=False, allow_null=True)
    account_name = serializers.CharField(required=False, allow_null=True)
    
    def to_representation(self, instance):
        user = instance
        data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone_number': user.phone_number,
            'institution': user.institution,
            'state': user.state,
            'profile_pic': user.profile_pic.url if user.profile_pic else None,
            'is_verified': user.is_verified
        }
        
        if user.user_type == 'picker':
            profile = user.picker_profile
            data.update({
                'fleet_type': profile.fleet_type,
                'is_available': profile.is_available,
                'bank_name': profile.bank_name,
                'account_number': profile.account_number,
                'account_name': profile.account_name,
            })
        elif user.user_type == 'student_picker':
            profile = user.student_picker_profile
            data.update({
                'hostel_name': profile.hostel_name,
                'room_number': profile.room_number,
                'is_available': profile.is_available,
                'bank_name': profile.bank_name,
                'account_number': profile.account_number,
                'account_name': profile.account_name,
            })
            
        return data


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for picker dashboard statistics
    """
    availableOrders = serializers.IntegerField()
    activeDeliveries = serializers.IntegerField()
    earnings = serializers.FloatField()
    rating = serializers.FloatField()


class RecentOrderSerializer(serializers.Serializer):
    """
    Serializer for recent orders shown on dashboard
    """
    id = serializers.IntegerField()
    order_number = serializers.CharField()
    vendor_name = serializers.CharField()
    delivery_location = serializers.CharField()
    status = serializers.CharField()


class DashboardSerializer(serializers.Serializer):
    """
    Serializer for the entire dashboard response
    """
    stats = DashboardStatsSerializer()
    recent_orders = RecentOrderSerializer(many=True)