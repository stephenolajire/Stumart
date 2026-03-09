from django.contrib import admin
from .models import Contact

# Register your models here.

class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_read')
    search_fields = ('name', 'email', 'subject')
    list_filter = ('is_read', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
admin.site.register(Contact, ContactAdmin)
