from django.urls import path
from .views import (
    UserAPIView, StudentAPIView, VendorAPIView,
    PickerAPIView, StudentPickerAPIView, ResendOTPView,
    KYCVerificationView,VerificationViewSet
)

app_name = 'users'

urlpatterns = [
    # User URLs
    path('users/', UserAPIView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserAPIView.as_view(), name='user-detail'),
    
    # Student URLs
    path('students/', StudentAPIView.as_view(), name='student-list'),
    path('students/<int:pk>/', StudentAPIView.as_view(), name='student-detail'),
    path('students/filter/', StudentAPIView.as_view(), name='student-filter'),  # For department filtering
    
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
]