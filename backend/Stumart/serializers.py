# serializers.py
from rest_framework import serializers
from .models import (
    Product, 
    ProductImage, 
    ProductSize, 
    ProductColor, 
)
import json
from User.models import Vendor

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'quantity']


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ['id', 'color']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']


class ProductSerializer(serializers.ModelSerializer):
    sizes = ProductSizeSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
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
            'image_url',
            'additional_images',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['vendor']

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None


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
