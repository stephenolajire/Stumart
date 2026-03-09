from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .models import Bookmark, VendorBookmark
from stumart.models import Product
from user.models import Vendor
from .serializers import (
    BookmarkSerializer,
    BookmarkToggleBodySerializer,
    BookmarkToggleResponseSerializer,
    BookmarkStatusResponseSerializer,
    BookmarkListResponseSerializer,
    VendorBookmarkSerializer,
    VendorBookmarkToggleBodySerializer,
    VendorBookmarkToggleResponseSerializer,
    VendorBookmarkStatusResponseSerializer,
    VendorBookmarkListResponseSerializer,
)


# ── Product Bookmark Views ─────────────────────────────────────────────────────

class BookmarkListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkListResponseSerializer

    @extend_schema(
        responses=BookmarkListResponseSerializer,
        description="Retrieve all product bookmarks for the authenticated user",
    )
    def get(self, request):
        bookmarks = (
            Bookmark.objects
            .filter(user=request.user)
            .select_related("product", "product__vendor")
            .prefetch_related(
                "product__additional_images",
                "product__sizes",
                "product__colors",
            )
        )
        serializer = BookmarkSerializer(
            bookmarks, many=True, context={"request": request}
        )
        return Response(
            {"bookmarks": serializer.data, "count": bookmarks.count()},
            status=status.HTTP_200_OK,
        )


class VendorBookmarkListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VendorBookmarkListResponseSerializer

    @extend_schema(
        responses=VendorBookmarkListResponseSerializer,
        description="Retrieve all vendor bookmarks for the authenticated user",
    )
    def get(self, request):
        bookmarks = (
            VendorBookmark.objects
            .filter(user=request.user)
            .select_related("vendor", "vendor__user")
        )
        serializer = VendorBookmarkSerializer(
            bookmarks, many=True, context={"request": request}
        )
        return Response(
            {"bookmarks": serializer.data, "count": bookmarks.count()},
            status=status.HTTP_200_OK,
        )


class BookmarkToggleView(APIView):
    """
    POST /api/bookmarks/toggle/
    Body: { product_id: int }
    • If bookmark does NOT exist → creates it, returns bookmarked=true
    • If bookmark already EXISTS → deletes it, returns bookmarked=false
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkToggleBodySerializer

    @extend_schema(
        request=BookmarkToggleBodySerializer,
        responses=BookmarkToggleResponseSerializer,
        description="Toggle a product bookmark on or off",
    )
    def post(self, request):
        body_serializer = BookmarkToggleBodySerializer(data=request.data)
        if not body_serializer.is_valid():
            return Response(body_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        product_id = body_serializer.validated_data["product_id"]

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user, product=product
        )

        if not created:
            bookmark.delete()
            response_serializer = BookmarkToggleResponseSerializer({
                "bookmarked": False,
                "message": "Bookmark removed",
                "bookmark_id": None,
            })
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        response_serializer = BookmarkToggleResponseSerializer({
            "bookmarked": True,
            "message": "Bookmark added",
            "bookmark_id": bookmark.id,
        })
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class BookmarkStatusView(APIView):
    """
    GET /api/bookmarks/status/?product_id=<int>
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkStatusResponseSerializer

    @extend_schema(
        responses=BookmarkStatusResponseSerializer,
        description="Check if a product is bookmarked by the authenticated user",
    )
    def get(self, request):
        product_id = request.query_params.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bookmark = Bookmark.objects.get(user=request.user, product_id=product_id)
            response_serializer = BookmarkStatusResponseSerializer({
                "bookmarked": True,
                "bookmark_id": bookmark.id,
            })
        except Bookmark.DoesNotExist:
            response_serializer = BookmarkStatusResponseSerializer({
                "bookmarked": False,
                "bookmark_id": None,
            })

        return Response(response_serializer.data, status=status.HTTP_200_OK)


class BookmarkRemoveView(APIView):
    """
    DELETE /api/bookmarks/<bookmark_id>/remove/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer

    @extend_schema(
        responses={200: BookmarkToggleResponseSerializer},
        description="Remove a specific product bookmark by its ID",
    )
    def delete(self, request, bookmark_id):
        try:
            bookmark = Bookmark.objects.get(id=bookmark_id, user=request.user)
        except Bookmark.DoesNotExist:
            return Response(
                {"error": "Bookmark not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookmark.delete()
        return Response(
            {"message": "Bookmark removed successfully"},
            status=status.HTTP_200_OK,
        )


# ── Vendor Bookmark Views ──────────────────────────────────────────────────────


class VendorBookmarkToggleView(APIView):
    """
    POST /api/bookmarks/vendors/toggle/
    Body: { vendor_id: int }
    • If bookmark does NOT exist → creates it, returns bookmarked=true
    • If bookmark already EXISTS → deletes it, returns bookmarked=false
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VendorBookmarkToggleBodySerializer

    @extend_schema(
        request=VendorBookmarkToggleBodySerializer,
        responses=VendorBookmarkToggleResponseSerializer,
        description="Toggle a vendor bookmark on or off",
    )
    def post(self, request):
        body_serializer = VendorBookmarkToggleBodySerializer(data=request.data)
        if not body_serializer.is_valid():
            return Response(body_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        vendor_id = body_serializer.validated_data["vendor_id"]

        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookmark, created = VendorBookmark.objects.get_or_create(
            user=request.user, vendor=vendor
        )

        if not created:
            bookmark.delete()
            response_serializer = VendorBookmarkToggleResponseSerializer({
                "bookmarked": False,
                "message": "Vendor bookmark removed",
                "bookmark_id": None,
            })
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        response_serializer = VendorBookmarkToggleResponseSerializer({
            "bookmarked": True,
            "message": "Vendor bookmarked",
            "bookmark_id": bookmark.id,
        })
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class VendorBookmarkStatusView(APIView):
    """
    GET /api/bookmarks/vendors/status/?vendor_id=<int>
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VendorBookmarkStatusResponseSerializer

    @extend_schema(
        responses=VendorBookmarkStatusResponseSerializer,
        description="Check if a vendor is bookmarked by the authenticated user",
    )
    def get(self, request):
        vendor_id = request.query_params.get("vendor_id")

        if not vendor_id:
            return Response(
                {"error": "vendor_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bookmark = VendorBookmark.objects.get(user=request.user, vendor_id=vendor_id)
            response_serializer = VendorBookmarkStatusResponseSerializer({
                "bookmarked": True,
                "bookmark_id": bookmark.id,
            })
        except VendorBookmark.DoesNotExist:
            response_serializer = VendorBookmarkStatusResponseSerializer({
                "bookmarked": False,
                "bookmark_id": None,
            })

        return Response(response_serializer.data, status=status.HTTP_200_OK)


class VendorBookmarkRemoveView(APIView):
    """
    DELETE /api/bookmarks/vendors/<bookmark_id>/remove/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = VendorBookmarkSerializer

    @extend_schema(
        responses={200: VendorBookmarkToggleResponseSerializer},
        description="Remove a specific vendor bookmark by its ID",
    )
    def delete(self, request, bookmark_id):
        try:
            bookmark = VendorBookmark.objects.get(id=bookmark_id, user=request.user)
        except VendorBookmark.DoesNotExist:
            return Response(
                {"error": "Vendor bookmark not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        bookmark.delete()
        return Response(
            {"message": "Vendor bookmark removed successfully"},
            status=status.HTTP_200_OK,
        )