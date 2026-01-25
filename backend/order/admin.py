# admin.py
from django.contrib import admin
from .models import School, Vendor


class VendorInline(admin.TabularInline):
    model = Vendor
    extra = 1  # Number of empty forms to display
    fields = ['business_name', 'delivery_fee', 'contact_email', 'contact_phone', 'is_active']
    readonly_fields = []
    
    ordering = ['business_name']


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'vendor_count', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'location', 'address']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('School Information', {
            'fields': ('name', 'location', 'address')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [VendorInline]
    
    def vendor_count(self, obj):
        return obj.vendors.count()
    vendor_count.short_description = 'Number of Vendors'


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'school', 'delivery_fee', 'is_active', 'created_at']
    list_filter = ['is_active', 'school', 'created_at']
    search_fields = ['business_name', 'school__name', 'contact_email', 'contact_phone']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['is_active']  # Allow quick editing of is_active from list view
    
    fieldsets = (
        ('Vendor Information', {
            'fields': ('school', 'business_name', 'delivery_fee')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Optional: Add custom actions
    actions = ['activate_vendors', 'deactivate_vendors']
    
    def activate_vendors(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} vendor(s) activated successfully.')
    activate_vendors.short_description = "Activate selected vendors"
    
    def deactivate_vendors(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} vendor(s) deactivated successfully.')
    deactivate_vendors.short_description = "Deactivate selected vendors"