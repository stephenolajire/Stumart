from rest_framework import serializers
from stumart.serializers import ProductSerializer
from user.serializers import VendorSerializer
from .models import Bookmark, VendorBookmark


# ── Product Bookmark Serializers ───────────────────────────────────────────────

class BookmarkSerializer(serializers.ModelSerializer):
    """Full product detail nested inside a bookmark"""
    product = ProductSerializer(read_only=True)

    class Meta:
        model  = Bookmark
        fields = ["id", "product", "created_at"]


class BookmarkToggleBodySerializer(serializers.Serializer):
    """Request body for POST /bookmarks/toggle/"""
    product_id = serializers.IntegerField()


class BookmarkToggleResponseSerializer(serializers.Serializer):
    """Response for POST /bookmarks/toggle/"""
    bookmarked  = serializers.BooleanField()
    message     = serializers.CharField()
    bookmark_id = serializers.IntegerField(allow_null=True)


class BookmarkStatusResponseSerializer(serializers.Serializer):
    """Response for GET /bookmarks/status/?product_id="""
    bookmarked  = serializers.BooleanField()
    bookmark_id = serializers.IntegerField(allow_null=True)


class BookmarkListResponseSerializer(serializers.Serializer):
    """Response for GET /bookmarks/"""
    bookmarks = BookmarkSerializer(many=True)
    count     = serializers.IntegerField()


# ── Vendor Bookmark Serializers ────────────────────────────────────────────────

class VendorBookmarkSerializer(serializers.ModelSerializer):
    """Full vendor detail nested inside a bookmark"""
    vendor = VendorSerializer(read_only=True)

    class Meta:
        model  = VendorBookmark
        fields = ["id", "vendor", "created_at"]


class VendorBookmarkToggleBodySerializer(serializers.Serializer):
    """Request body for POST /bookmarks/vendors/toggle/"""
    vendor_id = serializers.IntegerField()


class VendorBookmarkToggleResponseSerializer(serializers.Serializer):
    """Response for POST /bookmarks/vendors/toggle/"""
    bookmarked  = serializers.BooleanField()
    message     = serializers.CharField()
    bookmark_id = serializers.IntegerField(allow_null=True)


class VendorBookmarkStatusResponseSerializer(serializers.Serializer):
    """Response for GET /bookmarks/vendors/status/?vendor_id="""
    bookmarked  = serializers.BooleanField()
    bookmark_id = serializers.IntegerField(allow_null=True)


class VendorBookmarkListResponseSerializer(serializers.Serializer):
    """Response for GET /bookmarks/vendors/"""
    bookmarks = VendorBookmarkSerializer(many=True)
    count     = serializers.IntegerField()