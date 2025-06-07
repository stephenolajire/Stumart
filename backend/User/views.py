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
from .serializers import *
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP
from rest_framework import permissions
from .throttles import LoginRateThrottle
from .throttles import RegisterThrottle, EmailVerificationThrottle
import logging
logger = logging.getLogger(__name__)
from django.template.loader import render_to_string
# from django.core.mail import send_mail
from django.utils.html import strip_tags

class BaseAPIView(APIView):
    model = None
    serializer_class = None
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

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
                
                # Prepare email content using template
                html_message = render_to_string('email/otp.html', {
                    'user': user,
                    'otp_code': otp.code,
                })
                
                plain_message = strip_tags(html_message)
                
                # Send email
                send_mail(
                    subject='Verify your Stumart account',
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                
                # Return success response
                return Response({
                    'message': 'Registration successful. Please check your email for verification code.',
                    'user_id': user.id,
                    'data': serializer.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Registration error: {str(e)}")
                return Response({
                    'error': 'Registration failed. Please try again.',
                    'detail': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    throttle_classes = [EmailVerificationThrottle]

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
    throttle_classes = [EmailVerificationThrottle]

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

            # Prepare email content using template
            html_message = render_to_string('email/otp.html', {
                'user': user,
                'otp_code': otp.code,
            })
            
            plain_message = strip_tags(html_message)

            # Send email
            send_mail(
                subject='New Verification Code - Stumart',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
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
            logger.error(f"Failed to send OTP: {str(e)}")
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
                # Save the KYC object first
                kyc_instance = serializer.save(user=request.user)
                
                # Set verification status to PENDING
                kyc_instance.verification_status = 'PENDING'
                
                # Save the updated instance
                kyc_instance.save()

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
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                user = User.objects.get(email=request.data['email'])
                response.data['user'] = {
                    'id': user.id,
                    'email': user.email,
                    'user_type': user.user_type,
                    'is_verified': user.is_verified
                }
            return response
        except Exception as e:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

class RequestOTPView(APIView):
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "OTP sent successfully"}, status=200)
        return Response(serializer.errors, status=400)


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "OTP verified successfully"}, status=200)
        return Response(serializer.errors, status=400)


class SetNewPasswordView(APIView):
    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password updated successfully"}, status=200)
        return Response(serializer.errors, status=400)
    

class StudentDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the student profile for the currently authenticated user"""
        user = request.user
        
        # Get the student profile associated with the user
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Combine user and student data
        user_data = UserSerializer(user).data
        student_data = StudentSerializer(student).data
        image = user.profile_pic
        image_url = image.url if image else None
        
        # Prepare combined response
        response_data = {
            'user': user_data,
            'matric_number': student_data.get('matric_number', ''),
            'department': student_data.get('department', ''),
            'profile_image': image_url
        }
        
        return Response(response_data)

from rest_framework.exceptions import PermissionDenied

class UpdateStudentProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        """Update the student profile for the currently authenticated user"""
        user = request.user
        
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Extract data for user model fields
        user_data = {
            'first_name': request.data.get('first_name', user.first_name),
            'last_name': request.data.get('last_name', user.last_name),
            'phone_number': request.data.get('phone_number', user.phone_number),
            'state': request.data.get('state', user.state),
            'institution': request.data.get('institution', user.institution)
        }
        
        # Include email if provided
        if 'email' in request.data:
            user_data['email'] = request.data.get('email', user.email)
        
        # Extract data for student model fields
        student_data = {
            'matric_number': request.data.get('matric_number', student.matric_number),
            'department': request.data.get('department', student.department)
        }
        
        # Handle profile picture update
        if 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
        
        try:
            # Update user model
            user_serializer = UserSerializer(user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except PermissionDenied as e:
            # Return 403 for email conflicts
            return Response({"email": [str(e)]}, status=status.HTTP_403_FORBIDDEN)
        
        # Update student model
        student_serializer = StudentSerializer(student, data=student_data, partial=True)
        if student_serializer.is_valid():
            student_serializer.save()
        else:
            return Response(student_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare combined response
        response_data = {
            'user': {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'state': user.state,
                'institution': user.institution,
                'profile_pic': user.profile_pic.url if user.profile_pic else None
            },
            'matric_number': student.matric_number,
            'department': student.department
        }
        
        return Response(response_data)


class SubscriptionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscriptions = Subscription.objects.filter(user=request.user)
        serializer = SubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)


class CurrentSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            subscription = request.user.subscription
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response({"detail": "No subscription found"}, status=status.HTTP_404_NOT_FOUND)


class SubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get('plan_id')
        payment_reference = request.data.get('payment_reference')

        if not plan_id or not payment_reference:
            return Response(
                {"detail": "Plan ID and payment reference are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({"detail": "Invalid subscription plan"}, status=status.HTTP_400_BAD_REQUEST)

        # Set start and end dates
        start_date = timezone.now()
        if plan.duration == 'monthly':
            end_date = start_date + timedelta(days=30)
        elif plan.duration == 'half_year':
            end_date = start_date + timedelta(days=182)
        elif plan.duration == 'yearly':
            end_date = start_date + timedelta(days=365)
        else:
            end_date = start_date + timedelta(days=30)

        # Create or update subscription
        try:
            subscription = request.user.subscription
            subscription.plan = plan
            subscription.start_date = start_date
            subscription.end_date = end_date
            subscription.status = 'active'
            subscription.payment_reference = payment_reference
            subscription.save()
        except Subscription.DoesNotExist:
            subscription = Subscription.objects.create(
                user=request.user,
                plan=plan,
                start_date=start_date,
                end_date=end_date,
                status='active',
                payment_reference=payment_reference
            )

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

class VendorProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get (self, request):
        try:
            vendor = Vendor.objects.get(user=request.user)
            serializer = VendorSerializer(vendor)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Vendor.DoesNotExist:
            return Response({"detail": "Vendor profile not found"}, status=status.HTTP_404_NOT_FOUND)
        

class AllPlansView(APIView):
    permission_classes = [permissions.AllowAny]  # or IsAuthenticated if needed

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True)
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class KYCStatusView(APIView):

    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_type, user_id):
        try:
            # Validate user_type
            valid_user_types = ['student', 'vendor', 'picker', 'student_picker', 'admin']
            if user_type not in valid_user_types:
                return Response(
                    {'error': 'Invalid user type'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get user
            user = get_object_or_404(User, id=user_id, user_type=user_type)
            
            # Check if requesting user has permission to view this data
            if request.user.id != int(user_id) and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get or create KYC verification record
            kyc_verification, created = KYCVerification.objects.get_or_create(
                user=user,
                defaults={'verification_status': 'none'}
            )
            
            # Prepare response data
            response_data = {
                'user_id': user.id,
                'user_type': user.user_type,
                'email': user.email,
                'is_verified': user.is_verified,
                'status': kyc_verification.verification_status,
                'submission_date': kyc_verification.submission_date,
                'verification_date': kyc_verification.verification_date,
                'rejection_reason': kyc_verification.rejection_reason,
                'id_type': kyc_verification.id_type,
            }
            
            # Add user-type specific data
            if user_type == 'vendor':
                try:
                    vendor_profile = user.vendor_profile
                    response_data.update({
                        'business_name': vendor_profile.business_name,
                        'business_category': vendor_profile.business_category,
                        'needs_subscription': vendor_profile.needs_subscription,
                        'has_active_subscription': vendor_profile.has_active_subscription,
                        'subscription_status': vendor_profile.subscription_status,
                    })
                except Vendor.DoesNotExist:
                    response_data['profile_complete'] = False
                    
            elif user_type in ['picker', 'student_picker']:
                try:
                    if user_type == 'picker':
                        picker_profile = user.picker_profile
                    else:
                        picker_profile = user.student_picker_profile
                        
                    response_data.update({
                        'is_available': picker_profile.is_available,
                        'total_deliveries': picker_profile.total_deliveries,
                        'rating': float(picker_profile.rating),
                    })
                except (Picker.DoesNotExist, StudentPicker.DoesNotExist):
                    response_data['profile_complete'] = False
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error checking KYC status: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )