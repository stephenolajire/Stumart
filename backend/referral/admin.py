from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Referral, PayoutHistory
from .email_utils import send_payout_notification_email


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = [
        'referral_code',
        'full_name',
        'email',
        'current_earnings_display',
        'total_referrals',
        'lifetime_earnings_display',
        'total_paid_out_display',
        'last_payout_display',
        'is_active',
        'created_at'
    ]
    
    list_filter = ['is_active', 'created_at', 'last_payout_date']
    
    search_fields = [
        'referral_code',
        'first_name',
        'last_name',
        'email'
    ]
    
    readonly_fields = [
        'referral_code',
        'total_referrals',
        'total_earnings',
        'lifetime_referrals',
        'lifetime_earnings',
        'total_paid_out',
        'last_payout_amount',
        'last_payout_date',
        'last_reset_date',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Referral Information', {
            'fields': ('referral_code', 'first_name', 'last_name', 'email')
        }),
        ('Current Period Statistics', {
            'fields': ('total_referrals', 'total_earnings', 'last_reset_date')
        }),
        ('Lifetime Statistics', {
            'fields': ('lifetime_referrals', 'lifetime_earnings', 'total_paid_out')
        }),
        ('Last Payout', {
            'fields': ('last_payout_amount', 'last_payout_date'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-total_earnings', '-created_at']
    
    actions = [
        'update_referral_stats',
        'reset_earnings_and_create_payout',
        'send_payout_emails',
        'activate_referrals',
        'deactivate_referrals'
    ]
    
    def full_name(self, obj):
        """Display full name"""
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Name'
    
    def current_earnings_display(self, obj):
        """Display current earnings with color coding"""
        amount = obj.total_earnings
        if amount > 0:
            return format_html(
                '<strong style="color: green;">₦{:,.2f}</strong>',
                amount
            )
        return format_html('<span style="color: gray;">₦0.00</span>')
    current_earnings_display.short_description = 'Current Earnings'
    current_earnings_display.admin_order_field = 'total_earnings'
    
    def lifetime_earnings_display(self, obj):
        """Display lifetime earnings"""
        return format_html('₦{:,.2f}', obj.lifetime_earnings)
    lifetime_earnings_display.short_description = 'Lifetime Earnings'
    lifetime_earnings_display.admin_order_field = 'lifetime_earnings'
    
    def total_paid_out_display(self, obj):
        """Display total paid out"""
        return format_html('₦{:,.2f}', obj.total_paid_out)
    total_paid_out_display.short_description = 'Total Paid'
    total_paid_out_display.admin_order_field = 'total_paid_out'
    
    def last_payout_display(self, obj):
        """Display last payout date and amount"""
        if obj.last_payout_date and obj.last_payout_amount:
            return format_html(
                '₦{:,.2f}<br><small>{}</small>',
                obj.last_payout_amount,
                obj.last_payout_date.strftime('%b %d, %Y')
            )
        return '-'
    last_payout_display.short_description = 'Last Payout'
    
    def update_referral_stats(self, request, queryset):
        """Admin action to update stats for selected referrals"""
        updated_count = 0
        for referral in queryset:
            referral.update_stats()
            updated_count += 1
        
        self.message_user(request, f'Successfully updated stats for {updated_count} referral(s).')
    update_referral_stats.short_description = "Update statistics for selected referrals"
    
    def reset_earnings_and_create_payout(self, request, queryset):
        """Admin action to reset earnings and create payout records"""
        from django.db import transaction
        
        reset_count = 0
        total_amount = 0
        
        for referral in queryset:
            # Update stats first
            referral.update_stats()
            
            if referral.total_earnings > 0:
                payout_amount = referral.total_earnings
                referral_count = referral.total_referrals
                period_end = timezone.now()
                period_start = referral.last_reset_date if referral.last_reset_date else referral.created_at
                
                with transaction.atomic():
                    # Reset earnings
                    referral.reset_earnings()
                    
                    # Create payout history
                    PayoutHistory.objects.create(
                        referral=referral,
                        amount=payout_amount,
                        referral_count=referral_count,
                        period_start=period_start,
                        period_end=period_end
                    )
                
                reset_count += 1
                total_amount += payout_amount
        
        self.message_user(
            request,
            f'Successfully processed {reset_count} payout(s) totaling ₦{total_amount:,.2f}'
        )
    reset_earnings_and_create_payout.short_description = "Reset earnings and create payout (₦ → 0)"
    
    def send_payout_emails(self, request, queryset):
        """Admin action to send payout emails to selected referrals"""
        sent_count = 0
        failed_count = 0
        
        for referral in queryset:
            # Get the most recent payout
            latest_payout = PayoutHistory.objects.filter(referral=referral).first()
            
            if latest_payout and not latest_payout.email_sent:
                success = send_payout_notification_email(
                    referral,
                    latest_payout.amount,
                    latest_payout.period_start,
                    latest_payout.period_end
                )
                
                if success:
                    latest_payout.email_sent = True
                    latest_payout.email_sent_at = timezone.now()
                    latest_payout.save()
                    sent_count += 1
                else:
                    failed_count += 1
        
        if sent_count > 0:
            self.message_user(request, f'Successfully sent {sent_count} payout email(s).')
        if failed_count > 0:
            self.message_user(request, f'Failed to send {failed_count} email(s).', level='warning')
    send_payout_emails.short_description = "Send payout notification emails"
    
    def activate_referrals(self, request, queryset):
        """Admin action to activate referrals"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Successfully activated {updated} referral(s).')
    activate_referrals.short_description = "Activate selected referrals"
    
    def deactivate_referrals(self, request, queryset):
        """Admin action to deactivate referrals"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Successfully deactivated {updated} referral(s).')
    deactivate_referrals.short_description = "Deactivate selected referrals"


@admin.register(PayoutHistory)
class PayoutHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'payout_date',
        'referral_code_display',
        'referral_name',
        'amount_display',
        'referral_count',
        'period_display',
        'email_status'
    ]
    
    list_filter = ['email_sent', 'payout_date']
    
    search_fields = [
        'referral__referral_code',
        'referral__first_name',
        'referral__last_name',
        'referral__email'
    ]
    
    readonly_fields = [
        'referral',
        'amount',
        'referral_count',
        'payout_date',
        'period_start',
        'period_end',
        'email_sent',
        'email_sent_at'
    ]
    
    fieldsets = (
        ('Payout Information', {
            'fields': ('referral', 'amount', 'referral_count')
        }),
        ('Period', {
            'fields': ('period_start', 'period_end', 'payout_date')
        }),
        ('Email Status', {
            'fields': ('email_sent', 'email_sent_at')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    ordering = ['-payout_date']
    
    def referral_code_display(self, obj):
        """Display referral code"""
        return obj.referral.referral_code
    referral_code_display.short_description = 'Referral Code'
    
    def referral_name(self, obj):
        """Display referral name"""
        return f"{obj.referral.first_name} {obj.referral.last_name}"
    referral_name.short_description = 'Name'
    
    def amount_display(self, obj):
        """Display amount with formatting"""
        return format_html('<strong>₦{:,.2f}</strong>', obj.amount)
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def period_display(self, obj):
        """Display period dates"""
        return format_html(
            '{} - {}',
            obj.period_start.strftime('%b %d'),
            obj.period_end.strftime('%b %d, %Y')
        )
    period_display.short_description = 'Period'
    
    def email_status(self, obj):
        """Display email status with icon"""
        if obj.email_sent:
            return format_html(
                '<span style="color: green;">✓ Sent</span><br><small>{}</small>',
                obj.email_sent_at.strftime('%b %d, %Y %H:%M') if obj.email_sent_at else ''
            )
        return format_html('<span style="color: orange;">✗ Not Sent</span>')
    email_status.short_description = 'Email Status'
    
    def has_add_permission(self, request):
        """Disable manual addition"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion only for superusers"""
        return request.user.is_superuser