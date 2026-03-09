from django.urls import path
from .views import *

urlpatterns = [
    # ── User ────────────────────────────────────────────────
    path('user/users/', UserAPIView.as_view(), name='user-list'),
    path('user/users/<int:pk>/', UserAPIView.as_view(), name='user-detail'),

    # ── Student ─────────────────────────────────────────────
    path('user/students/', StudentAPIView.as_view(), name='student-list'),
    path('user/students/<int:pk>/', StudentAPIView.as_view(), name='student-detail'),
    path('user/students/filter/', StudentAPIView.as_view(), name='student-filter'),
    path('user/student-details/', StudentDetailsView.as_view(), name='student-details'),
    path('user/update-student-profile/', UpdateStudentProfileView.as_view(), name='update-student-profile'),

    # ── Vendor ──────────────────────────────────────────────
    path('user/vendors/', VendorAPIView.as_view(), name='vendor-list'),
    path('user/vendors/<int:pk>/', VendorAPIView.as_view(), name='vendor-detail'),
    path('user/vendors/filter/', VendorAPIView.as_view(), name='vendor-filter'),
    path('user/vendor/profile/', VendorProfileView.as_view(), name='vendor-profile'),

    # ── Picker ──────────────────────────────────────────────
    path('user/pickers/', PickerAPIView.as_view(), name='picker-list'),
    path('user/pickers/<int:pk>/', PickerAPIView.as_view(), name='picker-detail'),
    path('user/pickers/available/', PickerAPIView.as_view(), name='picker-available'),

    # ── Student Picker ───────────────────────────────────────
    path('user/student-pickers/', StudentPickerAPIView.as_view(), name='student-picker-list'),
    path('user/student-pickers/<int:pk>/', StudentPickerAPIView.as_view(), name='student-picker-detail'),
    path('user/student-pickers/filter/', StudentPickerAPIView.as_view(), name='student-picker-filter'),

    # ── Company ─────────────────────────────────────────────
    path('user/companies/', CompanySignupAPIView.as_view(), name='company-list'),
    path('user/company/signup/', CompanySignupAPIView.as_view(), name='company-signup'),
    path('user/company/<int:pk>/', CompanySignupAPIView.as_view(), name='company-detail'),

    # ── Auth / OTP ───────────────────────────────────────────
    path('user/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('user/verify-email/', VerificationViewSet.as_view(), name='verify-email'),
    path('user/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('user/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('user/reset-password/', SetNewPasswordView.as_view(), name='reset-password'),

    # ── KYC ─────────────────────────────────────────────────
    path('user/kyc/', KYCVerificationView.as_view(), name='kyc-verification'),
    path('user/kyc-status/<str:user_type>/<int:user_id>/', KYCStatusView.as_view(), name='kyc-status'),

    # ── Subscription ─────────────────────────────────────────
    path('user/subscription/', SubscriptionListView.as_view(), name='subscription-list'),
    path('user/subscriptions/current/', CurrentSubscriptionView.as_view(), name='subscription-current'),
    path('user/subscriptions/subscribe/', SubscribeView.as_view(), name='subscription-subscribe'),
    path('user/subscriptions/plans/', AllPlansView.as_view(), name='subscription-plans'),
]