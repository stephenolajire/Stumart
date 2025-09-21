from django.contrib import admin
from .models import WithdrawalRequest, WithdrawalFee, BankAccount, WithdrawalLimit


# @admin.register(WithdrawalRequest)
# class WithdrawalRequestAdmin(admin.ModelAdmin):
#     list_display = (
#         "id", "user", "user_type", "amount", "final_amount",
#         "status", "bank_name", "account_number",
#         "created_at", "processed_at", "completed_at"
#     )
#     list_filter = ("status", "user_type", "bank_name", "created_at")
#     search_fields = ("user__username", "account_number", "account_name", "paystack_reference")
#     readonly_fields = ("created_at", "processed_at", "completed_at", "updated_at")
#     ordering = ("-created_at",)


@admin.register(WithdrawalFee)
class WithdrawalFeeAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user_type", "fee_type", "percentage_fee", "fixed_fee",
        "minimum_fee", "maximum_fee", "min_amount", "max_amount", "is_active"
    )
    list_filter = ("user_type", "fee_type", "is_active")
    search_fields = ("user_type",)
    ordering = ("user_type", "min_amount")


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user", "bank_name", "bank_code", "account_number",
        "account_name", "is_verified", "is_default", "last_used", "usage_count"
    )
    list_filter = ("bank_name", "is_verified", "is_default")
    search_fields = ("user__username", "account_number", "account_name")
    ordering = ("-is_default", "-last_used")


@admin.register(WithdrawalLimit)
class WithdrawalLimitAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user_type", "limit_type", "min_amount",
        "max_amount", "is_active", "created_at"
    )
    list_filter = ("user_type", "limit_type", "is_active")
    search_fields = ("user_type", "limit_type")
    ordering = ("user_type", "limit_type")
