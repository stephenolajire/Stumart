# admin.py

from django.contrib import admin
from .models import (
    VendorStats, VendorRevenueData, VendorSalesData,
    Withdrawal
)


@admin.register(VendorStats)
class VendorStatsAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'total_sales', 'total_orders', 'total_products', 'low_stock_products', 'pending_reviews', 'last_updated')
    search_fields = ('vendor__business_name',)


@admin.register(VendorRevenueData)
class VendorRevenueDataAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'month', 'year', 'value')
    search_fields = ('vendor__business_name', 'month', 'year')
    list_filter = ('year', 'month')


@admin.register(VendorSalesData)
class VendorSalesDataAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'month', 'year', 'value')
    search_fields = ('vendor__business_name', 'month', 'year')
    list_filter = ('year', 'month')


# @admin.register(ProductReview)
# class ProductReviewAdmin(admin.ModelAdmin):
#     list_display = ('product', 'user', 'rating', 'created_at', 'vendor_response')
#     search_fields = ('product__name', 'user__email')
#     list_filter = ('rating', 'created_at')


@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'amount', 'reference', 'status', 'created_at', 'updated_at')
    search_fields = ('vendor__business_name', 'reference', 'payment_reference')
    list_filter = ('status', 'created_at')
