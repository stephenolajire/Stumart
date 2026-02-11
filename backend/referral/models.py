from django.db import models
from django.conf import settings  # ✅ Changed: Use settings instead of importing User directly
from django.utils import timezone
import string
import random


class Referral(models.Model):
    """
    Model to store referral information for users
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # ✅ Changed: Use settings.AUTH_USER_MODEL instead of User
        on_delete=models.CASCADE, 
        related_name='referral',
        null=True,
        blank=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    referral_code = models.CharField(max_length=10, unique=True, db_index=True)
    
    # Current period stats
    total_referrals = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Lifetime stats
    lifetime_referrals = models.PositiveIntegerField(default=0)
    lifetime_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_paid_out = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Payout tracking
    last_payout_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    last_payout_date = models.DateTimeField(null=True, blank=True)
    last_reset_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['referral_code'], name='ref_code_idx'),
            models.Index(fields=['email'], name='ref_email_idx'),
            models.Index(fields=['-created_at'], name='ref_created_idx'),
            models.Index(fields=['-last_payout_date'], name='ref_payout_date_idx'),
        ]
        verbose_name = 'Referral'
        verbose_name_plural = 'Referrals'

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.referral_code}"

    @staticmethod
    def generate_referral_code(length=8):
        """
        Generate a unique referral code
        """
        characters = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(random.choices(characters, k=length))
            if not Referral.objects.filter(referral_code=code).exists():
                return code

    def save(self, *args, **kwargs):
        """
        Override save to auto-generate referral code if not provided
        """
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        super().save(*args, **kwargs)

    def update_stats(self):
        """
        Update total referrals and earnings based on completed orders
        This should be called after an order status changes to COMPLETED/DELIVERED
        """
        from django.db.models import Count, Q
        from Stumart.models import Order  # Adjust import based on your app name
        
        # Get date range for current period (since last reset or beginning)
        start_date = self.last_reset_date if self.last_reset_date else self.created_at
        
        # Count completed orders in current period
        current_period_orders = Order.objects.filter(
            referral_code=self.referral_code,
            order_status__in=['COMPLETED', 'DELIVERED'],
            created_at__gte=start_date
        ).count()
        
        # Count all lifetime completed orders
        lifetime_orders = Order.objects.filter(
            referral_code=self.referral_code,
            order_status__in=['COMPLETED', 'DELIVERED']
        ).count()
        
        # Update current period stats
        self.total_referrals = current_period_orders
        self.total_earnings = current_period_orders * 200  # 200 per referral
        
        # Update lifetime stats
        self.lifetime_referrals = lifetime_orders
        self.lifetime_earnings = lifetime_orders * 200
        
        self.save(update_fields=[
            'total_referrals', 
            'total_earnings',
            'lifetime_referrals',
            'lifetime_earnings'
        ])

        return {
            'total_referrals': self.total_referrals,
            'total_earnings': float(self.total_earnings),
            'lifetime_referrals': self.lifetime_referrals,
            'lifetime_earnings': float(self.lifetime_earnings)
        }

    def reset_earnings(self):
        """
        Reset current period earnings to zero and record payout
        This is called when payout is processed
        """
        # Store the amount being paid out
        self.last_payout_amount = self.total_earnings
        self.last_payout_date = timezone.now()
        self.last_reset_date = timezone.now()
        
        # Add to total paid out
        self.total_paid_out += self.total_earnings
        
        # Reset current period earnings
        self.total_referrals = 0
        self.total_earnings = 0
        
        self.save(update_fields=[
            'total_referrals',
            'total_earnings',
            'last_payout_amount',
            'last_payout_date',
            'last_reset_date',
            'total_paid_out'
        ])
        
        return {
            'payout_amount': float(self.last_payout_amount),
            'payout_date': self.last_payout_date,
            'total_paid_out': float(self.total_paid_out)
        }

    def get_referral_orders(self, status=None, start_date=None):
        """
        Get all orders that used this referral code
        """
        from Stumart.models import Order  # Adjust import based on your app name
        
        orders = Order.objects.filter(referral_code=self.referral_code)
        
        if status:
            orders = orders.filter(order_status=status)
        
        if start_date:
            orders = orders.filter(created_at__gte=start_date)
        
        return orders.order_by('-created_at')

    def get_current_period_orders(self):
        """
        Get orders from current period (since last reset)
        """
        start_date = self.last_reset_date if self.last_reset_date else self.created_at
        return self.get_referral_orders(
            status=None,
            start_date=start_date
        )

    def get_stats(self):
        """
        Get comprehensive statistics for this referral
        """
        from Stumart.models import Order  # Adjust import based on your app name
        
        # Current period stats
        start_date = self.last_reset_date if self.last_reset_date else self.created_at
        current_period_orders = Order.objects.filter(
            referral_code=self.referral_code,
            created_at__gte=start_date
        )
        
        # All time stats
        all_orders = Order.objects.filter(referral_code=self.referral_code)
        
        stats = {
            # Current period
            'total_orders': current_period_orders.count(),
            'completed_orders': current_period_orders.filter(
                order_status__in=['COMPLETED', 'DELIVERED']
            ).count(),
            'pending_orders': current_period_orders.filter(
                order_status='PENDING'
            ).count(),
            'total_earnings': float(self.total_earnings),
            'potential_earnings': current_period_orders.count() * 200,
            
            # Lifetime stats
            'lifetime_referrals': self.lifetime_referrals,
            'lifetime_earnings': float(self.lifetime_earnings),
            'total_paid_out': float(self.total_paid_out),
            
            # Payout info
            'last_payout_amount': float(self.last_payout_amount) if self.last_payout_amount else 0,
            'last_payout_date': self.last_payout_date,
            'last_reset_date': self.last_reset_date,
        }
        
        return stats


class PayoutHistory(models.Model):
    """
    Track payout history for each referral
    """
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name='payout_history'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    referral_count = models.PositiveIntegerField()  # Number of referrals in this payout
    payout_date = models.DateTimeField(auto_now_add=True)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-payout_date']
        verbose_name = 'Payout History'
        verbose_name_plural = 'Payout Histories'
        indexes = [
            models.Index(fields=['referral', '-payout_date'], name='payout_ref_date_idx'),
            models.Index(fields=['-payout_date'], name='payout_date_idx'),
        ]
    
    def __str__(self):
        return f"{self.referral.referral_code} - ₦{self.amount} ({self.payout_date.strftime('%Y-%m-%d')})"