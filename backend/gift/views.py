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
    try:
        cart = _get_or_create_cart(user)
        CartItem.objects.filter(cart=cart, gift_item__isnull=False).delete()
        cart_item = CartItem.objects.create(
            cart=cart,
            gift_item=gift_item,
            product=None,
            size=None,
            color=None,
            quantity=1,
        )
        return CartItemSerializer(cart_item).data
    except Exception:
        logger.exception("Failed to add gift item to cart for user %s", user.pk)
        return None


def _is_no_win(gift_item):
    """
    Returns True when the spun item is a consolation / "come back tomorrow"
    slot that should NOT be added to the cart.

    Two complementary checks:
      1. Explicit flag  — cleanest; add `is_no_win = BooleanField(default=False)`
         to GiftItem if you want full admin control.
      2. Name fallback  — works today without a migration.
    """
    # Preferred: explicit model field (add to GiftItem + run migration when ready)
    if hasattr(gift_item, "is_no_win") and gift_item.is_no_win:
        return True

    # Fallback: name-based detection
    name = (gift_item.name or "").lower()
    return any(
        phrase in name
        for phrase in ("come back", "tomorrow", "try again", "better luck")
    )


# ── user-facing views ──────────────────────────────────────────────────────────

class WheelItemsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = GiftItem.objects.filter(is_active=True)
        serializer = WheelItemSerializer(items, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpinView(APIView):
    """
    POST /gift/spin/

    - Enforces 24-hour cooldown.
    - Picks a weighted-random GiftItem.
    - Adds to cart ONLY for real prizes (skips no-win slots).
    - Logs the result with status: "won" | "no_win" | "failed".

    RESPONSE 200 → { spin_id, gift_item, cart_item, message, next_spin }
    RESPONSE 429 → { error, next_spin }
    RESPONSE 503 → { error }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # ── cooldown check ─────────────────────────────────────────────────────
        eligible, next_spin = can_user_spin(user)
        if not eligible:
            return Response(
                {"error": "You have already spun today. Come back later!", "next_spin": next_spin},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── pick winner ────────────────────────────────────────────────────────
        gift_item = pick_gift()
        if gift_item is None:
            return Response(
                {"error": "No gift items are available right now. Check back soon!"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # ── add to cart (real prizes only) ─────────────────────────────────────
        cart_item_data = None
        spin_status = "won"

        if _is_no_win(gift_item):
            spin_status = "no_win"          # skip cart entirely
        else:
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

        if spin_status == "won":
            message = f"Congratulations! You won {gift_item.name}!"
        elif spin_status == "no_win":
            message = "Not your lucky day — come back tomorrow for another spin!"
        else:
            message = (
                f"You landed on {gift_item.name} but we couldn't add it to your cart. "
                "Please contact support."
            )

        return Response(
            {
                "spin_id":   spin_result.pk,
                "gift_item": WheelItemSerializer(gift_item, context={"request": request}).data,
                "cart_item": cart_item_data,   # None for no_win and failed
                "message":   message,
                "next_spin": next_allowed,
            },
            status=status.HTTP_200_OK,
        )


class MySpinHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = SpinResult.objects.filter(user=request.user).select_related("gift_item")
        serializer = SpinResultSerializer(results, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SpinEligibilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        eligible, next_spin = can_user_spin(request.user)
        return Response(
            {"can_spin": eligible, "next_spin": next_spin},
            status=status.HTTP_200_OK,
        )


# ── admin views ────────────────────────────────────────────────────────────────

class AdminGiftItemListCreateView(APIView):
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
        serializer = GiftItemAdminSerializer(item, data=request.data, context={"request": request})
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
    Query params: user_id, status ("won" | "failed" | "no_win")
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = SpinResult.objects.select_related("gift_item", "user").all()

        user_id = request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)

        spin_status = request.query_params.get("status")
        if spin_status in ("won", "failed", "no_win"):
            qs = qs.filter(status=spin_status)

        serializer = SpinResultSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)