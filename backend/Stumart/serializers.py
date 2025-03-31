# serializers.py
from rest_framework import serializers
from .models import Product
from User.models import Vendor
from django.core.validators import MinValueValidator, MaxValueValidator

class ProductSerializer(serializers.ModelSerializer):
    # Add vendor-related fields
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    vendor_category = serializers.CharField(source='vendor.business_category', read_only=True)
    vendor_rating = serializers.FloatField(source='vendor.rating', read_only=True)
    vendor_shop_image = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()  # Get full Cloudinary URL
    
    # Add validators for other fields
    price = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[
            MinValueValidator(0.01, message="Price must be greater than 0."),
            MaxValueValidator(99999.99, message="Price cannot exceed 99,999.99.")
        ]
    )
    
    in_stock = serializers.IntegerField(
        validators=[
            MinValueValidator(0, message="Stock quantity cannot be negative."),
            MaxValueValidator(9999999, message="Stock quantity is too large.")
        ]
    )
    
    name = serializers.CharField(
        max_length=100,
        error_messages={
            'blank': 'Product name is required.',
            'max_length': 'Product name must be less than 100 characters.'
        }
    )
    
    description = serializers.CharField(
        error_messages={
            'blank': 'Product description is required.'
        }
    )
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'in_stock', 'image', 'created_at',
            'vendor_name', 'vendor_category', 'vendor_rating', 'vendor_shop_image'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_vendor_shop_image(self, obj):
        """Return full Cloudinary image URL for vendor shop image."""
        if obj.vendor and obj.vendor.shop_image:
            return obj.vendor.shop_image.url  # Correctly return Cloudinary URL
        return None  # Return None if no image exists
    
    def get_image(self, obj):
        """Return full Cloudinary image URL for product image."""
        if obj.image:
            return obj.image.url  # Correctly return Cloudinary URL
        return None  # Return None if no image exists
    
    def create(self, validated_data):
        """
        Override create method to handle image upload correctly.
        This ensures the image is processed properly by Cloudinary.
        """
        # Image should already be in the request.FILES
        # This method just ensures proper creation
        product = Product.objects.create(**validated_data)
        return product