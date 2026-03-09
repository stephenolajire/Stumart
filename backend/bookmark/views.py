from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Bookmark
from stumart.models import Product
from .serializers import BookmarkSerializer

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class BookmarkListView(APIView):
    """
    GET  /api/bookmarks/
        Returns all bookmarks for the authenticated user.
        Response: { bookmarks: [...], count: int }
    """
    permission_classes = [IsAuthenticated]

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


class BookmarkToggleView(APIView):
    """
    POST /api/bookmarks/toggle/
        Body: { product_id: int }

        • If bookmark does NOT exist  → creates it, returns bookmarked=true
        • If bookmark already EXISTS  → deletes it, returns bookmarked=false
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
            # Already bookmarked → remove it
            bookmark.delete()
            return Response(
                {
                    "bookmarked":  False,
                    "message":     "Bookmark removed",
                    "bookmark_id": None,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "bookmarked":  True,
                "message":     "Bookmark added",
                "bookmark_id": bookmark.id,
            },
            status=status.HTTP_201_CREATED,
        )


class BookmarkStatusView(APIView):
    """
    GET /api/bookmarks/status/?product_id=<int>
        Lets the frontend check whether a product is already bookmarked
        without fetching the full bookmark list.
        Response: { bookmarked: bool, bookmark_id: int | null }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        product_id = request.query_params.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bookmark = Bookmark.objects.get(
                user=request.user, product_id=product_id
            )
            return Response(
                {"bookmarked": True, "bookmark_id": bookmark.id},
                status=status.HTTP_200_OK,
            )
        except Bookmark.DoesNotExist:
            return Response(
                {"bookmarked": False, "bookmark_id": None},
                status=status.HTTP_200_OK,
            )


class BookmarkRemoveView(APIView):
    """
    DELETE /api/bookmarks/<bookmark_id>/remove/
        Removes a specific bookmark by its ID.
        Only the owner can remove their own bookmark.
    """
    permission_classes = [IsAuthenticated]

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