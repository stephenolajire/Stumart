from django.urls import path
from .views import *
from django.urls import path


urlpatterns = [
    # User URLs
    path('users/', UserAPIView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserAPIView.as_view(), name='user-detail'),
    
    # Student URLs
    path('students/', StudentAPIView.as_view(), name='student-list'),
    path('students/<int:pk>/', StudentAPIView.as_view(), name='student-detail'),
    path('students/filter/', StudentAPIView.as_view(), name='student-filter'),  # For department filtering
    path('student-details/', StudentDetailsView.as_view(), name='student-details'),
    path('update-student-profile/', UpdateStudentProfileView.as_view(), name='update-student-profile'),
    
    # Vendor URLs
    path('vendors/', VendorAPIView.as_view(), name='vendor-list'),
    path('vendors/<int:pk>/', VendorAPIView.as_view(), name='vendor-detail'),
    path('vendors/filter/', VendorAPIView.as_view(), name='vendor-filter'),  # For category filtering
    
    # Picker URLs
    path('pickers/', PickerAPIView.as_view(), name='picker-list'),
    path('pickers/<int:pk>/', PickerAPIView.as_view(), name='picker-detail'),
    path('pickers/available/', PickerAPIView.as_view(), name='picker-available'),
    
    # Student Picker URLs
    path('student-pickers/', StudentPickerAPIView.as_view(), name='student-picker-list'),
    path('student-pickers/<int:pk>/', StudentPickerAPIView.as_view(), name='student-picker-detail'),
    path('student-pickers/filter/', StudentPickerAPIView.as_view(), name='student-picker-filter'),  # For hostel and availability filtering

    # Resend OTP URL
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),

    # KYC Verification URL
    path('verify-email/', VerificationViewSet.as_view(), name='verify-email'),
    path('kyc/', KYCVerificationView.as_view(), name='kyc-verification'),

    # Forgot Password URL
    path('request-otp/', RequestOTPView.as_view(), name='forgot-password'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('reset-password/', SetNewPasswordView.as_view(), name='reset-password'),
    
    # subscription
    path('subscription/', SubscriptionListView.as_view(), name='subscription-list'),
    path('subscriptions/current/', CurrentSubscriptionView.as_view(), name='subscription-current'),
    path('subscriptions/subscribe/', SubscribeView.as_view(), name='subscription-subscribe'),
    path('vendor/profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('allplans', AllPlansView.as_view()),
]

