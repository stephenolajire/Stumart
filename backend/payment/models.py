from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid

User = get_user_model()

class WithdrawalRequest(models.Model):
    """Model to track withdrawal requests"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    USER_TYPE_CHOICES = [
        ('vendor', 'Vendor'),
        ('picker', 'Picker'),
        ('student_picker', 'Student Picker'),
        ('company', 'Company'),
    ]
    
    # Basic fields
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawal_requests')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    
    # Amount fields
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Requested withdrawal amount")
    final_amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Final amount after fees")
    
    # Bank details
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    bank_code = models.CharField(max_length=10, null=True, blank=True)
    account_number = models.CharField(max_length=20, null=True, blank=True)
    account_name = models.CharField(max_length=100, null=True, blank=True)

    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True, null=True)
    
    # Paystack integration fields
    paystack_recipient_code = models.CharField(max_length=100, blank=True, null=True)
    paystack_transfer_code = models.CharField(max_length=100, blank=True, null=True)
    paystack_reference = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields
    notes = models.TextField(blank=True, null=True, help_text="Internal notes")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        db_table = 'withdrawal_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['paystack_reference']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Withdrawal {self.id} - {self.user.username} - ₦{self.amount} - {self.status}"
    
    @property
    def is_pending(self):
        return self.status in ['pending', 'processing']
    
    @property
    def is_completed(self):
        return self.status == 'completed'
    
    @property
    def is_failed(self):
        return self.status in ['failed', 'cancelled']
    
    def save(self, *args, **kwargs):
        # Ensure final_amount is set
        if not self.final_amount:
            self.final_amount = self.amount
        super().save(*args, **kwargs)

class WithdrawalFee(models.Model):
    """Model to configure withdrawal fees"""
    
    FEE_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
        ('tiered', 'Tiered'),
    ]
    
    USER_TYPE_CHOICES = [
        ('vendor', 'Vendor'),
        ('picker', 'Picker'),
        ('student_picker', 'Student Picker'),
        ('company', 'Company'),
        ('all', 'All Users'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='all')
    fee_type = models.CharField(max_length=20, choices=FEE_TYPE_CHOICES, default='percentage')
    
    # Fee configuration
    percentage_fee = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), 
                                       help_text="Percentage fee (e.g., 1.5 for 1.5%)")
    fixed_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'),
                                  help_text="Fixed fee amount")
    minimum_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'),
                                    help_text="Minimum fee amount")
    maximum_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'),
                                    help_text="Maximum fee amount (0 for no limit)")
    
    # Amount ranges for tiered fees
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'),
                                   help_text="Minimum withdrawal amount for this fee")
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'),
                                   help_text="Maximum withdrawal amount for this fee (0 for no limit)")
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'withdrawal_fees'
        ordering = ['user_type', 'min_amount']
    
    def __str__(self):
        return f"Fee for {self.user_type} - {self.fee_type}"
    
    def calculate_fee(self, amount):
        """Calculate fee for given amount"""
        if self.fee_type == 'percentage':
            fee = amount * (self.percentage_fee / Decimal('100'))
        elif self.fee_type == 'fixed':
            fee = self.fixed_fee
        else:  # tiered
            if self.min_amount <= amount <= (self.max_amount or amount):
                fee = amount * (self.percentage_fee / Decimal('100')) + self.fixed_fee
            else:
                return Decimal('0.00')
        
        # Apply minimum and maximum fee limits
        if self.minimum_fee > 0:
            fee = max(fee, self.minimum_fee)
        if self.maximum_fee > 0:
            fee = min(fee, self.maximum_fee)
        
        return fee

class BankAccount(models.Model):
    """Model to store user's saved bank accounts"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_bank_accounts')
    bank_name = models.CharField(max_length=100)
    bank_code = models.CharField(max_length=10)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=100)
    
    # Paystack recipient code for faster withdrawals
    paystack_recipient_code = models.CharField(max_length=100, blank=True, null=True)
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verification_date = models.DateTimeField(blank=True, null=True)
    
    # Usage tracking
    is_default = models.BooleanField(default=False)
    last_used = models.DateTimeField(blank=True, null=True)
    usage_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_bank_accounts'
        unique_together = ['user', 'account_number', 'bank_code']
        ordering = ['-is_default', '-last_used', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.bank_name} - {self.account_number[-4:]}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default account per user
        if self.is_default:
            BankAccount.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

class WithdrawalLimit(models.Model):
    """Model to configure withdrawal limits"""
    
    USER_TYPE_CHOICES = [
        ('vendor', 'Vendor'),
        ('picker', 'Picker'),
        ('student_picker', 'Student Picker'),
        ('company', 'Company'),
        ('all', 'All Users'),
    ]
    
    LIMIT_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('per_transaction', 'Per Transaction'),
    ]
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='all')
    limit_type = models.CharField(max_length=20, choices=LIMIT_TYPE_CHOICES)
    
    # Limit amounts
    min_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('100.00'))
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('500000.00'))
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'withdrawal_limits'
        unique_together = ['user_type', 'limit_type']
    
    def __str__(self):
        return f"{self.user_type} - {self.limit_type} - ₦{self.min_amount}-₦{self.max_amount}"