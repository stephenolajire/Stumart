from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Student, Vendor, Picker, StudentPicker, OTP, KYCVerification
from .serializers import (
    UserSerializer, StudentSerializer, VendorSerializer,
    PickerSerializer, StudentPickerSerializer, KYCVerificationSerializer,
    CustomTokenObtainPairSerializer
)
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP

class BaseAPIView(APIView):
    model = None
    serializer_class = None
    permission_classes = [AllowAny]

    def get(self, request, pk=None):
        if pk:
            instance = get_object_or_404(self.model, pk=pk)
            serializer = self.serializer_class(instance)
            return Response(serializer.data)
        
        instances = self.model.objects.all()
        serializer = self.serializer_class(instances, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                # Save the instance
                instance = serializer.save()
                
                # Get the user object
                user = instance.user if hasattr(instance, 'user') else instance
                
                # Create OTP and send email
                otp = OTP.objects.create(user=user)
                
                # Prepare email content
                subject = 'Verify your Stumart account'
                message = f'''
                Welcome to Stumart!
                
                Your verification code is: {otp.code}
                
                This code will expire in 10 minutes.
                
                If you didn't request this code, please ignore this email.
                '''
            
                # Send email
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                
                # Return success response with user_id
                return Response({
                    'message': 'Registration successful. Please check your email for verification code.',
                    'user_id': user.id,
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # Log the error for debugging
                print(f"Registration error: {str(e)}")
                return Response({
                    'error': 'Registration failed. Please try again.',
                    'detail': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        instance = get_object_or_404(self.model, pk=pk)
        serializer = self.serializer_class(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        instance = get_object_or_404(self.model, pk=pk)
        serializer = self.serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        instance = get_object_or_404(self.model, pk=pk)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserAPIView(BaseAPIView):
    model = User
    serializer_class = UserSerializer

    def get(self, request, pk=None):
        if pk:
            user = get_object_or_404(User, pk=pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class StudentAPIView(BaseAPIView):
    model = Student
    serializer_class = StudentSerializer

    def get(self, request, pk=None):
        if pk:
            student = get_object_or_404(Student, pk=pk)
            serializer = StudentSerializer(student)
            return Response(serializer.data)

        department = request.query_params.get('department')
        if department:
            students = Student.objects.filter(department=department)
        else:
            students = Student.objects.all()
            
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

class VendorAPIView(BaseAPIView):
    model = Vendor
    serializer_class = VendorSerializer

    def get(self, request, pk=None):
        if pk:
            vendor = get_object_or_404(Vendor, pk=pk)
            serializer = VendorSerializer(vendor)
            return Response(serializer.data)

        category = request.query_params.get('category')
        specific_category = request.query_params.get('specific_category')
        
        vendors = Vendor.objects.all()
        if category:
            vendors = vendors.filter(business_category=category)
        if specific_category:
            vendors = vendors.filter(specific_category=specific_category)
            
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)

class PickerAPIView(BaseAPIView):
    model = Picker
    serializer_class = PickerSerializer

    def get(self, request, pk=None):
        if pk:
            picker = get_object_or_404(Picker, pk=pk)
            serializer = PickerSerializer(picker)
            return Response(serializer.data)

        available = request.query_params.get('available')
        if available:
            pickers = Picker.objects.filter(is_available=True)
        else:
            pickers = Picker.objects.all()
            
        serializer = PickerSerializer(pickers, many=True)
        return Response(serializer.data)

class StudentPickerAPIView(BaseAPIView):
    model = StudentPicker
    serializer_class = StudentPickerSerializer

    def get(self, request, pk=None):
        if pk:
            student_picker = get_object_or_404(StudentPicker, pk=pk)
            serializer = StudentPickerSerializer(student_picker)
            return Response(serializer.data)

        hostel = request.query_params.get('hostel')
        available = request.query_params.get('available')
        
        student_pickers = StudentPicker.objects.all()
        if hostel:
            student_pickers = student_pickers.filter(hostel_name=hostel)
        if available:
            student_pickers = student_pickers.filter(is_available=True)
            
        serializer = StudentPickerSerializer(student_pickers, many=True)
        return Response(serializer.data)

class VerificationViewSet(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        otp_code = request.data.get('otp')

        if not user_id or not otp_code:
            return Response({
                'error': 'Both user_id and otp are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            otp = OTP.objects.filter(
                user=user,
                code=otp_code,
                is_used=False,
                expires_at__gt=timezone.now()
            ).latest('created_at')

            if not otp:
                return Response({
                    'error': 'Invalid or expired OTP'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Mark OTP as used and verify user
            otp.is_used = True
            otp.save()
            user.is_verified = True
            user.save()

            return Response({
                'message': 'Email verified successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except OTP.DoesNotExist:
            return Response({
                'error': 'Invalid or expired OTP'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({
                'error': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)

            # Delete all existing unused OTPs for this user
            OTP.objects.filter(user=user, is_used=False).delete()

            # Create new OTP
            otp = OTP.objects.create(user=user)

            # Prepare email content
            subject = 'New Verification Code - Stumart'
            message = f'''
            Hello {user.first_name}!
            
            Your new verification code is: {otp.code}
            
            This code will expire in 10 minutes.
            
            If you didn't request this code, please ignore this email.
            '''

            # Send email
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return Response({
                'message': 'New verification code sent successfully'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': f'Failed to send new code: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class KYCVerificationView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = KYCVerificationSerializer

    def post(self, request):
        try:
            # Check if KYC already exists
            if hasattr(request.user, 'kyc'):
                return Response({
                    'error': 'KYC verification already submitted'
                }, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.serializer_class(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response({
                    'message': 'KYC verification submitted successfully',
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request):
        try:
            kyc = get_object_or_404(KYCVerification, user=request.user)
            serializer = self.serializer_class(kyc)
            return Response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_404_NOT_FOUND)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer