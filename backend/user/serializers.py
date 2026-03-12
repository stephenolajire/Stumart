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

# ── Custom exception classes ───────────────────────────────────────────────────
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


# ── UserSerializer ─────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'password',
            'first_name', 'last_name', 'phone_number', 'user_type',
            'profile_pic', 'state', 'institution', 'image_url',
        )
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name':  {'required': True},
        }

    def get_image_url(self, obj):
        if obj.profile_pic:
            return obj.profile_pic.url
        return None

    def validate_email(self, value):
        if not value:
            raise MissingRequiredFieldError("Email is required.")

        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, value):
            raise InvalidEmailFormatError()

        instance = getattr(self, 'instance', None)
        if instance and instance.email == value:
            return value

        existing = User.objects.filter(email__iexact=value)
        if instance:
            existing = existing.exclude(id=instance.id)
        if existing.exists():
            raise EmailExistsError()

        return value.lower()

    def validate_username(self, value):
        if not value:
            raise MissingRequiredFieldError("Username is required.")

        instance = getattr(self, 'instance', None)
        if instance and instance.username == value:
            return value

        existing = User.objects.filter(username__iexact=value)
        if instance:
            existing = existing.exclude(id=instance.id)
        if existing.exists():
            raise UsernameExistsError()

        return value.lower()

    def validate_phone_number(self, value):
        if not value:
            raise MissingRequiredFieldError("Phone number is required.")

        cleaned_phone = re.sub(r'[^\d]', '', value)

        if not (cleaned_phone.startswith('0') and len(cleaned_phone) == 11):
            raise InvalidPhoneFormatError()

        if not re.match(r'^0[7-9]\d{9}$', cleaned_phone):
            raise InvalidPhoneFormatError(
                "Phone number must be a valid Nigerian mobile number "
                "(07xxxxxxxxx, 08xxxxxxxxx, or 09xxxxxxxxx)."
            )

        instance = getattr(self, 'instance', None)
        if instance and instance.phone_number == cleaned_phone:
            return cleaned_phone

        existing = User.objects.filter(phone_number=cleaned_phone)
        if instance:
            existing = existing.exclude(id=instance.id)
        if existing.exists():
            raise PhoneNumberExistsError()

        return cleaned_phone

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("First name is required.")
        if not re.match(r"^[a-zA-Z\s'-]+$", value.strip()):
            raise ValidationError("First name can only contain letters, spaces, hyphens, and apostrophes.")
        return value.strip().title()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Last name is required.")
        if not re.match(r"^[a-zA-Z\s'-]+$", value.strip()):
            raise ValidationError("Last name can only contain letters, spaces, hyphens, and apostrophes.")
        return value.strip().title()

    def validate_password(self, value):
        if not value:
            raise MissingRequiredFieldError("Password is required.")
        if len(value) < 8:
            raise PasswordTooWeakError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise PasswordTooWeakError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise PasswordTooWeakError("Password must contain at least one lowercase letter.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise PasswordTooWeakError("Password must contain at least one special character.")
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise PasswordTooWeakError(' '.join(e.messages))
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
                return User.objects.create_user(**validated_data)
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


# ── Base mixin ─────────────────────────────────────────────────────────────────
class BaseUserProfileMixin:
    """Mixin to handle common user profile validation without duplication"""

    def validate_profile_pic(self, value):
        """Validates profile pic — only called for serializers that include the field"""
        if not value:
            return value
        if value.size > 5 * 1024 * 1024:
            raise ImageTooLargeError()
        allowed_formats = ['image/jpeg', 'image/png', 'image/gif']
        if value.content_type not in allowed_formats:
            raise InvalidImageFormatError()
        return value

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

    def validate_phone_number(self, value):
        return UserSerializer().validate_phone_number(value)

    def validate_email(self, value):
        return UserSerializer().validate_email(value)

    def validate_password(self, value):
        return UserSerializer().validate_password(value)

    def validate_first_name(self, value):
        return UserSerializer().validate_first_name(value)

    def validate_last_name(self, value):
        return UserSerializer().validate_last_name(value)

    def _get_user_fields(self):
        return {
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'state', 'institution',
        }

    def _extract_user_data(self, validated_data):
        user_fields = [
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone_number', 'user_type', 'state', 'institution',
            'profile_pic'
        ]
        user_data = {}
        for field in user_fields:
            if field in validated_data:
                user_data[field] = validated_data.pop(field)
        return user_data

    def create_user_and_profile(self, validated_data, model_class):
        try:
            with transaction.atomic():
                user_data = self._extract_user_data(validated_data)
                user = User.objects.create_user(**user_data)
                profile = model_class.objects.create(user=user, **validated_data)
                return profile
        except IntegrityError as e:
            error_message = str(e).lower()
            print(f"IntegrityError in create_user_and_profile: {e}")  # 👈 add this
            if 'phone_number' in error_message:
                raise PhoneNumberExistsError()
            elif 'email' in error_message:
                raise EmailExistsError()
            elif 'username' in error_message:
                raise UsernameExistsError()
            elif 'matric_number' in error_message:
                raise InvalidMatricNumberError()
            raise ValidationError(f"Failed to create profile due to data integrity constraint: {str(e)}")  # 👈 expose real error
        except Exception as e:
            print(f"Unexpected error in create_user_and_profile: {type(e).__name__}: {e}")  # 👈 add this
            raise ValidationError(f"An unexpected error occurred: {type(e).__name__}: {str(e)}")  # 👈 expose type


# ── StudentSerializer — no profile_pic ────────────────────────────────────────
class StudentSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    # no profile_pic — students don't provide it during registration

    user = UserSerializer(read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Student)


# ── AreaSerializer ─────────────────────────────────────────────────────────────
class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ["id", "name"]


# ── CompanySignupSerializer ────────────────────────────────────────────────────
class CompanySignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    delivery_areas = serializers.ListField(
        child=serializers.CharField(max_length=100),
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            "email", "password", "first_name", "last_name", "phone_number",
            "state", "institution", "delivery_areas",
        ]

    def create(self, validated_data):
        delivery_area_names = validated_data.pop("delivery_areas", [])

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            state=validated_data.get("state", ""),
            institution=validated_data.get("institution", ""),
            user_type="company",
        )

        company = Company.objects.create(user=user)

        area_objects = []
        for area_name in delivery_area_names:
            area, _ = Area.objects.get_or_create(name=area_name.strip())
            area_objects.append(area)

        company.delivery_areas.set(area_objects)
        return user


# ── VendorSerializer — profile_pic required ───────────────────────────────────
class VendorSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=True)
    

    user = UserSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = '__all__'

    def validate_business_name(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Business name is required.")
        institution = self.initial_data.get('institution')
        if institution and Vendor.objects.filter(
            business_name__iexact=value.strip(),
            user__institution=institution,
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
        if value.size > 5 * 1024 * 1024:
            raise ImageTooLargeError()
        allowed_formats = ['image/jpeg', 'image/png', 'image/gif']
        if value.content_type not in allowed_formats:
            raise InvalidImageFormatError()
        return value

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Vendor)


# ── PickerSerializer — profile_pic required ───────────────────────────────────
class PickerSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=True)

    user = UserSerializer(read_only=True)

    class Meta:
        model = Picker
        fields = '__all__'

    def validate_fleet_type(self, value):
        if not value or not value.strip():
            raise MissingRequiredFieldError("Fleet type is required.")
        return value.strip().lower()

    def create(self, validated_data):
        return self.create_user_and_profile(validated_data, Picker)


# ── StudentPickerSerializer — profile_pic required ────────────────────────────
class StudentPickerSerializer(BaseUserProfileMixin, serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    user_type = serializers.CharField(write_only=True)
    state = serializers.CharField(write_only=True)
    institution = serializers.CharField(write_only=True)
    profile_pic = serializers.ImageField(write_only=True, required=True)

    preferred_vendors = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        many=True,
        required=False,
    )

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

    def validate(self, data):
        institution = data.get('institution', '').strip().lower()
        preferred_vendors = data.get('preferred_vendors', [])

        if preferred_vendors and institution:
            invalid_vendors = [
                v for v in preferred_vendors
                if v.user.institution.strip().lower() != institution
            ]
            if invalid_vendors:
                bad_names = [v.business_name for v in invalid_vendors]
                raise ValidationError(
                    f"The following vendors are not in your institution: {', '.join(bad_names)}"
                )
        return data

    def create(self, validated_data):
        preferred_vendors = validated_data.pop('preferred_vendors', [])
        instance = self.create_user_and_profile(validated_data, StudentPicker)
        if preferred_vendors:
            instance.preferred_vendors.set(preferred_vendors)
        return instance


# ── KYCVerificationSerializer ──────────────────────────────────────────────────
class KYCVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCVerification
        fields = [
            'id', 'selfie_image', 'id_type', 'id_image',
            'verification_status', 'submission_date',
            'verification_date', 'rejection_reason',
        ]
        read_only_fields = [
            'verification_status', 'submission_date',
            'verification_date', 'rejection_reason',
        ]

    def validate(self, data):
        user = self.context['request'].user
        if user.user_type == 'student' and data.get('id_type') != 'student_id':
            raise serializers.ValidationError("Students must provide a student ID card")
        return data


# ── CustomTokenObtainPairSerializer ───────────────────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_type']   = user.user_type
        token['is_verified'] = user.is_verified
        token['is_admin']    = user.is_staff
        token['institution'] = user.institution

        try:
            kyc_status   = user.kyc.verification_status if hasattr(user, 'kyc') else None
            category     = user.vendor.business_category if hasattr(user, 'vendor') else None
            subscription = user.subscription.status if hasattr(user, 'subscription') else None
        except Exception:
            kyc_status = category = subscription = None

        token['kyc_status']    = kyc_status
        token['category']      = category
        token['subscription']  = subscription
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data['user_type']   = self.user.user_type
        data['is_verified'] = self.user.is_verified
        data['user_id']     = self.user.id
        data['is_admin']    = self.user.is_staff
        data['institution'] = self.user.institution

        kyc_status = getattr(getattr(self.user, 'kyc', None), 'verification_status', None)

        category = None
        vendor = getattr(self.user, 'vendor_profile', None)
        if vendor:
            category = vendor.business_category

        subscription = None
        sub = getattr(self.user, 'subscription', None)
        if sub:
            subscription = sub.status

        data['kyc_status']   = kyc_status
        data['category']     = category
        data['subscription'] = subscription
        return data


# ── OTP Serializers ────────────────────────────────────────────────────────────
class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email.")
        return value

    def create(self, validated_data):
        user = User.objects.get(email=validated_data['email'])
        OTP.objects.filter(user=user, is_used=False).delete()
        otp = OTP.objects.create(user=user)
        self.send_email(user, otp.code)
        return otp

    def send_email(self, user, code):
        context = {
            'user': user,
            'otp_code': code,
            'valid_minutes': 10,
        }
        html_message  = render_to_string('email/otp.html', context)
        plain_message = strip_tags(html_message)
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
    code  = serializers.CharField(max_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
            otp  = OTP.objects.get(user=user, code=data['code'], is_used=False)
        except (User.DoesNotExist, OTP.DoesNotExist):
            raise serializers.ValidationError("Invalid email or OTP.")

        if otp.expires_at < timezone.now():
            raise serializers.ValidationError("OTP has expired.")

        data['user'] = user
        data['otp']  = otp
        return data

    def save(self):
        otp = self.validated_data['otp']
        otp.is_used = True
        otp.save()
        return self.validated_data['user']


class SetNewPasswordSerializer(serializers.Serializer):
    email    = serializers.EmailField()
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


# ── Subscription Serializers ───────────────────────────────────────────────────
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features_list = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'duration', 'price', 'description', 'features', 'features_list']

    def get_features_list(self, obj):
        if obj.features:
            return [f.strip() for f in obj.features.split(',')]
        return []


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details   = SubscriptionPlanSerializer(source='plan', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    is_active      = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_details', 'start_date', 'end_date',
            'status', 'auto_renew', 'days_remaining', 'is_active',
        ]

    def get_days_remaining(self, obj):
        return obj.days_remaining()

    def get_is_active(self, obj):
        return obj.is_active()