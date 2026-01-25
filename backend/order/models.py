# models.py
from django.db import models

class School(models.Model):
    name = models.CharField(max_length=255, unique=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schools'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Vendor(models.Model):
    school = models.ForeignKey(
        School, 
        on_delete=models.CASCADE, 
        related_name='vendors'
    )
    business_name = models.CharField(max_length=255)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendors'
        ordering = ['business_name']
        unique_together = ['school', 'business_name']
    
    def __str__(self):
        return f"{self.business_name} - {self.school.name}"