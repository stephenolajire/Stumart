from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import *

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    # confirm_password = serializers.CharField(write_only=True, required=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'password', 
                 'first_name', 'last_name', 'phone_number', 'user_type', 
                 'profile_pic', 'state', 'institution','image_url')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
    def get_image_url(self, obj):
        if obj.profile_pic:
            return obj.profile_pic.url
        return None

    def validate(self, attrs):
        # if attrs['password'] != attrs['confirm_password']:
        #     raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Phone number validation
        if not attrs['phone_number'].startswith('0'):
            raise serializers.ValidationError({"phone_number": "Phone number must start with 0"})
        
        return attrs

    def create(self, validated_data):
        # validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Student
        fields = ('id', 'user', 'matric_number', 'department')

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        student = Student.objects.create(user=user, **validated_data)
        return student

class VendorSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Vendor
        fields = '__all__'

    def validate_account_number(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Account number must be 10 digits")
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        vendor = Vendor.objects.create(user=user, **validated_data)
        return vendor

class PickerSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Picker
        fields = '__all__'

    def validate_account_number(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Account number must be 10 digits")
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        picker = Picker.objects.create(user=user, **validated_data)
        return picker

class StudentPickerSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = StudentPicker
        fields = '__all__'

    def validate_account_number(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Account number must be 10 digits")
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        student_picker = StudentPicker.objects.create(user=user, **validated_data)
        return student_picker

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

        # Send OTP via email (mock or actual)
        self.send_email(user.email, otp.code)
        return otp

    def send_email(self, email, code):
        # Use Django's email backend or a mock for testing
        from django.core.mail import send_mail
        send_mail(
            "Your OTP Code",
            f"Your OTP code is: {code}",
            "noreply@stumart.com",  # from email
            [email],
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
