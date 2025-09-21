from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import PickerWalletAccount, StudentPickerWalletAccount, WalletTransactionAccount,StumartWalletAccount, CompanyWallet, VendorWallets, WithdrawalRequest

@admin.register(WalletTransactionAccount)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'amount', 'user', 'order', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('user__email', 'order__order_number')
    readonly_fields = ('created_at',)

@admin.register(StumartWalletAccount)
class StumartWalletAdmin(admin.ModelAdmin):
    list_display = ('balance', 'total_tax_collected', 'total_commission_collected', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'status', 'bank_name', 'created_at')
    list_filter = ('status', 'user_type', 'created_at')
    search_fields = ('user__email', 'paystack_reference')
    readonly_fields = ('created_at', 'processed_at', 'completed_at')

@admin.register(CompanyWallet)
class CompanyWalletAdmin(admin.ModelAdmin):
    list_display = ('company', 'balance', 'updated_at')
    search_fields = ('company__user__email',)
    readonly_fields = ('created_at', 'updated_at')
    
@admin.register(VendorWallets)
class VendorWalletAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'balance', 'updated_at')
    search_fields = ('vendor__user__email',)
    readonly_fields = ('created_at', 'updated_at')

@admin.register(StudentPickerWalletAccount)
class StudentPickerWalletAdmin(admin.ModelAdmin):
    list_display = ('student_picker', 'amount', 'updated_at')
    search_fields = ('student_picker__user__email',)
    readonly_fields = ('created_at', 'updated_at')
    
@admin.register(PickerWalletAccount)
class PickerWalletAdmin(admin.ModelAdmin):
    list_display = ('picker', 'amount', 'updated_at')
    search_fields = ('picker__user__email',)
    readonly_fields = ('created_at', 'updated_at')
