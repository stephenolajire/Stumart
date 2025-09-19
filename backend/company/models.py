# models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator

class CoverageArea(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'coverage_areas'
        ordering = ['name']

    def __str__(self):
        return self.name


class Rider(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
        ('inactive', 'Inactive'),
    ]

    # user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rider_profile')
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(validators=[phone_regex], max_length=17, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    coverage_areas = models.ManyToManyField(CoverageArea, related_name='riders')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    completed_deliveries = models.IntegerField(default=0)
    earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    last_active = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'riders'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.email}"

    @property
    def total_areas(self):
        return self.coverage_areas.count()


class RiderDocument(models.Model):
    DOCUMENT_TYPES = [
        ('license', 'Driver License'),
        ('id_card', 'National ID'),
        ('vehicle_reg', 'Vehicle Registration'),
        ('insurance', 'Insurance Certificate'),
    ]

    rider = models.ForeignKey(Rider, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=100)
    document_file = models.FileField(upload_to='rider_documents/')
    is_verified = models.BooleanField(default=False)
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rider_documents'
        unique_together = ['rider', 'document_type']

    def __str__(self):
        return f"{self.rider.name} - {self.get_document_type_display()}"