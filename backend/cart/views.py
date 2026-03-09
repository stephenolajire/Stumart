# ── cart/views.py  ────────────────────────────────────────────────────────────
#
# All endpoints now require IsAuthenticated.
# Cart is fetched/created via request.user — no cart_code anywhere.

import logging
from decimal import Decimal

from django.db.models import Case, Count, DecimalField, F, OuterRef, Subquery, Sum, When
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from stumart.models import Cart, CartItem, Product
from stumart.serializers import CartItemSerializer
from user.models import Vendor

from .serializers import (
    AddToCartRequestSerializer,
    CartSummaryResponseSerializer,
    UpdateCartItemRequestSerializer,
)
from .utils import TAX_FEE, calculate_shipping_fee, calculate_takeaway_fee

logger = logging.getLogger(__name__)


def get_or_create_user_cart(user):
    """Helper — always returns the cart for the given user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class AddToCartView(APIView):
    """
    POST /cart/add/

    REQUEST BODY:
        product_id  int       (required)
        quantity    int       (default 1)
        size        str|null
        color       str|null

    RESPONSE 201 → CartItemSerializer (created)
    RESPONSE 200 → CartItemSerializer (quantity updated on existing item)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = AddToCartRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data       = req_serializer.validated_data
        product_id = data["product_id"]
        quantity   = data["quantity"]
        size       = data.get("size")
        color      = data.get("color")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        # ── Fashion-category validation ────────────────────────────────────────
        is_fashion = False
        try:
            vendor_profile = Vendor.objects.get(user=product.vendor)
            is_fashion = vendor_profile.business_category == "fashion"
        except Vendor.DoesNotExist:
            pass

        if is_fashion:
            if product.colors.exists() and not color:
                return Response(
                    {"error": "Color is required for this fashion product."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if product.sizes.exists() and not size:
                return Response(
                    {"error": "Size is required for this fashion product."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        cart = get_or_create_user_cart(request.user)

        # Normalise size/color so lookup keys are consistent
        resolved_size  = size  if is_fashion else None
        resolved_color = color if is_fashion else None

        # ── Find existing item matching product + variant ─────────────────────
        # For fashion: same product + same size + same color = same item
        # For non-fashion: same product is enough (size/color are both None)
        lookup = dict(
            cart=cart,
            product=product,
            size=resolved_size,
            color=resolved_color,
        )

        cart_item, created = CartItem.objects.get_or_create(
            **lookup,
            defaults={"quantity": quantity},
        )

        if not created:
            # Item already exists → stack the quantity
            cart_item.quantity += quantity
            cart_item.save(update_fields=["quantity", "updated_at"])

        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(CartItemSerializer(cart_item).data, status=response_status)


class UpdateCartItemView(APIView):
    """
    PUT /cart/item/<item_id>/update/

    REQUEST BODY:
        quantity  int  (required)

    RESPONSE 200 → CartItemSerializer
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        try:
            cart_item = CartItem.objects.select_related("cart").get(id=item_id)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure the item belongs to the requesting user
        if cart_item.cart.user != request.user:
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        req_serializer = UpdateCartItemRequestSerializer(data=request.data)
        if not req_serializer.is_valid():
            return Response(req_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = req_serializer.validated_data["quantity"]
        cart_item.save()

        return Response(CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)


class RemoveCartItemView(APIView):
    """
    DELETE /cart/item/<item_id>/remove/

    RESPONSE 204 → No content
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        try:
            cart_item = CartItem.objects.select_related("cart").get(id=item_id)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        if cart_item.cart.user != request.user:
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClearCartView(APIView):
    """
    DELETE /cart/clear/

    RESPONSE 204 → No content
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_or_create_user_cart(request.user)
        CartItem.objects.filter(cart=cart).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CartItemsView(APIView):
    """
    GET /cart/

    RESPONSE 200 → CartSummaryResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = get_or_create_user_cart(request.user)

        base_qs = CartItem.objects.filter(cart=cart)

        # Subquery: distinct vendor count
        vendor_subquery = (
            base_qs.values("cart")
            .annotate(vendor_count=Count("product__vendor", distinct=True))
            .values("vendor_count")[:1]
        )

        # Subquery: subtotal respecting promotion_price
        subtotal_subquery = (
            base_qs.values("cart")
            .annotate(
                sub_total=Sum(
                    Case(
                        When(
                            product__promotion_price__gt=0,
                            then=F("product__promotion_price") * F("quantity"),
                        ),
                        default=F("product__price") * F("quantity"),
                        output_field=DecimalField(),
                    )
                )
            )
            .values("sub_total")[:1]
        )

        cart_items = (
            base_qs
            .select_related("product", "product__vendor", "product__vendor__vendor_profile")
            .annotate(
                vendor_count=Subquery(vendor_subquery),
                sub_total=Subquery(subtotal_subquery),
            )
        )

        if cart_items.exists():
            sub_total    = cart_items[0].sub_total    or Decimal("0.00")
            vendor_count = cart_items[0].vendor_count or 0
        else:
            sub_total    = Decimal("0.00")
            vendor_count = 0

        shipping_fee = calculate_shipping_fee(vendor_count, cart_items)
        takeaway     = calculate_takeaway_fee(cart_items)
        tax          = TAX_FEE
        total        = sub_total + shipping_fee + tax + takeaway

        response_data = {
            "items":        CartItemSerializer(cart_items, many=True).data,
            "count":        cart_items.count(),
            "sub_total":    sub_total,
            "shipping_fee": shipping_fee,
            "tax":          tax,
            "takeaway":     takeaway,
            "total":        total,
        }

        serializer = CartSummaryResponseSerializer(data=response_data)
        serializer.is_valid()   # non-fatal shape check

        return Response(response_data, status=status.HTTP_200_OK)