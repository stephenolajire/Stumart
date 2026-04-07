import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from stumart.models import Cart, CartItem
from stumart.serializers import CartItemSerializer

from .models import GiftItem, SpinResult, can_user_spin
from .serializers import (
    GiftItemAdminSerializer,
    GiftItemSerializer,
    SpinResultSerializer,
    WheelItemSerializer,
)
from .spin import pick_gift

logger = logging.getLogger(__name__)


# ── helpers ────────────────────────────────────────────────────────────────────

def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def _add_to_cart(user, gift_item):
    """
    Adds the won gift item to the user's cart (qty 1, no variant).
    Returns CartItem data dict or None on failure.
    """
    try:
        cart = _get_or_create_cart(user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            gift_item=gift_item,
            product=None,
            size=None,
            color=None,
            defaults={"quantity": 1},
        )
        if not created:
            cart_item.quantity += 1
            cart_item.save(update_fields=["quantity", "updated_at"])
        return CartItemSerializer(cart_item).data
    except Exception:
        logger.exception("Failed to add gift item to cart for user %s", user.pk)
        return None


# ── user-facing views ──────────────────────────────────────────────────────────

class WheelItemsView(APIView):
    """
    GET /gift/wheel-items/

    Returns all active gift items in a lightweight shape safe to expose
    to the client for rendering the wheel animation.
    Weights are NOT included.

    RESPONSE 200 → WheelItemSerializer[]
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = GiftItem.objects.filter(is_active=True)
        serializer = WheelItemSerializer(items, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpinView(APIView):
    """
    POST /gift/spin/

    Performs one spin for the authenticated user.
    - Enforces 24-hour cooldown between spins.
    - Picks a weighted-random GiftItem.
    - Logs the result.
    - Adds the product to the user's cart (if the item has a linked product).

    RESPONSE 200 → {
        spin_id, gift_item, cart_item, message, next_spin
    }
    RESPONSE 429 → { error, next_spin }  — cooldown not elapsed
    RESPONSE 503 → { error }             — no active gift items
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # ── cooldown check ─────────────────────────────────────────────────────
        eligible, next_spin = can_user_spin(user)
        if not eligible:
            return Response(
                {
                    "error": "You have already spun today. Come back later!",
                    "next_spin": next_spin,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── pick winner ────────────────────────────────────────────────────────
        gift_item = pick_gift()
        if gift_item is None:
            return Response(
                {"error": "No gift items are available right now. Check back soon!"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # ── add to cart ────────────────────────────────────────────────────────
        cart_item_data = None
        spin_status = "won"

        cart_item_data = _add_to_cart(user, gift_item)
        if cart_item_data is None:
            spin_status = "failed"

        # ── log spin ───────────────────────────────────────────────────────────
        spin_result = SpinResult.objects.create(
            user=user,
            gift_item=gift_item,
            item_name=gift_item.name,
            status=spin_status,
        )

        next_allowed = spin_result.spun_at + timezone.timedelta(hours=24)

        message = (
            f"Congratulations! You won {gift_item.name}!"
            if spin_status == "won"
            else f"You landed on {gift_item.name} but we couldn't add it to your cart. "
                 "Please contact support."
        )

        return Response(
            {
                "spin_id":   spin_result.pk,
                "gift_item": WheelItemSerializer(gift_item, context={"request": request}).data,
                "cart_item": cart_item_data,
                "message":   message,
                "next_spin": next_allowed,
            },
            status=status.HTTP_200_OK,
        )


class MySpinHistoryView(APIView):
    """
    GET /gift/my-spins/

    Returns the authenticated user's spin history.

    RESPONSE 200 → SpinResultSerializer[]
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = SpinResult.objects.filter(user=request.user).select_related("gift_item")
        serializer = SpinResultSerializer(results, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpinEligibilityView(APIView):
    """
    GET /gift/can-spin/

    Quick check so the frontend can enable/disable the spin button.

    RESPONSE 200 → { can_spin: bool, next_spin: datetime | null }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        eligible, next_spin = can_user_spin(request.user)
        return Response(
            {"can_spin": eligible, "next_spin": next_spin},
            status=status.HTTP_200_OK,
        )


# ── admin views ────────────────────────────────────────────────────────────────

class AdminGiftItemListCreateView(APIView):
    """
    GET  /gift/admin/items/       — list all gift items (admin only)
    POST /gift/admin/items/       — create a gift item

    POST REQUEST BODY:
        name         str       (required)
        description  str       (optional)
        image        file      (optional, multipart)
        weight       int       (default 10)
        is_active    bool      (default true)
        product      int|null  (product id)

    RESPONSE 200/201 → GiftItemAdminSerializer
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        items = GiftItem.objects.all()
        serializer = GiftItemAdminSerializer(items, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = GiftItemAdminSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminGiftItemDetailView(APIView):
    """
    GET    /gift/admin/items/<pk>/   — retrieve
    PUT    /gift/admin/items/<pk>/   — full update
    PATCH  /gift/admin/items/<pk>/   — partial update
    DELETE /gift/admin/items/<pk>/   — delete

    RESPONSE 200 → GiftItemAdminSerializer
    RESPONSE 204 → No content (delete)
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def _get_item(self, pk):
        try:
            return GiftItem.objects.get(pk=pk)
        except GiftItem.DoesNotExist:
            return None

    def get(self, request, pk):
        item = self._get_item(pk)
        if not item:
            return Response({"error": "Gift item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(GiftItemAdminSerializer(item, context={"request": request}).data)

    def put(self, request, pk):
        item = self._get_item(pk)
        if not item:
            return Response({"error": "Gift item not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = GiftItemAdminSerializer(
            item, data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        item = self._get_item(pk)
        if not item:
            return Response({"error": "Gift item not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = GiftItemAdminSerializer(
            item, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self._get_item(pk)
        if not item:
            return Response({"error": "Gift item not found."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminSpinHistoryView(APIView):
    """
    GET /gift/admin/spins/

    Query params:
        user_id   int      (optional — filter by user)
        status    str      (optional — "won" | "failed")

    RESPONSE 200 → SpinResultSerializer[]
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = SpinResult.objects.select_related("gift_item", "user").all()

        user_id = request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        spin_status = request.query_params.get("status")
        if spin_status in ("won", "failed"):
            qs = qs.filter(status=spin_status)

        serializer = SpinResultSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)