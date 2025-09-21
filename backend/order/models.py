from django.db import models
from django.utils import timezone
from User.models import *
from Stumart.models import *
from decimal import Decimal
from payment.models import WithdrawalRequest

# Create your models here.

class DeliveryOpportunity(models.Model):
    PICKER_TYPE_CHOICES = [
        ('company_rider', 'Company Rider'),
        ('regular_picker', 'Regular Picker'),
        ('student_picker', 'Student Picker'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='delivery_opportunities')
    unique_code = models.CharField(max_length=20, unique=True, db_index=True)
    picker_type = models.CharField(max_length=20, choices=PICKER_TYPE_CHOICES)
    delivery_confirmation_code = models.CharField(max_length=100, blank=True, null=True, unique=True)
    customer_confirmation_code = models.CharField(max_length=100, blank=True, null=True, unique=True)

    # For company riders (they don't have User accounts)
    company_rider = models.ForeignKey(CompanyRider, null=True, blank=True, on_delete=models.CASCADE, related_name='delivery_opportunities')
    
    # For regular/student pickers (they have User accounts)
    user_picker = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='delivery_opportunities')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    # Additional details when accepted
    accepted_rider_name = models.CharField(max_length=150, blank=True)
    accepted_rider_phone = models.CharField(max_length=20, blank=True)
    pickup_time = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['unique_code']),
            models.Index(fields=['status', 'expires_at']),
        ]
    
    def __str__(self):
        return f"Opportunity {self.unique_code} - Order {self.order.order_number} ({self.status})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def can_be_accepted(self):
        return self.status == 'pending' and not self.is_expired()
    


# Additional wallet models (if they don't exist)
class StuMartWallet(models.Model):
    """Main platform wallet that receives tax and commissions"""
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_tax_collected = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_commission_collected = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "StuMart Platform Wallet"
        verbose_name_plural = "StuMart Platform Wallets"
    
    def __str__(self):
        return f"StuMart Platform Wallet: ₦{self.balance}"
    
    @classmethod
    def get_instance(cls):
        """Get or create the single platform wallet instance"""
        wallet, created = cls.objects.get_or_create(pk=1)
        return wallet
    
    def add_tax(self, amount):
        """Add tax amount to the wallet"""
        amount = Decimal(str(amount))
        self.balance += amount
        self.total_tax_collected += amount
        self.save()
    
    def add_commission(self, amount):
        """Add commission amount to the wallet"""
        amount = Decimal(str(amount))
        self.balance += amount
        self.total_commission_collected += amount
        self.save()
    
class CompanyWallet(models.Model):
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Company Wallet - {self.company.user.email}: ₦{self.balance}"
    
class VendorWallets(models.Model):
    vendor = models.OneToOneField(Vendor, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Vendor Wallet - {self.vendor.business_name}: ₦{self.balance}"

class StudentPickerWallet(models.Model):
    student_picker = models.OneToOneField(StudentPicker, on_delete=models.CASCADE, related_name='wallet')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Student Picker Wallet - {self.student_picker.user.email}: ₦{self.amount}"
    
class PickerWallet(models.Model):
    picker = models.OneToOneField(Picker, on_delete=models.CASCADE, related_name='wallet')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Student Picker Wallet - {self.student_picker.user.email}: ₦{self.amount}"

# Transaction history model for better tracking
class WalletTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('tax', 'Tax Collection'),
        ('commission', 'Commission Collection'),
        ('delivery_payment', 'Delivery Payment'),
        ('vendor_payment', 'Vendor Payment'),
        ('company_earnings', 'Company Earnings'),
        ('rider_earnings', 'Rider Earnings'),
        ('withdrawal', 'Withdrawal'),
        ('refund', 'Refund'),
    ]
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.CASCADE, related_name='wallet_transactions')
    withdrawal_request = models.ForeignKey(WithdrawalRequest, null=True, blank=True, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - ₦{self.amount} - {self.user.email}"
