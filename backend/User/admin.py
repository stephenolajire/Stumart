from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import User, Student, Vendor, Picker, StudentPicker, KYCVerification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'user_type', 
                   'institution', 'state', 'is_active', 'is_verified', 'date_joined')
    list_filter = ('user_type', 'is_active', 'is_verified', 'state', 'institution')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    readonly_fields = ('date_joined',)
    fieldsets = (
        ('Personal Info', {
            'fields': ('email', 'first_name', 'last_name', 'phone_number', 'profile_pic')
        }),
        ('Account Details', {
            'fields': ('username', 'password', 'user_type', 'state', 'institution')
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified', 'date_joined')
        }),
        ('Permissions', {
            'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('get_email', 'get_full_name', 'matric_number', 'department')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 
                    'matric_number', 'department')
    list_filter = ('department',)

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'get_email', 'business_category', 
                   'specific_category', 'rating', 'is_verified', 'get_shop_image')
    list_filter = ('business_category', 'specific_category', 'is_verified')
    search_fields = ('business_name', 'user__email', 'user__first_name', 
                    'user__last_name')
    readonly_fields = ('rating', 'total_ratings')

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def get_shop_image(self, obj):
        if obj.shop_image:
            return format_html('<img src="{}" width="50" height="50" />', 
                             obj.shop_image.url)
        return "No Image"
    get_shop_image.short_description = 'Shop Image'

@admin.register(Picker)
class PickerAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_email', 'fleet_type', 'is_available', 
                   'total_deliveries', 'rating')
    list_filter = ('fleet_type', 'is_available')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 
                    'bank_name', 'account_number')
    readonly_fields = ('total_deliveries', 'rating')

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'

@admin.register(StudentPicker)
class StudentPickerAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_email', 'hostel_name', 'room_number', 
                   'is_available', 'total_deliveries', 'rating')
    list_filter = ('hostel_name', 'is_available')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 
                    'hostel_name', 'room_number', 'bank_name', 'account_number')
    readonly_fields = ('total_deliveries', 'rating')

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = 'Email'

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Full Name'

@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'id_type', 'verification_status', 'submission_date', 'verification_date')
    list_filter = ('verification_status', 'id_type', 'submission_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('submission_date',)
    
    def save_model(self, request, obj, form, change):
        if 'verification_status' in form.changed_data:
            if obj.verification_status == 'approved':
                obj.verification_date = timezone.now()
                obj.user.is_verified = True
                obj.user.save()
        super().save_model(request, obj, form, change)
