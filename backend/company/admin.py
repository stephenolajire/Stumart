from django.contrib import admin

from User.models import CompanyRider

@admin.register(CompanyRider)
class CompanyRiderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "name", "email", "phone", "status",
        "location", "rating", "completed_deliveries",
        "join_date", "last_active", "total_earnings"
    )
    list_filter = ("status", "location", "join_date")
    search_fields = ("name", "email", "phone")
