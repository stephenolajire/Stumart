# serializers.py
from rest_framework import serializers
from .models import *
import json
from User.models import Vendor
from django.contrib.auth import get_user_model
from django.utils import timezone
import re

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'institution']

class VendorProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = Vendor
        fields = ['id', 'user', 'business_category']


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'quantity']


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ['id', 'color', 'quantity']


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None


class ProductSerializer(serializers.ModelSerializer):
    additional_images = serializers.SerializerMethodField()
    sizes = ProductSizeSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()
    vendor_rating = serializers.SerializerMethodField()
    vendor_category = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'in_stock',
            'gender', 'created_at', 'updated_at',
            'additional_images', 'sizes', 'colors', 'image_url',
            'vendor_name', 'vendor_rating','vendor_category', 'keyword', 'promotion_price', 'delivery_day'
        ]
    
    def get_vendor_name(self, obj):
        try:
            return obj.vendor.vendor_profile.business_name if hasattr(obj.vendor, 'vendor_profile') else f"{obj.vendor.first_name} {obj.vendor.last_name}"
        except AttributeError:
            return "Unknown Vendor"

    def get_vendor_category(self, obj):
        try:
            return obj.vendor.vendor_profile.business_category if hasattr(obj.vendor, 'vendor_profile') else None
        except AttributeError:
            return None
    
    def get_vendor_rating(self, obj):
        # Add appropriate vendor rating logic here
        return 4.5  # Placeholder, replace with actual rating logic
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
        
    def get_additional_images(self, obj):
        request = self.context.get('request')
        images = []
        
        for image in obj.additional_images.all():
            image_data = {
                'id': image.id,
                'image_url': None
            }
            
            if image.image:
                if request:
                    image_data['image_url'] = request.build_absolute_uri(image.image.url)
                else:
                    image_data['image_url'] = image.image.url
                    
            images.append(image_data)
            
        return images
      

class ProductCreateSerializer(serializers.ModelSerializer):
    sizes = serializers.CharField(required=False)
    colors = serializers.CharField(required=False)
    keyword = serializers.CharField(required=True)  # Make keyword required
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'price', 
            'in_stock', 
            'image', 
            'gender',
            'sizes',
            'colors',
            'keyword',
            'delivery_day',
        ]
        read_only_fields = ['vendor']
    
    def validate_keyword(self, value):
        """
        Validate the keyword field
        """
        if not value.strip():
            raise serializers.ValidationError("Keywords are required")
        
        if len(value) > 200:
            raise serializers.ValidationError("Keywords must be less than 200 characters")
        
        # Ensure keywords are comma-separated
        keywords = [kw.strip() for kw in value.split(',')]
        if not all(keywords):
            raise serializers.ValidationError("Invalid keyword format. Use comma-separated values")
            
        return value.strip()
    
    def validate(self, data):
        """
        Custom validation based on the vendor's business category
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        try:
            user = request.user
            vendor = Vendor.objects.get(user=user)
            business_category = vendor.business_category if vendor.business_category else None
        except Vendor.DoesNotExist:
            raise serializers.ValidationError("User is not registered as a vendor")
        
        # Call specific validator based on business category
        validation_method = getattr(self, f'validate_{business_category}', self.validate_default)
        
        # Ensure keywords are provided
        if not data.get('keyword'):
            raise serializers.ValidationError({"keyword": "Keywords are required for all products"})

        return validation_method(data)
    
    def validate_fashion(self, data):
        if not data.get('gender'):
            raise serializers.ValidationError({"gender": "Gender is required for fashion products"})
            
        if not data.get('sizes'):
            raise serializers.ValidationError({"sizes": "Sizes are required for fashion products"})
            
        if not data.get('colors'):
            raise serializers.ValidationError({"colors": "Colors are required for fashion products"})
        
        return data
    
    def validate_food(self, data):
        # Food products don't require in_stock
        if 'in_stock' in data:
            data.pop('in_stock')
        return data

    def validate_delivery_day(self, value):
        """
        Validate the delivery day for the product.
        Expects text like "2 days", "1 day", "5 days", etc.
        """
        if not value:
            return value
        
        # Convert to string and strip whitespace
        value = str(value).strip().lower()
        
        # Check minimum length
        if len(value) < 3:
            raise serializers.ValidationError(
                "Delivery day must be specified (e.g., '2 days', '1 day')."
            )
        
        # Pattern to match valid delivery day formats
        # Matches: "1 day", "2 days", "10 days", etc.
        pattern = r'^(\d+)\s+(day|days)$'
        match = re.match(pattern, value)
        
        if not match:
            raise serializers.ValidationError(
                "Delivery day must be in format like '1 day', '2 days', '5 days', etc."
            )
        
        # Extract the number of days
        days_count = int(match.group(1))
        
        # Validate reasonable delivery timeframe
        if days_count < 1:
            raise serializers.ValidationError(
                "Delivery day must be at least 1 day."
            )
        
        if days_count > 30:
            raise serializers.ValidationError(
                "Delivery day cannot exceed 30 days."
            )
        
        # Normalize the format (optional)
        if days_count == 1:
            return "1 day"
        else:
            return f"{days_count} days"
    
    def validate_default(self, data):
        # For other categories, in_stock is required
        if not data.get('in_stock') and data.get('in_stock') != 0:
            raise serializers.ValidationError({"in_stock": "Stock quantity is required"})
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        
        try:
            vendor = Vendor.objects.get(user=user)
            business_category = vendor.business_category if vendor.business_category else None
        except Vendor.DoesNotExist:
            raise serializers.ValidationError("User is not registered as a vendor")
        
        # Extract sizes and colors data if provided
        sizes_data = validated_data.pop('sizes', None)
        colors_data = validated_data.pop('colors', None)
        
        # Create the product
        product = Product.objects.create(
            vendor=user,
            **validated_data
        )
        
        # Process sizes if provided and business category is fashion
        if business_category == 'fashion' and sizes_data:
            try:
                sizes_list = json.loads(sizes_data)
                for size_item in sizes_list:
                    ProductSize.objects.create(
                        product=product,
                        size=size_item['size'],
                        quantity=size_item['quantity']
                    )
            except (json.JSONDecodeError, KeyError) as e:
                # Log the error but continue
                print(f"Error parsing sizes data: {e}")
                
        # Process colors if provided and business category is fashion
        if business_category == 'fashion' and colors_data:
            try:
                colors_list = json.loads(colors_data)
                for color_item in colors_list:
                    ProductColor.objects.create(
                        product=product,
                        color=color_item['color'],
                        quantity=color_item['quantity']
                    )
            except (json.JSONDecodeError, KeyError) as e:
                # Log the error but continue
                print(f"Error parsing colors data: {e}")
                
        # Process additional images
        for key, file in request.FILES.items():
            if key.startswith('additional_images_'):
                ProductImage.objects.create(
                    product=product,
                    image=file
                )
                
        return product
    

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    promotion_price = serializers.DecimalField(source='product.promotion_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    delivery_day = serializers.CharField(source='product.delivery_day', read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'product_image',
            'quantity', 'size', 'color', 'total_price', 'created_at', 'promotion_price', 'delivery_day'
        ]
        
    def get_product_image(self, obj):
        request = self.context.get('request')
        if obj.product.image and request:
            return request.build_absolute_uri(obj.product.image.url)
        elif obj.product.image:
            return obj.product.image.url
        return None
        
    def get_total_price(self, obj):
        return obj.product.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True, source='cartitem_set')
    total_price = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'cart_code', 'items', 'total_price', 'item_count', 'created_at', 'updated_at']
        
    def get_total_price(self, obj):
        return sum(item.product.price * item.quantity for item in obj.cartitem_set.all())
        
    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.cartitem_set.all())


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price', 'vendor', 'size', 'color']


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'first_name', 'last_name',
            'email', 'phone', 'address', 'room_number', 'subtotal',
            'shipping_fee', 'tax', 'total', 'order_status', 'created_at',
            'order_items', 'transaction', 'image_url', 'confirm', 'picker', 'packed', 'reviewed',
        ]
    
    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['order', 'transaction_id', 'amount', 'status', 'payment_method']


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['vendor', 'balance']


class OrderDetailSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    transaction = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'first_name', 'last_name',
            'email', 'phone', 'address', 'room_number', 'subtotal',
            'shipping_fee', 'tax', 'total', 'order_status', 'created_at',
            'order_items', 'transaction', 'image_url'
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.order_items.exists():
            product = obj.order_items.first().product
            if product and product.image and request:
                return request.build_absolute_uri(product.image.url)
        return None
    
    def get_transaction(self, obj):
        try:
            transaction = Transaction.objects.get(order=obj)
            return TransactionSerializer(transaction).data
        except Transaction.DoesNotExist:
            return None
        

class VendorDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'business_name', 'business_category', 'specific_category',
            'shop_image', 'rating', 'total_ratings', 'user'
        ]

class ServiceApplicationSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.business_name', read_only=True)
    service_category = serializers.CharField(source='service.specific_category', read_only=True)
    
    class Meta:
        model = ServiceApplication
        fields = [
            'id', 'service', 'service_name', 'service_category', 'user',
            'name', 'email', 'phone', 'description', 'preferred_date',
            'additional_details', 'status', 'created_at', 'updated_at',
            'vendor_response', 'response_date', 'completion_date'
        ]
        read_only_fields = ['created_at', 'updated_at']
        
    def validate(self, data):
        # Validate that the service exists and is active
        if 'service' in data and hasattr(data['service'], 'is_active') and not data['service'].is_active:
            raise serializers.ValidationError({"service": "This service is not currently available"})
        
        if 'preferred_date' in data and data['preferred_date'].date() < timezone.now().date():
            raise serializers.ValidationError({"preferred_date": "Please select a future date"})
        
        return data

class VendorReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorReview
        fields = [
            'id', 'order', 'vendor', 'reviewer', 'rating', 
            'comment', 'created_at', 'reviewer_name', 'vendor_name'
        ]
        read_only_fields = ['reviewer', 'created_at']
    
    def get_reviewer_name(self, obj):
        if obj.reviewer:
            return f"{obj.reviewer.first_name} {obj.reviewer.last_name}"
        return "Anonymous"
    
    def get_vendor_name(self, obj):
        return obj.vendor.business_name
    
    def create(self, validated_data):
        # Get the user from the request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)


class PickerReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    picker_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PickerReview
        fields = [
            'id', 'order', 'picker', 'reviewer', 'rating', 
            'comment', 'created_at', 'reviewer_name', 'picker_name'
        ]
        read_only_fields = ['reviewer', 'created_at']
    
    def get_reviewer_name(self, obj):
        if obj.reviewer:
            return f"{obj.reviewer.first_name} {obj.reviewer.last_name}"
        return "Anonymous"
    
    def get_picker_name(self, obj):
        return f"{obj.picker.first_name} {obj.picker.last_name}"
    
    def create(self, validated_data):
        # Get the user from the request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)


class ReviewSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting both vendor and picker reviews together"""
    order_id = serializers.IntegerField()
    vendor_id = serializers.IntegerField()
    picker_id = serializers.IntegerField()
    vendor_rating = serializers.IntegerField(min_value=1, max_value=5)
    vendor_comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    picker_rating = serializers.IntegerField(min_value=1, max_value=5)
    picker_comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class ProductReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'product_name', 'reviewer', 'reviewer_name', 
            'order', 'order_number', 'rating', 'comment', 
            'created_at', 'created_at_formatted', 
            'updated_at', 'updated_at_formatted'
        ]
        read_only_fields = ['id', 'reviewer', 'created_at', 'updated_at']
    
    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%B %d, %Y')
    
    def get_updated_at_formatted(self, obj):
        return obj.updated_at.strftime('%B %d, %Y')
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate(self, data):
        """
        Check that the user has bought the product before allowing review
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            product = data.get('product')
            
            if product and user.is_authenticated:
                # Check if user has bought this product
                from .models import OrderItem
                has_bought = OrderItem.objects.filter(
                    product=product,
                    order__user=user,
                    order__order_status__in=['DELIVERED', 'COMPLETED']
                ).exists()
                
                if not has_bought:
                    raise serializers.ValidationError(
                        "You can only review products you have purchased"
                    )
        
        return data


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating reviews"""
    
    class Meta:
        model = ProductReview
        fields = ['rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class ProductReviewStatsSerializer(serializers.Serializer):
    """Serializer for review statistics"""
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    rating_breakdown = serializers.DictField()


class ProductReviewListSerializer(serializers.Serializer):
    """Serializer for the complete review list response"""
    reviews = ProductReviewSerializer(many=True)
    stats = ProductReviewStatsSerializer()


class RegisterVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    video_secure_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RegisterVideo
        fields = ['id', 'name', 'video_url', 'video_secure_url', 'uploaded_at']
    
    def get_video_url(self, obj):
        return obj.video_url
    
    def get_video_secure_url(self, obj):
        return obj.video_secure_url

class AddProductVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    video_secure_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AddProductVideo
        fields = ['id', 'name', 'video_url', 'video_secure_url', 'uploaded_at']
    
    def get_video_url(self, obj):
        return obj.video_url
    
    def get_video_secure_url(self, obj):
        return obj.video_secure_url
    
    