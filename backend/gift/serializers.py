from rest_framework import serializers
from .models import GiftItem, SpinResult


class GiftItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = GiftItem
        fields = [
            "id", "name", "description", "image_url",
            "price", "in_stock", "weight", "is_active",
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class GiftItemAdminSerializer(serializers.ModelSerializer):
    """Full serializer for admin create / update."""
    class Meta:
        model  = GiftItem
        fields = "__all__"


class SpinResultSerializer(serializers.ModelSerializer):
    gift_item = GiftItemSerializer(read_only=True)

    class Meta:
        model  = SpinResult
        fields = ["id", "gift_item", "item_name", "status", "spun_at"]


# ── request / response shapes ──────────────────────────────────────────────────

class SpinResponseSerializer(serializers.Serializer):
    """
    What the user gets back after a successful spin.
    """
    spin_id    = serializers.IntegerField()
    gift_item  = GiftItemSerializer()
    cart_item  = serializers.DictField(allow_null=True)   # CartItemSerializer data
    message    = serializers.CharField()
    next_spin  = serializers.DateTimeField(allow_null=True)


class WheelItemSerializer(serializers.Serializer):
    """
    Lightweight shape used to render the wheel on the frontend.
    Weight is omitted so the client can't cheat.
    """
    id        = serializers.IntegerField(source="pk")
    name      = serializers.CharField()
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None