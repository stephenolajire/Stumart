from rest_framework import serializers
from .models import *
import json
from user.models import Vendor
from django.contrib.auth import get_user_model
from django.utils import timezone
import re

User = get_user_model()


# ══════════════════════════════════════════════════════════════════
#  EXISTING MODEL SERIALIZERS  (unchanged — keep for compatibility)
# ══════════════════════════════════════════════════════════════════

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'institution']


class VendorProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = Vendor
        fields = ['id', 'user', 'business_category', 'business_description']


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
    additional_images  = serializers.SerializerMethodField()
    sizes              = ProductSizeSerializer(many=True, read_only=True)
    colors             = ProductColorSerializer(many=True, read_only=True)
    image_url          = serializers.SerializerMethodField()
    vendor_name        = serializers.SerializerMethodField()
    vendor_rating      = serializers.SerializerMethodField()
    vendor_category    = serializers.SerializerMethodField()
    vendor_institution = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'in_stock',
            'gender', 'created_at', 'updated_at',
            'additional_images', 'sizes', 'colors', 'image_url',
            'vendor_name', 'vendor_rating', 'vendor_category',
            'vendor_institution', 'keyword', 'promotion_price', 'delivery_day',
        ]

    def get_vendor_name(self, obj):
        try:
            return (
                obj.vendor.vendor_profile.business_name
                if hasattr(obj.vendor, 'vendor_profile')
                else f"{obj.vendor.first_name} {obj.vendor.last_name}"
            )
        except AttributeError:
            return "Unknown Vendor"

    def get_vendor_category(self, obj):
        try:
            return obj.vendor.vendor_profile.business_category if hasattr(obj.vendor, 'vendor_profile') else None
        except AttributeError:
            return None

    def get_vendor_institution(self, obj):
        try:
            return obj.vendor.institution if hasattr(obj.vendor, 'vendor_profile') else None
        except AttributeError:
            return None

    def get_vendor_rating(self, obj):
        return 4.5  # Placeholder

    def get_image_url(self, obj):
        if obj.image:
            resized_url = obj.image.build_url(width=300, height=300, crop='fill')
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(resized_url)
            return resized_url
        return None

    def get_additional_images(self, obj):
        request = self.context.get('request')
        images = []
        for image in obj.additional_images.all()[:4]:
            image_url = None
            if image.image:
                image_url = image.image.build_url(width=300, height=300, crop='fill')
                if request:
                    image_url = request.build_absolute_uri(image_url)
            images.append({'id': image.id, 'image_url': image_url})
        return images


class ProductCreateSerializer(serializers.ModelSerializer):
    sizes    = serializers.CharField(required=False)
    colors   = serializers.CharField(required=False)
    keyword  = serializers.CharField(required=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'in_stock',
            'image', 'gender', 'sizes', 'colors', 'keyword', 'delivery_day',
        ]
        read_only_fields = ['vendor']

    def validate_keyword(self, value):
        if not value.strip():
            raise serializers.ValidationError("Keywords are required")
        if len(value) > 200:
            raise serializers.ValidationError("Keywords must be less than 200 characters")
        keywords = [kw.strip() for kw in value.split(',')]
        if not all(keywords):
            raise serializers.ValidationError("Invalid keyword format. Use comma-separated values")
        return value.strip()

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        try:
            vendor = Vendor.objects.get(user=request.user)
            business_category = vendor.business_category or None
        except Vendor.DoesNotExist:
            raise serializers.ValidationError("User is not registered as a vendor")
        if not data.get('keyword'):
            raise serializers.ValidationError({"keyword": "Keywords are required for all products"})
        validation_method = getattr(self, f'validate_{business_category}', self.validate_default)
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
        if 'in_stock' in data:
            data.pop('in_stock')
        return data

    def validate_delivery_day(self, value):
        if not value:
            return value
        value = str(value).strip().lower()
        if len(value) < 3:
            raise serializers.ValidationError("Delivery day must be specified (e.g., '2 days', '1 day').")
        pattern = r'^(\d+)\s+(day|days)$'
        match = re.match(pattern, value)
        if not match:
            raise serializers.ValidationError("Delivery day must be in format like '1 day', '2 days'.")
        days_count = int(match.group(1))
        if days_count < 1:
            raise serializers.ValidationError("Delivery day must be at least 1 day.")
        if days_count > 30:
            raise serializers.ValidationError("Delivery day cannot exceed 30 days.")
        return "1 day" if days_count == 1 else f"{days_count} days"

    def validate_default(self, data):
        if not data.get('in_stock') and data.get('in_stock') != 0:
            raise serializers.ValidationError({"in_stock": "Stock quantity is required"})
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user
        try:
            vendor = Vendor.objects.get(user=user)
            business_category = vendor.business_category or None
        except Vendor.DoesNotExist:
            raise serializers.ValidationError("User is not registered as a vendor")

        sizes_data  = validated_data.pop('sizes', None)
        colors_data = validated_data.pop('colors', None)
        product = Product.objects.create(vendor=user, **validated_data)

        if business_category == 'fashion' and sizes_data:
            try:
                for size_item in json.loads(sizes_data):
                    ProductSize.objects.create(product=product, size=size_item['size'], quantity=size_item['quantity'])
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error parsing sizes data: {e}")

        if business_category == 'fashion' and colors_data:
            try:
                for color_item in json.loads(colors_data):
                    ProductColor.objects.create(product=product, color=color_item['color'], quantity=color_item['quantity'])
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error parsing colors data: {e}")

        for key, file in request.FILES.items():
            if key.startswith('additional_images_'):
                ProductImage.objects.create(product=product, image=file)

        return product


class CartItemSerializer(serializers.ModelSerializer):
    product_name    = serializers.CharField(source='product.name', read_only=True)
    product_price   = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    promotion_price = serializers.DecimalField(source='product.promotion_price', max_digits=10, decimal_places=2, read_only=True)
    product_image   = serializers.SerializerMethodField()
    total_price     = serializers.SerializerMethodField()
    delivery_day    = serializers.CharField(source='product.delivery_day', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'product_image',
            'quantity', 'size', 'color', 'total_price', 'created_at',
            'promotion_price', 'delivery_day',
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
    items       = CartItemSerializer(many=True, read_only=True, source='cartitem_set')
    total_price = serializers.SerializerMethodField()
    item_count  = serializers.SerializerMethodField()

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
            'order_items', 'transaction', 'image_url', 'confirm',
            'picker', 'packed', 'reviewed', 'vendor_is_nearby',
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


class OrderDetailSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    transaction = serializers.SerializerMethodField()
    image_url   = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'first_name', 'last_name',
            'email', 'phone', 'address', 'room_number', 'subtotal',
            'shipping_fee', 'tax', 'total', 'order_status', 'created_at',
            'order_items', 'transaction', 'image_url',
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
            txn = Transaction.objects.get(order=obj)
            return TransactionSerializer(txn).data
        except Transaction.DoesNotExist:
            return None


class VendorDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'business_name', 'business_category', 'specific_category',
            'shop_image', 'rating', 'total_ratings', 'user',
        ]


class ServiceApplicationSerializer(serializers.ModelSerializer):
    service_name     = serializers.CharField(source='service.business_name', read_only=True)
    service_category = serializers.CharField(source='service.specific_category', read_only=True)

    class Meta:
        model = ServiceApplication
        fields = [
            'id', 'service', 'service_name', 'service_category', 'user',
            'name', 'email', 'phone', 'description', 'preferred_date',
            'additional_details', 'status', 'created_at', 'updated_at',
            'vendor_response', 'response_date', 'completion_date',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if 'service' in data and hasattr(data['service'], 'is_active') and not data['service'].is_active:
            raise serializers.ValidationError({"service": "This service is not currently available"})
        if 'preferred_date' in data and data['preferred_date'].date() < timezone.now().date():
            raise serializers.ValidationError({"preferred_date": "Please select a future date"})
        return data


class VendorReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    vendor_name   = serializers.SerializerMethodField()

    class Meta:
        model = VendorReview
        fields = [
            'id', 'order', 'vendor', 'reviewer', 'rating',
            'comment', 'created_at', 'reviewer_name', 'vendor_name',
        ]
        read_only_fields = ['reviewer', 'created_at']

    def get_reviewer_name(self, obj):
        return f"{obj.reviewer.first_name} {obj.reviewer.last_name}" if obj.reviewer else "Anonymous"

    def get_vendor_name(self, obj):
        return obj.vendor.business_name

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)


class PickerReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    picker_name   = serializers.SerializerMethodField()

    class Meta:
        model = PickerReview
        fields = [
            'id', 'order', 'picker', 'reviewer', 'rating',
            'comment', 'created_at', 'reviewer_name', 'picker_name',
        ]
        read_only_fields = ['reviewer', 'created_at']

    def get_reviewer_name(self, obj):
        return f"{obj.reviewer.first_name} {obj.reviewer.last_name}" if obj.reviewer else "Anonymous"

    def get_picker_name(self, obj):
        return f"{obj.picker.first_name} {obj.picker.last_name}"

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reviewer'] = request.user
        return super().create(validated_data)


class ReviewSubmissionSerializer(serializers.Serializer):
    order_id       = serializers.IntegerField()
    vendor_id      = serializers.IntegerField()
    picker_id      = serializers.IntegerField()
    vendor_rating  = serializers.IntegerField(min_value=1, max_value=5)
    vendor_comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    picker_rating  = serializers.IntegerField(min_value=1, max_value=5)
    picker_comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class ProductReviewSerializer(serializers.ModelSerializer):
    reviewer_name        = serializers.CharField(read_only=True)
    product_name         = serializers.CharField(source='product.name', read_only=True)
    order_number         = serializers.CharField(source='order.order_number', read_only=True)
    created_at_formatted = serializers.SerializerMethodField()
    updated_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'product_name', 'reviewer', 'reviewer_name',
            'order', 'order_number', 'rating', 'comment',
            'created_at', 'created_at_formatted',
            'updated_at', 'updated_at_formatted',
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
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            product = data.get('product')
            if product and user.is_authenticated:
                has_bought = OrderItem.objects.filter(
                    product=product,
                    order__user=user,
                    order__order_status__in=['DELIVERED', 'COMPLETED'],
                ).exists()
                if not has_bought:
                    raise serializers.ValidationError("You can only review products you have purchased")
        return data


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ['rating', 'comment']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class ProductReviewStatsSerializer(serializers.Serializer):
    total_reviews    = serializers.IntegerField()
    average_rating   = serializers.FloatField()
    rating_breakdown = serializers.DictField()


class ProductReviewListSerializer(serializers.Serializer):
    reviews = ProductReviewSerializer(many=True)
    stats   = ProductReviewStatsSerializer()


class RegisterVideoSerializer(serializers.ModelSerializer):
    video_url        = serializers.SerializerMethodField()
    video_secure_url = serializers.SerializerMethodField()

    class Meta:
        model = RegisterVideo
        fields = ['id', 'name', 'video_url', 'video_secure_url', 'uploaded_at']

    def get_video_url(self, obj):        return obj.video_url
    def get_video_secure_url(self, obj): return obj.video_secure_url


class AddProductVideoSerializer(serializers.ModelSerializer):
    video_url        = serializers.SerializerMethodField()
    video_secure_url = serializers.SerializerMethodField()

    class Meta:
        model = AddProductVideo
        fields = ['id', 'name', 'video_url', 'video_secure_url', 'uploaded_at']

    def get_video_url(self, obj):        return obj.video_url
    def get_video_secure_url(self, obj): return obj.video_secure_url


# ══════════════════════════════════════════════════════════════════
#  REQUEST SERIALIZERS  — documents what the frontend must SEND
#
#  Naming convention:
#    <ViewName>QuerySerializer  — for GET query params
#    <ViewName>BodySerializer   — for POST/PUT request body
# ══════════════════════════════════════════════════════════════════

class SpecificVendorProductsQuerySerializer(serializers.Serializer):
    page      = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)


class VendorsByCategoryQuerySerializer(serializers.Serializer):
    business_category = serializers.CharField(
        help_text="Required. e.g. 'food', 'fashion', 'electronics', 'others'"
    )
    specific_category = serializers.CharField(required=False, allow_blank=True)


class VendorsBySchoolAndCategoryQuerySerializer(serializers.Serializer):
    school            = serializers.CharField(required=False, allow_blank=True)
    business_category = serializers.CharField(required=False, allow_blank=True)
    specific_category = serializers.CharField(required=False, allow_blank=True)


class AllProductsQuerySerializer(serializers.Serializer):
    category          = serializers.CharField(required=False, allow_blank=True)
    minPrice          = serializers.DecimalField(required=False, max_digits=12, decimal_places=2, default=0)
    maxPrice          = serializers.DecimalField(required=False, max_digits=12, decimal_places=2, default=999999999)
    search            = serializers.CharField(required=False, allow_blank=True)
    sort              = serializers.ChoiceField(
        required=False, default='newest',
        choices=['newest', 'price_low', 'price_high', 'rating'],
    )
    state             = serializers.CharField(required=False, allow_blank=True)
    school            = serializers.CharField(required=False, allow_blank=True)
    vendor            = serializers.CharField(required=False, allow_blank=True)
    viewOtherProducts = serializers.BooleanField(required=False, default=False)


class SearchProductsQuerySerializer(serializers.Serializer):
    product_name = serializers.CharField(required=False, allow_blank=True)
    state        = serializers.CharField(required=False, allow_blank=True)
    institution  = serializers.CharField(required=False, allow_blank=True)


class SearchServicesQuerySerializer(serializers.Serializer):
    keyword = serializers.CharField(help_text="Required. Searches vendor business name and specific category")


class SearchSpecificServiceQuerySerializer(serializers.Serializer):
    specific_category = serializers.CharField(required=False, allow_blank=True)
    state             = serializers.CharField(required=False, allow_blank=True)
    institution       = serializers.CharField(required=False, allow_blank=True)


class ServiceApplicationCreateBodySerializer(serializers.Serializer):
    service_id        = serializers.IntegerField()
    name              = serializers.CharField()
    email             = serializers.EmailField()
    phone             = serializers.CharField()
    description       = serializers.CharField()
    preferredDate     = serializers.DateTimeField(help_text="ISO 8601 format, must be a future date")
    additionalDetails = serializers.CharField(required=False, allow_blank=True)


class ApplicationStatusUpdateBodySerializer(serializers.Serializer):
    status          = serializers.ChoiceField(choices=['pending', 'accepted', 'rejected', 'completed'])
    vendor_response = serializers.CharField(required=False, allow_blank=True)


class MySubmittedApplicationsQuerySerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        required=False,
        choices=['pending', 'accepted', 'rejected', 'completed'],
    )


class VendorReviewCreateBodySerializer(serializers.Serializer):
    order   = serializers.IntegerField()
    vendor  = serializers.IntegerField()
    rating  = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class PickerReviewCreateBodySerializer(serializers.Serializer):
    order   = serializers.IntegerField()
    picker  = serializers.IntegerField()
    rating  = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class SubmitReviewsBodySerializer(serializers.Serializer):
    order_id       = serializers.IntegerField()
    vendor_id      = serializers.IntegerField()
    picker_id      = serializers.IntegerField()
    vendor_rating  = serializers.IntegerField(min_value=1, max_value=5)
    vendor_comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    picker_rating  = serializers.IntegerField(min_value=1, max_value=5)
    picker_comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ProductCreateBodySerializer(serializers.Serializer):
    name         = serializers.CharField()
    description  = serializers.CharField()
    price        = serializers.DecimalField(max_digits=12, decimal_places=2)
    in_stock     = serializers.IntegerField(required=False)
    image        = serializers.ImageField()
    keyword      = serializers.CharField(help_text="Comma-separated keywords e.g. 'shirt,polo,cotton'")
    delivery_day = serializers.CharField(required=False)
    gender       = serializers.CharField(required=False)
    sizes        = serializers.CharField(required=False)
    colors       = serializers.CharField(required=False)


class ProductReviewCreateBodySerializer(serializers.Serializer):
    rating  = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ProductReviewUpdateBodySerializer(serializers.Serializer):
    rating  = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


# ══════════════════════════════════════════════════════════════════
#  RESPONSE SERIALIZERS — documents what the frontend will RECEIVE
# ══════════════════════════════════════════════════════════════════

class PaginationMetaSerializer(serializers.Serializer):
    current_page   = serializers.IntegerField()
    total_pages    = serializers.IntegerField()
    total_products = serializers.IntegerField()
    has_next       = serializers.BooleanField()
    has_previous   = serializers.BooleanField()
    page_size      = serializers.IntegerField()


class VendorSummarySerializer(serializers.Serializer):
    business_name        = serializers.CharField()
    shop_image           = serializers.URLField(allow_null=True)
    business_category    = serializers.CharField(allow_null=True)
    business_description = serializers.CharField(allow_null=True)
    rating               = serializers.FloatField(allow_null=True)


class SpecificVendorProductsResponseSerializer(serializers.Serializer):
    vendor_details = VendorSummarySerializer()
    products       = ProductSerializer(many=True)
    pagination     = PaginationMetaSerializer()


class GetVendorResponseSerializer(serializers.Serializer):
    business_category = serializers.CharField(allow_blank=True)
    vendor_id         = serializers.IntegerField()
    business_name     = serializers.CharField()


class ProductCreateResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    data    = ProductCreateSerializer()


class ProductUpdateResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    data    = ProductCreateSerializer()


class ProductDeleteResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class SearchProductsResponseSerializer(serializers.Serializer):
    status      = serializers.ChoiceField(choices=['success', 'not_found', 'error'])
    count       = serializers.IntegerField(required=False)
    products    = ProductSerializer(many=True, required=False)
    search_type = serializers.ChoiceField(choices=['product', 'vendor'], required=False)
    message     = serializers.CharField(required=False)


class SearchSpecificServiceResponseSerializer(serializers.Serializer):
    status        = serializers.ChoiceField(choices=['success', 'not_found', 'error'])
    count         = serializers.IntegerField(required=False)
    services      = VendorDetailSerializer(many=True, required=False)
    search_params = serializers.DictField(required=False)
    message       = serializers.CharField(required=False)


class ServiceApplicationCreateResponseSerializer(serializers.Serializer):
    id                 = serializers.IntegerField()
    service            = serializers.IntegerField()
    service_name       = serializers.CharField()
    service_category   = serializers.CharField(allow_null=True)
    user               = serializers.IntegerField(allow_null=True)
    name               = serializers.CharField()
    email              = serializers.EmailField()
    phone              = serializers.CharField()
    description        = serializers.CharField()
    preferred_date     = serializers.DateTimeField()
    additional_details = serializers.CharField(allow_null=True)
    status             = serializers.CharField()
    created_at         = serializers.DateTimeField()
    updated_at         = serializers.DateTimeField()


class MySubmittedApplicationsResponseSerializer(serializers.Serializer):
    message      = serializers.CharField()
    applications = ServiceApplicationSerializer(many=True)


class ReviewSubmitResponseSerializer(serializers.Serializer):
    message       = serializers.CharField()
    vendor_review = VendorReviewSerializer()
    picker_review = PickerReviewSerializer()


class ProductReviewItemSerializer(serializers.Serializer):
    """Single review object returned inside list/create/update responses"""
    id            = serializers.IntegerField()
    rating        = serializers.IntegerField()
    comment       = serializers.CharField(allow_null=True)
    reviewer_name = serializers.CharField()
    created_at    = serializers.CharField()
    order_number  = serializers.CharField(allow_null=True)


class ProductReviewStatsResponseSerializer(serializers.Serializer):
    total_reviews    = serializers.IntegerField()
    average_rating   = serializers.FloatField()
    rating_breakdown = serializers.DictField(
        help_text="Keys '1'–'5', values = count of reviews for that rating"
    )


class ProductReviewListResponseSerializer(serializers.Serializer):
    reviews = ProductReviewItemSerializer(many=True)
    stats   = ProductReviewStatsResponseSerializer()


class UserReviewStatusResponseSerializer(serializers.Serializer):
    has_bought      = serializers.BooleanField()
    has_reviewed    = serializers.BooleanField()
    existing_review = serializers.DictField(allow_null=True)


class ProductReviewCreateResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    review  = ProductReviewItemSerializer()


class ProductReviewUpdateResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    review  = serializers.DictField()


class ProductReviewDeleteResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class UserReviewListResponseSerializer(serializers.Serializer):
    reviews = serializers.ListField(child=serializers.DictField())

class BothVideosResponseSerializer(serializers.Serializer):
    success        = serializers.BooleanField()
    register_video = RegisterVideoSerializer(allow_null=True)
    product_video  = AddProductVideoSerializer(allow_null=True)