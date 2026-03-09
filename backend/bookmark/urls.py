from django.urls import path
from .views import (
    BookmarkListView,
    BookmarkToggleView,
    BookmarkStatusView,
    BookmarkRemoveView,
    VendorBookmarkListView,
    VendorBookmarkToggleView,
    VendorBookmarkStatusView,
    VendorBookmarkRemoveView,
)

urlpatterns = [
    # ── Product Bookmarks ──────────────────────────────────────────────────────
    path("bookmarks/", BookmarkListView.as_view(), name="bookmark-list"),
    path("bookmarks/toggle/", BookmarkToggleView.as_view(), name="bookmark-toggle"),
    path("bookmarks/status/", BookmarkStatusView.as_view(), name="bookmark-status"),
    path("bookmarks/<int:bookmark_id>/remove/", BookmarkRemoveView.as_view(), name="bookmark-remove"),

    # ── Vendor Bookmarks ───────────────────────────────────────────────────────
    path("bookmarks/vendors/", VendorBookmarkListView.as_view(), name="vendor-bookmark-list"),
    path("bookmarks/vendors/toggle/", VendorBookmarkToggleView.as_view(), name="vendor-bookmark-toggle"),
    path("bookmarks/vendors/status/", VendorBookmarkStatusView.as_view(), name="vendor-bookmark-status"),
    path("bookmarks/vendors/<int:bookmark_id>/remove/", VendorBookmarkRemoveView.as_view(), name="vendor-bookmark-remove"),
]