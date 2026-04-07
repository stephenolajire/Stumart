from django.urls import path
from .views import (
    # user
    WheelItemsView,
    SpinView,
    MySpinHistoryView,
    SpinEligibilityView,
    # admin
    AdminGiftItemListCreateView,
    AdminGiftItemDetailView,
    AdminSpinHistoryView,
)

app_name = "gift"

urlpatterns = [
    # ── user endpoints ─────────────────────────────────────────────────────────
    # GET  — items to render the wheel (no weights exposed)
    path("wheel-items/",  WheelItemsView.as_view(),     name="wheel-items"),

    # POST — perform a spin
    path("spin/",         SpinView.as_view(),            name="spin"),

    # GET  — user's own spin history
    path("my-spins/",     MySpinHistoryView.as_view(),   name="my-spins"),

    # GET  — can_spin flag + next_spin timestamp
    path("can-spin/",     SpinEligibilityView.as_view(), name="can-spin"),

    # ── admin endpoints ────────────────────────────────────────────────────────
    # GET, POST — list + create gift items
    path("admin/items/",        AdminGiftItemListCreateView.as_view(), name="admin-items"),

    # GET, PUT, PATCH, DELETE — single gift item
    path("admin/items/<int:pk>/", AdminGiftItemDetailView.as_view(),  name="admin-item-detail"),

    # GET — all spin history (filterable)
    path("admin/spins/",        AdminSpinHistoryView.as_view(),        name="admin-spins"),
]