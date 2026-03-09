from rest_framework import serializers
from user.models import Vendor
from stumart.models import Product


# ======================== Request Serializers ========================

class VendorsByCategoryRequestSerializer(serializers.Serializer):
    """Request serializer for VendorsByCategoryView"""
    category = serializers.CharField(required=True, help_text="Business category to filter by")
    school = serializers.CharField(required=False, allow_blank=True, help_text="Filter by institution")
    state = serializers.CharField(required=False, allow_blank=True, help_text="Filter by state")
    search = serializers.CharField(required=False, allow_blank=True, help_text="Search by business name")
    sort = serializers.ChoiceField(
        choices=['newest', 'rating_high', 'rating_low', 'name_asc', 'name_desc', 'random'],
        required=False,
        default='random',
        help_text="Sort order"
    )
    verified_only = serializers.BooleanField(required=False, default=False, help_text="Show only verified vendors")


class ProductCategoryRequestSerializer(serializers.Serializer):
    """Request serializer for ProductCategoryView"""
    category = serializers.CharField(required=True, help_text="Product category to filter by")
    vendor = serializers.IntegerField(required=False, help_text="Filter by vendor ID")
    state = serializers.CharField(required=False, allow_blank=True, help_text="Filter by state")
    school = serializers.CharField(required=False, allow_blank=True, help_text="Filter by institution")
    search = serializers.CharField(required=False, allow_blank=True, help_text="Search by product name")
    minPrice = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, help_text="Minimum price")
    maxPrice = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, help_text="Maximum price")
    sort = serializers.ChoiceField(
        choices=['newest', 'price_low', 'price_high', 'popular'],
        required=False,
        default='newest',
        help_text="Sort order"
    )
    gender = serializers.ChoiceField(
        choices=['men', 'women', 'unisex', 'kids'],
        required=False,
        allow_blank=True,
        help_text="Gender category for fashion products"
    )


class CategoryLastFiveRequestSerializer(serializers.Serializer):
    """Request serializer for CategoryLastFiveView"""
    pass  # No query parameters required


class VendorsBySchoolRequestSerializer(serializers.Serializer):
    """Request serializer for VendorsBySchoolView"""
    school = serializers.CharField(required=False, allow_blank=True, help_text="School/Institution name")


# ======================== Response Serializers ========================

class AppliedFiltersSerializer(serializers.Serializer):
    """Serializer for applied filters metadata"""
    school = serializers.CharField(allow_null=True)
    state = serializers.CharField(allow_null=True)
    search = serializers.CharField(allow_null=True)
    sort = serializers.CharField(allow_null=True)
    verified_only = serializers.BooleanField(allow_null=True)


class ProductCategoryAppliedFiltersSerializer(serializers.Serializer):
    """Serializer for applied filters in ProductCategoryView"""
    vendor = serializers.CharField(allow_null=True)
    state = serializers.CharField(allow_null=True)
    school = serializers.CharField(allow_null=True)
    search = serializers.CharField(allow_null=True)
    minPrice = serializers.CharField(allow_null=True)
    maxPrice = serializers.CharField(allow_null=True)
    sort = serializers.CharField(allow_null=True)
    gender = serializers.CharField(allow_null=True)


class VendorBasicSerializer(serializers.Serializer):
    """Basic vendor information"""
    id = serializers.IntegerField()
    business_name = serializers.CharField()
    business_category = serializers.CharField()
    specific_category = serializers.CharField()
    business_description = serializers.CharField()
    shop_image = serializers.URLField(allow_null=True)
    rating = serializers.FloatField()
    total_ratings = serializers.IntegerField()
    is_verified = serializers.BooleanField()


class ProductBasicSerializer(serializers.Serializer):
    """Basic product information"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    promotion_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    image = serializers.URLField(allow_null=True)
    in_stock = serializers.IntegerField()
    gender = serializers.CharField(allow_null=True)
    delivery_day = serializers.IntegerField(allow_null=True)
    created_at = serializers.DateTimeField()


class VendorNameSerializer(serializers.Serializer):
    """Vendor name and ID"""
    id = serializers.IntegerField()
    name = serializers.CharField()


class VendorsByCategoryResponseSerializer(serializers.Serializer):
    """Response serializer for VendorsByCategoryView"""
    category = serializers.CharField()
    user_institution = serializers.CharField(allow_null=True)
    total_vendors = serializers.IntegerField()
    applied_filters = AppliedFiltersSerializer()
    results = serializers.ListField(child=serializers.DictField(), allow_null=True)


class CategoryProductsSerializer(serializers.Serializer):
    """Serializer for category with products"""
    category_name = serializers.CharField()
    products = serializers.ListField(child=serializers.DictField())
    total_products = serializers.IntegerField()


class CategoryLastFiveResponseSerializer(serializers.Serializer):
    """Response serializer for CategoryLastFiveView"""
    status = serializers.CharField()
    data = serializers.DictField(child=CategoryProductsSerializer())
    cached = serializers.BooleanField()


class CategoryVendorsSerializer(serializers.Serializer):
    """Serializer for category with vendors"""
    category_name = serializers.CharField()
    vendors = serializers.ListField(child=serializers.DictField())
    total_vendors = serializers.IntegerField()
    returned_count = serializers.IntegerField()


class VendorsBySchoolResponseSerializer(serializers.Serializer):
    """Response serializer for VendorsBySchoolView"""
    status = serializers.CharField()
    data = serializers.DictField(child=CategoryVendorsSerializer())
    school = serializers.CharField()
    cached = serializers.BooleanField()


class ProductCategoryResponseSerializer(serializers.Serializer):
    """Response serializer for ProductCategoryView"""
    category = serializers.CharField()
    user_institution = serializers.CharField(allow_null=True)
    total_products = serializers.IntegerField()
    vendors = serializers.ListField(child=VendorNameSerializer())
    applied_filters = ProductCategoryAppliedFiltersSerializer()
    results = serializers.ListField(child=serializers.DictField(), allow_null=True)


class ErrorResponseSerializer(serializers.Serializer):
    """Generic error response"""
    error = serializers.CharField()
    detail = serializers.CharField(required=False, allow_blank=True)


class ErrorResponseDetailSerializer(serializers.Serializer):
    """Error response with message"""
    error = serializers.CharField()
    message = serializers.CharField(required=False, allow_null=True)