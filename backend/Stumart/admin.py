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
    list_display = ['order_number', 'user', 'first_name', 'last_name', 'email', 'total', 'order_status', 'created_at']
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
    
# admin.site.register(Order)
# admin.site.register(OrderItem)
# admin.site.register(Transaction)
# admin.site.register(Wallet)

