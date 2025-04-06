# serializers.py
from rest_framework import serializers
from .models import *
import json
from User.models import Vendor
from django.contrib.auth import get_user_model

User = get_user_model()

class VendorSerializer(serializers.ModelSerializer):
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
            'vendor_name', 'vendor_rating','vendor_category'
        ]
    
    def get_vendor_name(self, obj):
        if hasattr(obj.vendor, 'vendor_profile'):
            return obj.vendor.vendor_profile.business_name
        return f"{obj.vendor.first_name} {obj.vendor.last_name}"

    def get_vendor_category(self, obj):
        if hasattr(obj.vendor, 'vendor_profile'):
            return obj.vendor.vendor_profile.business_category
        return f"{obj.vendor.first_name} {obj.vendor.last_name}"
    
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
        ]
        read_only_fields = ['vendor']
    
    def validate(self, data):
        """
        Custom validation based on the vendor's business category
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        
        # Get business category
        user = request.user
        vendor = Vendor.objects.get(user=user)
        business_category = vendor.business_category if vendor.business_category else None
        
        # Apply category-specific validation
        if business_category == 'fashion':
            # Fashion products require gender
            if not data.get('gender'):
                raise serializers.ValidationError({"gender": "Gender is required for fashion products"})
                
            # Validate sizes and colors
            if not data.get('sizes'):
                raise serializers.ValidationError({"sizes": "Sizes are required for fashion products"})
                
            if not data.get('colors'):
                raise serializers.ValidationError({"colors": "Colors are required for fashion products"})
                
        elif business_category == 'food':
            # Food products don't require in_stock
            if 'in_stock' in data:
                data.pop('in_stock')
        else:
            # For other categories, in_stock is required
            if not data.get('in_stock') and data.get('in_stock') != 0:
                raise serializers.ValidationError({"in_stock": "Stock quantity is required"})
                
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        vendor = Vendor.objects.get(user=user)
        business_category = vendor.business_category if vendor.business_category else None
        
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
            except (json.JSONDecodeError, KeyError):
                # If there's an error parsing the JSON, log it but continue
                # Could also raise a validation error here
                pass
                
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
            except (json.JSONDecodeError, KeyError):
                # If there's an error parsing the JSON, log it but continue
                # Could also raise a validation error here
                pass
                
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
    product_image = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'product_image',
            'quantity', 'size', 'color', 'total_price', 'created_at'
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
        fields = ['id', 'user', 'cart_code', 'items', 'total_price', 'item_count', 'created_at', 'updated_at']
        
    def get_total_price(self, obj):
        return sum(item.product.price * item.quantity for item in obj.cartitem_set.all())
        
    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.cartitem_set.all())
