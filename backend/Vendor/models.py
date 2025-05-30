from django.db import models
from django.db.models import Sum, Count
from User.models import Vendor, User
from Stumart.models import Product, Order, OrderItem, Transaction, Wallet

class VendorStats(models.Model):
    """Model to cache vendor dashboard statistics"""
    vendor = models.OneToOneField(Vendor, on_delete=models.CASCADE, related_name="dashboard_stats")
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders = models.PositiveIntegerField(default=0)
    total_products = models.PositiveIntegerField(default=0)
    low_stock_products = models.PositiveIntegerField(default=0)
    pending_reviews = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Stats for {self.vendor.business_name}"


class VendorRevenueData(models.Model):
    """Model to store monthly revenue data for charts"""
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="revenue_data")
    month = models.CharField(max_length=20)  # e.g. "Jan", "Feb"
    year = models.PositiveIntegerField()
    value = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ('vendor', 'month', 'year')

    def __str__(self):
        return f"{self.vendor.business_name} - {self.month} {self.year}: ${self.value}"


class VendorSalesData(models.Model):
    """Model to store monthly sales count data for charts"""
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="sales_data")
    month = models.CharField(max_length=20)
    year = models.PositiveIntegerField()
    value = models.PositiveIntegerField()

    class Meta:
        unique_together = ('vendor', 'month', 'year')

    def __str__(self):
        return f"{self.vendor.business_name} - {self.month} {self.year}: {self.value} orders"


# class ProductReview(models.Model):
#     """Model for product reviews"""
#     RATING_CHOICES = [(i, i) for i in range(1, 6)]  # 1-5 stars
    
#     product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
#     comment = models.TextField()
#     created_at = models.DateTimeField(auto_now_add=True)
#     vendor_response = models.TextField(null=True, blank=True)
#     response_date = models.DateTimeField(null=True, blank=True)

#     def __str__(self):
#         return f"Review for {self.product.name} by {self.user.email}"
    

class Withdrawal(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=50, unique=True)
    payment_reference = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.reference} - {self.amount}"