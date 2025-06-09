from django.contrib import admin
from .models import *

class ProductImageInline(admin.TabularInline):
    """Inline admin for additional product images."""
    model = ProductImage
    extra = 1

class ProductSizeInline(admin.TabularInline):
    """Inline admin for product sizes."""
    model = ProductSize
    extra = 1

class ProductColorInline(admin.TabularInline):
    """Inline admin for product colors."""
    model = ProductColor
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin panel configuration for Product."""
    list_display = ('name', 'vendor', 'price', 'in_stock', 'created_at')
    search_fields = ('name', 'vendor__email', 'vendor__username')  # Adjust based on User model fields
    list_filter = ('gender', 'vendor')
    inlines = [ProductImageInline, ProductSizeInline, ProductColorInline]

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin panel configuration for ProductImage."""
    list_display = ('product', 'image')

@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    """Admin panel configuration for ProductSize."""
    list_display = ('product', 'size', 'quantity')

@admin.register(ProductColor)
class ProductColorAdmin(admin.ModelAdmin):
    """Admin panel configuration for ProductColor."""
    list_display = ('product', 'color', 'quantity')


# Inline for CartItem
class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0  # Number of empty forms to display

# Cart admin with inline CartItems
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('cart_code', 'created_at')
    inlines = [CartItemInline]

# Optional: if you want to manage CartItems separately too
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'color', 'size')


from django.contrib import admin
from .models import Order, OrderItem, Transaction, Wallet

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'first_name', 'last_name', 'email', 'total', 'order_status', 'created_at', 'confirm', 'picker', 'packed']
    list_filter = ['order_status', 'created_at']
    search_fields = ['order_number', 'email', 'first_name', 'last_name']
    readonly_fields = ['order_number', 'created_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'vendor', 'quantity', 'price', 'size', 'color']
    list_filter = ['vendor', 'product']
    search_fields = ['order__order_number', 'product__name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'order', 'amount', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method']
    search_fields = ['transaction_id', 'order__order_number']
    readonly_fields = ['transaction_id', 'created_at']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'balance']
    search_fields = ['vendor__name']
    
@admin.register(ServiceApplication)
class ServiceApplicationAdmin(admin.ModelAdmin):
    list_display = ('service', 'name', 'email', 'phone', 'preferred_date', 'status', 'created_at')
    list_filter = ('status', 'preferred_date', 'created_at')
    search_fields = ('name', 'email', 'phone', 'service__business_name')
    readonly_fields = ('created_at', 'updated_at', 'response_date', 'completion_date')
    ordering = ('-created_at',)

    fieldsets = (
        ("Applicant Info", {
            'fields': ('user', 'name', 'email', 'phone')
        }),
        ("Service Details", {
            'fields': ('service', 'description', 'preferred_date', 'additional_details')
        }),
        ("Vendor Response", {
            'fields': ('status', 'vendor_response', 'response_date', 'completion_date')
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(PickerReview)
class PickerReviewAdmin(admin.ModelAdmin):
    list_display = ('picker', 'rating', 'comment', 'created_at')
    search_fields = ('picker__email', 'comment')
    list_filter = ('rating', 'created_at')


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'rating', 'comment', 'created_at')
    search_fields = ('vendor__business_name', 'comment')
    list_filter = ('rating', 'created_at')

admin.site.register(AddProductVideo)
admin.site.register(RegisterVideo)
