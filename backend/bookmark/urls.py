from django.urls import path
from .views import (
    BookmarkListView,
    BookmarkToggleView,
    BookmarkStatusView,
    BookmarkRemoveView,
)

urlpatterns = [
    # GET  → list all user bookmarks
    path("bookmarks/",                          BookmarkListView.as_view(),   name="bookmark-list"),

    # POST → toggle bookmark on / off
    path("bookmarks/toggle/",                   BookmarkToggleView.as_view(), name="bookmark-toggle"),

    # GET  → check bookmark status for a single product (?product_id=)
    path("bookmarks/status/",                   BookmarkStatusView.as_view(), name="bookmark-status"),

    # DELETE → remove a specific bookmark
    path("bookmarks/<int:bookmark_id>/remove/", BookmarkRemoveView.as_view(), name="bookmark-remove"),
]