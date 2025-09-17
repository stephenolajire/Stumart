from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import *
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError as DjangoValidationError
import re
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.utils.html import strip_tags

# Custom exception classes for specific errors
class PhoneNumberExistsError(ValidationError):
    default_code = 'phone_exists'
    default_detail = 'A user with this phone number already exists.'

class EmailExistsError(ValidationError):
    default_code = 'email_exists'
    default_detail = 'A user with this email already exists.'

class UsernameExistsError(ValidationError):
    default_code = 'username_exists'
    default_detail = 'A user with this username already exists.'

class InvalidPhoneFormatError(ValidationError):
    default_code = 'invalid_phone_format'
    default_detail = 'Phone number must start with 0 and be 11 digits long.'

class InvalidAccountNumberError(ValidationError):
    default_code = 'invalid_account_number'
    default_detail = 'Account number must be exactly 10 digits.'

class InvalidEmailFormatError(ValidationError):
    default_code = 'invalid_email_format'
    default_detail = 'Please enter a valid email address.'

class PasswordTooWeakError(ValidationError):
    default_code = 'password_too_weak'
    default_detail = 'Password must be at least 8 characters and contain uppercase, lowercase, and special characters.'

class ImageTooLargeError(ValidationError):
    default_code = 'image_too_large'
    default_detail = 'Image file size must be less than 5MB.'

class InvalidImageFormatError(ValidationError):
    default_code = 'invalid_image_format'
    default_detail = 'Only JPEG, PNG, and GIF images are allowed.'

class MissingRequiredFieldError(ValidationError):
    default_code = 'missing_required_field'

class InvalidMatricNumberError(ValidationError):
    default_code = 'invalid_matric_number'
    default_detail = 'Matric number already exists or is invalid format.'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password','residence',
                  'first_name', 'last_name', 'phone_number', 'user_type',
                  'profile_pic', 'state', 'institution', 'image_url')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def get_image_url(self, obj):
        if obj.profile_pic:
            return obj.profile_pic.url
        return None

    def validate_email(self, value):
        if not value:
            raise MissingRequiredFieldError("Email is required.")
        
        # Email format validation
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, value):
            raise InvalidEmailFormatError()
        
        # Get the instance being updated (if this is an update operation)
        instance = getattr(self, 'instance', None)
        
        # If this is an update and the email hasn't changed, allow it
        if instance and instance.email == value:
            return value
        
        # Check if another user has this email (excluding current user if updating)
        existing_user_query = User.objects.filter(email__iexact=value)
        if instance:
            existing_user_query = existing_user_query.exclude(id=instance.id)
        
        if existing_user_query.exists():
            raise EmailExistsError()
        
        return value.lower()

    def validate_username(self, value):
        if not value:
            raise MissingRequiredFieldError("Username is required.")
        
        # Get the instance being updated (if this is an update operation)
        instance = getattr(self, 'instance', None)
        
        # If this is an update and the username hasn't changed, allow it
        if instance and instance.username == value:
            return value
        
        # Check if another user has this username (excluding current user if updating)
        existing_user_query = User.objects.filter(username__iexact=value)
        if instance:
            existing_user_query = existing_user_query.exclude(id=instance.id)
        
        if existing_user_query.exists():
            raise UsernameExistsError()
        
        return value.lower()
    
    def validate_residence(self, value):
        if not value:
            raise MissingRequiredFieldError("Residence is required.")
        
        # Get the instance being updated (if this is an update operation)
        instance = getattr(self, 'instance', None)
        
        # If this is an update and the username hasn't changed, allow it
        if instance and instance.residence == value:
            return value

    def validate_phone_number(self, value):
        if not value:
            raise MissingRequiredFieldError("Phone number is required.")
        
        # Remove any spaces or special characters
        cleaned_phone = re.sub(r'[^\d]', '', value)
        
        # Check if phone number is valid Nigerian format
        if not (cleaned_phone.startswith('0') and len(cleaned_phone) == 11):
            raise InvalidPhoneFormatError()
        
        # Additional validation for Nigerian mobile numbers
        if not re.match(r'^0[7-9]\d{9}$', cleaned_phone):
            raise InvalidPhoneFormatError("Phone number must be a valid Nigerian mobile number (07xxxxxxxxx, 08xxxxxxxxx, or 09xxxxxxxxx).")
        
        # Get the instance being updated (if this is an update operation)
        instance = getattr(self, 'instance', None)
        
        # If this is an update and the phone number hasn't changed, allow it
        if instance and instance.phone_number == cleaned_phone:
            return cleaned_phone
        
        # Check if another user has this phone number (excluding current user if updating)
        existing_user_query = User.objects.filter(phone_number=cleaned_phone)
        if instance:
            existing_user_query = existing_user_query.exclude(id=instance.id)
        
        if existing_user_query.exists():
            raise PhoneNumberExistsError()
        
        return cleaned_phone

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("First name is required.")
        
        # Check for valid name format (letters, spaces, hyphens, apostrophes only)
        if not re.match(r"^[a-zA-Z\s'-]+$", value.strip()):
            raise ValidationError("First name can only contain letters, spaces, hyphens, and apostrophes.")
        
        return value.strip().title()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Last name is required.")
        
        # Check for valid name format
        if not re.match(r"^[a-zA-Z\s'-]+$", value.strip()):
            raise ValidationError("Last name can only contain letters, spaces, hyphens, and apostrophes.")
        
        return value.strip().title()

    def validate_password(self, value):
        if not value:
            raise MissingRequiredFieldError("Password is required.")
        
        # Custom password validation
        if len(value) < 8:
            raise PasswordTooWeakError("Password must be at least 8 characters long.")
        
        if not re.search(r'[A-Z]', value):
            raise PasswordTooWeakError("Password must contain at least one uppercase letter.")
        
        if not re.search(r'[a-z]', value):
            raise PasswordTooWeakError("Password must contain at least one lowercase letter.")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise PasswordTooWeakError("Password must contain at least one special character.")
        
        # Use Django's built-in password validators
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise PasswordTooWeakError(' '.join(e.messages))
        
        return value

    def validate_profile_pic(self, value):
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise ImageTooLargeError()
            
            # Check file format
            allowed_formats = ['image/jpeg', 'image/png', 'image/gif']
            if value.content_type not in allowed_formats:
                raise InvalidImageFormatError()
        
        return value

    def validate_state(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("State is required.")
        return value.strip()

    def validate_institution(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Institution is required.")
        return value.strip()

    def create(self, validated_data):
        try:
            with transaction.atomic():
                user = User.objects.create_user(**validated_data)
                return user
        except IntegrityError as e:
            error_message = str(e).lower()
            if 'phone_number' in error_message:
                raise PhoneNumberExistsError()
            elif 'email' in error_message:
                raise EmailExistsError()
            elif 'username' in error_message:
                raise UsernameExistsError()
            raise ValidationError("Failed to create user due to data integrity constraint.")
        except Exception as e:
            raise ValidationError(f"An unexpected error occurred: {str(e)}")

# Base mixin for common user validation logic
class BaseUserProfileMixin:
    """Mixin to handle common user profile validation without duplication"""
    
    def validate_account_number(self, value):
        if not value:
            raise MissingRequiredFieldError("Account number is required.")
        
        cleaned_account = re.sub(r'[^\d]', '', value)
        
        if not cleaned_account.isdigit() or len(cleaned_account) != 10:
            raise InvalidAccountNumberError()
        
        return cleaned_account
    
    def validate_account_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Account name is required.")
        
        if not re.match(r"^[a-zA-Z\s'-]+$", value.strip()):
            raise ValidationError("Account name can only contain letters, spaces, hyphens, and apostrophes.")
        
        return value.strip().title()
    
    def validate_bank_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Bank name is required.")
        return value.strip()
    
    def create_user_and_profile(self, validated_data, model_class):
        """Generic method to create user and associated profile"""
        try:
            with transaction.atomic():
                # Extract user data
                user_data = self._extract_user_data(validated_data)
                
                # Create user first
                user = User.objects.create_user(**user_data)
                
                # Create profile with remaining data
                profile_data = validated_data  # remaining data after extraction
                profile = model_class.objects.create(user=user, **profile_data)
                
                return profile
        except IntegrityError as e:
            error_message = str(e).lower()
            if 'phone_number' in error_message:
                raise PhoneNumberExistsError()
            elif 'email' in error_message:
                raise EmailExistsError()
            elif 'username' in error_message:
                raise UsernameExistsError()
            elif 'matric_number' in error_message:
                raise InvalidMatricNumberError()
            raise ValidationError("Failed to create profile due to data integrity constraint.")
        except Exception as e:
            raise ValidationError(f"An unexpected error occurred: {str(e)}")
    
    def _get_user_fields(self):
        """Get list of user model fields"""
        return {
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'state', 'institution', 'profile_pic'
        }
    
    def _extract_user_data(self, validated_data):
        """Extract user-related data from validated data"""
        user_fields = [
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'state', 'institution', 'profile_pic'
        ]
        
        user_data = {}
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)  # Remove from validated_data
        
        return user_data

class StudentSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    # Flatten user fields - but don't duplicate validation
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=False)
    
    # Include user data in response
    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

    def validate_matric_number(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Matric number is required.")
        
        cleaned_matric = value.strip().upper()
        
        # Check if matric number already exists
        # if Student.objects.filter(matric_number=cleaned_matric).exists():
        #     raise InvalidMatricNumberError("A student with this matric number already exists.")
        
        return cleaned_matric

    def validate_department(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Department is required.")
        return value.strip().title()

    def validate_phone_number(self, value):
        """Use the same validation logic as UserSerializer"""
        user_serializer = UserSerializer()
        return user_serializer.validate_phone_number(value)

    def validate_email(self, value):
        """Validate email uniqueness"""
        user_serializer = UserSerializer()
        return user_serializer.validate_email(value)

    def validate_password(self, value):
        """Validate password strength"""
        user_serializer = UserSerializer()
        return user_serializer.validate_password(value)

    def validate_first_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_first_name(value)

    def validate_last_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_last_name(value)

    def validate_profile_pic(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_profile_pic(value)

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Student)
    

class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ["id", "name"]


class CompanySignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    delivery_areas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True
    )

    class Meta:
        model = User
        fields = [
            "email", "password", "first_name", "last_name", "phone_number",
            "state", "institution", "delivery_areas"
        ]

    def create(self, validated_data):
        delivery_area_names = validated_data.pop("delivery_areas", [])
        
        # Create user
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            state=validated_data.get("state", ""),
            institution=validated_data.get("institution", ""),
            user_type="company"
        )

        # Create related company profile
        company = Company.objects.create(user=user)
        
        # Create or get areas by name and add them to delivery_areas
        area_objects = []
        for area_name in delivery_area_names:
            area, created = Area.objects.get_or_create(name=area_name.strip())
            area_objects.append(area)
        
        company.delivery_areas.set(area_objects)

        return user

class VendorSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    # Flatten user fields
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=False)
    
    # Include user data in response
    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = '__all__'

    def validate_business_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Business name is required.")
        
        # Check if business name already exists for same institution
        institution = self.initial_data.get('institution')
        if institution and Vendor.objects.filter(
            business_name__iexact=value.strip(),
            user__institution=institution
        ).exists():
            raise ValidationError("A business with this name already exists in this institution.")
        
        return value.strip().title()

    def validate_business_category(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Business category is required.")
        return value.strip().lower()

    def validate_specific_category(self, value):
        business_category = self.initial_data.get('business_category', '').lower()
        if business_category == 'others':
            if not value or not value.strip():
                raise MissingRequiredFieldError("Specific category is required when 'Others' is selected.")
        return value.strip() if value else value

    def validate_shop_image(self, value):
        if not value:
            raise MissingRequiredFieldError("Shop image is required.")
        
        # Check file size (5MB limit)
        if value.size > 5 * 1024 * 1024:
            raise ImageTooLargeError()
        
        # Check file format
        allowed_formats = ['image/jpeg', 'image/png', 'image/gif']
        if value.content_type not in allowed_formats:
            raise InvalidImageFormatError()
        
        return value

    def validate_phone_number(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_phone_number(value)

    def validate_email(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_email(value)

    def validate_password(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_password(value)

    def validate_first_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_first_name(value)

    def validate_last_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_last_name(value)

    def validate_profile_pic(self, value):
        if value:
            user_serializer = UserSerializer()
            return user_serializer.validate_profile_pic(value)
        return value

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Vendor)

class PickerSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    # Flatten user fields
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=False)
    
    # Include user data in response
    user = UserSerializer(read_only=True)

    class Meta:
        model = Picker
        fields = '__all__'

    def validate_fleet_type(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Fleet type is required.")
        return value.strip().lower()

    def validate_phone_number(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_phone_number(value)

    def validate_email(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_email(value)

    def validate_password(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_password(value)

    def validate_first_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_first_name(value)

    def validate_last_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_last_name(value)

    def validate_profile_pic(self, value):
        if value:
            user_serializer = UserSerializer()
            return user_serializer.validate_profile_pic(value)
        return value

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Picker)

class StudentPickerSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    # Flatten user fields
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=False)
    
    # Include user data in response
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentPicker
        fields = '__all__'

    def validate_hostel_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Hostel name is required.")
        return value.strip().title()

    def validate_room_number(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Room number is required.")
        return value.strip().upper()

    def validate_phone_number(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_phone_number(value)

    def validate_email(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_email(value)

    def validate_password(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_password(value)

    def validate_first_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_first_name(value)

    def validate_last_name(self, value):
        user_serializer = UserSerializer()
        return user_serializer.validate_last_name(value)

    def validate_profile_pic(self, value):
        if value:
            user_serializer = UserSerializer()
            return user_serializer.validate_profile_pic(value)
        return value

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, StudentPicker)

# Keep your other serializers unchanged
class KYCVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCVerification
        fields = [
            'id',
            'selfie_image',
            'id_type',
            'id_image',
            'verification_status',
            'submission_date',
            'verification_date',
            'rejection_reason'
        ]
        read_only_fields = [
            'verification_status',
            'submission_date',
            'verification_date',
            'rejection_reason'
        ]

    def validate(self, data):
        user = self.context['request'].user
        if user.user_type == 'student' and data.get('id_type') != 'student_id':
            raise serializers.ValidationError(
                "Students must provide a student ID card"
            )
        return data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['user_type'] = user.user_type
        token['is_verified'] = user.is_verified
        token['is_admin'] = user.is_staff
        token['institution'] = user.institution        
        
        # Get KYC status
        try:
            kyc_status = user.kyc.verification_status if hasattr(user, 'kyc') else None
            category = user.vendor.business_category if hasattr(user, 'vendor') else None
            subscription = user.subscription.status if hasattr(user, 'subscription') else None
        except:
            kyc_status = None

        token['kyc_status'] = kyc_status
        token['category'] = category
        token['subscription'] = subscription
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data['user_type'] = self.user.user_type
        data['is_verified'] = self.user.is_verified
        data['user_id'] = self.user.id
        data['is_admin'] = self.user.is_staff
        data['institution'] = self.user.institution


        # KYC status
        kyc_status = getattr(getattr(self.user, 'kyc', None), 'verification_status', None)

        # Vendor category (OneToOneField)
        category = None
        vendor = getattr(self.user, 'vendor_profile', None)
        if vendor:
            category = vendor.business_category

        # Subscription status
        subscription = None
        sub = getattr(self.user, 'subscription', None)
        if sub:
            if hasattr(sub.user, 'vendor_profile') and sub.user.vendor_profile and sub.user.vendor_profile.business_category == 'others':
                subscription = sub.status
            else:
                subscription = sub.status

        # Add custom claims to the token    
        data['kyc_status'] = kyc_status
        data['category'] = category
        data['subscription'] = subscription

        return data

    

from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.utils.html import strip_tags

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email.")
        return value

    def create(self, validated_data):
        user = User.objects.get(email=validated_data['email'])

        # Delete old unused OTPs
        OTP.objects.filter(user=user, is_used=False).delete()

        # Create new OTP
        otp = OTP.objects.create(user=user)

        # Send OTP via email using template
        self.send_email(user, otp.code)
        return otp

    def send_email(self, user, code):
        # Prepare context for email template
        context = {
            'user': user,
            'otp_code': code,
            'valid_minutes': 10,  # OTP validity duration in minutes
        }

        # Render email template with context
        html_message = render_to_string('email/otp.html', context)
        plain_message = strip_tags(html_message)  # Strip HTML for plain text version

        # Send email
        send_mail(
            subject="Your StuMart OTP Code",
            message=plain_message,
            from_email="noreply@stumart.com",
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
            otp = OTP.objects.get(user=user, code=data['code'], is_used=False)
        except (User.DoesNotExist, OTP.DoesNotExist):
            raise serializers.ValidationError("Invalid email or OTP.")

        if otp.expires_at < timezone.now():
            raise serializers.ValidationError("OTP has expired.")

        data['user'] = user
        data['otp'] = otp
        return data

    def save(self):
        otp = self.validated_data['otp']
        otp.is_used = True
        otp.save()
        return self.validated_data['user']


class SetNewPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        if not User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("User not found.")
        return data

    def save(self):
        user = User.objects.get(email=self.validated_data['email'])
        user.set_password(self.validated_data['password'])
        user.save()
        return user
    

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'duration', 'price', 'description', 'features', 'features_list']
    
    def get_features_list(self, obj):
        if obj.features:
            return [feature.strip() for feature in obj.features.split(',')]
        return []

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'plan_details', 'start_date', 'end_date', 
                 'status', 'auto_renew', 'days_remaining', 'is_active']
    
    def get_days_remaining(self, obj):
        return obj.days_remaining()
    
    def get_is_active(self, obj):
        return obj.is_active()
