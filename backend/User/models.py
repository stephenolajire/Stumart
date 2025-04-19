# model for user app

from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from cloudinary.models import CloudinaryField
import random
from datetime import timedelta
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('username', email)  # Set username to email
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('vendor', 'Vendor'),
        ('picker', 'Picker'),
        ('student_picker', 'Student Picker'),
    )

    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    profile_pic = CloudinaryField('profile_pics/', null=True, blank=True)
    state = models.CharField(max_length=50)
    first_name = models.CharField(max_length=200)
    last_name = models.CharField(max_length=200)
    institution = models.CharField(max_length=100)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Empty list means only email and password required for superuser
    
    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if self.is_superuser:
            # Set default values for superuser
            self.user_type = 'student'  # Set a default user type
            self.phone_number = '00000000000'  # Set a default phone number
            self.state = 'Default'
            self.institution = 'Default'
        super().save(*args, **kwargs)

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    matric_number = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100)
    # level = models.CharField(max_length=20)

    def __str__(self):
        return f"Student: {self.user.email}"

class Vendor(models.Model):
    BUSINESS_CATEGORIES = [
        ('food', 'Food'),
        ('fashion', 'Fashion'),
        ('technology', 'Technology'),
        ('accessories', 'Accessories'),
        ('home', 'Home'),
        ('books', 'Books'),
        ('electronics', 'Electronics'),
        ('others', 'Others'),
    ]

    OTHER_BUSINESS_CATEGORIES = [
        ('laundry', 'Laundry Services'),
        ('note_writing', 'Note Writing'),
        ('assignment_help', 'Assignment Help'),
        ('barbing', 'Barbing Services'),
        ('hair_styling', 'Hair Styling'),
        ('printing', 'Printing Services'),
        ('computer_repairs', 'Computer Repairs'),
        ('phone_repairs', 'Phone Repairs'),
        ('tutoring', 'Tutoring'),
        ('photography', 'Photography'),
        ('graphic_design', 'Graphic Design'),
        ('tailoring', 'Tailoring'),
        ('cleaning', 'Cleaning Services'),
        ('event_planning', 'Event Planning'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    business_name = models.CharField(max_length=100)
    business_category = models.CharField(max_length=20, choices=BUSINESS_CATEGORIES)
    specific_category = models.CharField(max_length=30, choices=OTHER_BUSINESS_CATEGORIES, blank=True, null=True)
    shop_image = CloudinaryField('shop_images/', null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    total_ratings = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=100)
    # Add to your vendor model
    paystack_recipient_code = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Vendor: {self.business_name}"

class Picker(models.Model):
    FLEET_CHOICES = [
        ('bike', 'Bike'),
        ('bicycle', 'Bicycle'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='picker_profile')
    fleet_type = models.CharField(max_length=10, choices=FLEET_CHOICES)
    is_available = models.BooleanField(default=True)
    total_deliveries = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=100)

    def __str__(self):
        return f"Picker: {self.user.email}"

class StudentPicker(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_picker_profile')
    hostel_name = models.CharField(max_length=100)
    room_number = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True)
    total_deliveries = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=100)

    def __str__(self):
        return f"Student Picker: {self.user.email}"

class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"OTP for {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

class KYCVerification(models.Model):
    ID_TYPE_CHOICES = (
        ('student_id', 'Student ID Card'),
        ('national_id', 'National ID Card'),
        ('drivers_license', "Driver's License"),
        ('voters_card', "Voter's Card"),
        ('passport', 'International Passport'),
    )

    VERIFICATION_STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('none', 'None'),
    )

    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='kyc'
    )
    
    selfie_image = CloudinaryField(
        folder='selfie_images',
        resource_type='image',
        verbose_name=_("Selfie Image")
    )
    
    id_type = models.CharField(
        max_length=20,
        choices=ID_TYPE_CHOICES,
        verbose_name=_("ID Type")
    )
    
    id_image = CloudinaryField(
        folder='id_images',
        resource_type='image',
        verbose_name=_("ID Image")
    )
    
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS,
        default='none',
        verbose_name=_("Verification Status")
    )
    
    submission_date = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Submission Date")
    )
    
    verification_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Verification Date")
    )
    
    rejection_reason = models.TextField(
        null=True,
        blank=True,
        verbose_name=_("Rejection Reason")
    )

    class Meta:
        verbose_name = _("KYC Verification")
        verbose_name_plural = _("KYC Verifications")
        ordering = ['-submission_date']

    def __str__(self):
        return f"KYC for {self.user.email} - {self.verification_status}"

    def save(self, *args, **kwargs):
        if self.verification_status == 'approved' and not self.verification_date:
            self.verification_date = timezone.now()
            self.user.is_verified = True
            self.user.save()
        super().save(*args, **kwargs)