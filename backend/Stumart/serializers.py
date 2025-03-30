from rest_framework import serializers
from .models import Product
from User.models import Vendor

class ProductSerializer(serializers.ModelSerializer):
    # Add vendor-related fields
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    vendor_category = serializers.CharField(source='vendor.business_category', read_only=True)
    vendor_rating = serializers.FloatField(source='vendor.rating', read_only=True)
    vendor_shop_image = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()  # ✅ Fix: Get full Cloudinary URL

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'in_stock', 'image', 'created_at',
            'vendor_name', 'vendor_category', 'vendor_rating', 'vendor_shop_image'
        ]

    def get_vendor_shop_image(self, obj):
        """Return full Cloudinary image URL for vendor shop image."""
        if obj.vendor and obj.vendor.shop_image:
            return obj.vendor.shop_image.url  # ✅ Correctly return Cloudinary URL
        return None  # ✅ Return None if no image exists

    def get_image(self, obj):
        """Return full Cloudinary image URL for product image."""
        if obj.image:
            return obj.image.url  # ✅ Correctly return Cloudinary URL
        return None  # ✅ Return None if no image exists
