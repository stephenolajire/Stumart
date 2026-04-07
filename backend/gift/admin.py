from django.contrib import admin
from .models import GiftItem, SpinResult


@admin.register(GiftItem)
class GiftItemAdmin(admin.ModelAdmin):
    list_display  = ("name", "in_stock", "weight", "is_active", "created_at")
    list_filter   = ("is_active",)
    search_fields = ("name", "description")
    list_editable = ("in_stock", "weight", "is_active")
    ordering      = ("-weight", "name")
    readonly_fields = ("price",)  # Price is always 0 for gift items


@admin.register(SpinResult)
class SpinResultAdmin(admin.ModelAdmin):
    list_display  = ("user", "item_name", "status", "spun_at")
    list_filter   = ("status",)
    search_fields = ("user__email", "item_name")
    readonly_fields = ("user", "gift_item", "item_name", "status", "spun_at")
    ordering      = ("-spun_at",)

    def has_add_permission(self, request):
        return False  # spin results are machine-generated only