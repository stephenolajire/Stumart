from rest_framework import serializers
# ─────────────────────────────────────────────
# REQUEST SERIALIZERS  (what the frontend sends)
# ─────────────────────────────────────────────

class AddToCartRequestSerializer(serializers.Serializer):
    """POST /cart/add/"""
    product_id = serializers.IntegerField(help_text="ID of the product to add")
    quantity    = serializers.IntegerField(default=1, min_value=1)
    size        = serializers.CharField(required=False, allow_null=True,
                                        help_text="Required for fashion products that have sizes")
    color       = serializers.CharField(required=False, allow_null=True,
                                        help_text="Required for fashion products that have colors")


class UpdateCartItemRequestSerializer(serializers.Serializer):
    """PUT /cart/item/<item_id>/update/?cart_code=<code>"""
    quantity = serializers.IntegerField(min_value=1, help_text="New quantity for the cart item")


# ─────────────────────────────────────────────
# RESPONSE SERIALIZERS (what the frontend gets)
# ─────────────────────────────────────────────

class CartProductSerializer(serializers.Serializer):
    """Nested product info inside a cart item"""
    id              = serializers.IntegerField()
    name            = serializers.CharField()
    price           = serializers.DecimalField(max_digits=10, decimal_places=2)
    promotion_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    image           = serializers.ImageField(allow_null=True)
    vendor          = serializers.CharField(source="vendor.email", allow_null=True)


class CartItemResponseSerializer(serializers.Serializer):
    """Single cart item returned after add / update"""
    id       = serializers.IntegerField()
    product  = CartProductSerializer()
    quantity = serializers.IntegerField()
    size     = serializers.CharField(allow_null=True)
    color    = serializers.CharField(allow_null=True)


class CartSummaryResponseSerializer(serializers.Serializer):
    """
    GET /cart/?cart_code=<code>
    Full cart with pricing breakdown.
    """
    items        = CartItemResponseSerializer(many=True)
    count        = serializers.IntegerField(help_text="Total number of cart items")
    sub_total    = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2,
                                            help_text="Dynamic: based on vendor count + registered delivery fee")
    tax          = serializers.DecimalField(max_digits=10, decimal_places=2,
                                            help_text="Flat ₦100 platform tax")
    takeaway     = serializers.DecimalField(max_digits=10, decimal_places=2,
                                            help_text="₦300 takeaway fee — only applied to food orders")
    total        = serializers.DecimalField(max_digits=10, decimal_places=2,
                                            help_text="sub_total + shipping_fee + tax + takeaway")


class CartClearResponseSerializer(serializers.Serializer):
    """DELETE /cart/clear/  — 204 No Content (no body)"""
    pass


class CartItemDeleteResponseSerializer(serializers.Serializer):
    """DELETE /cart/item/<item_id>/remove/  — 204 No Content (no body)"""
    pass
