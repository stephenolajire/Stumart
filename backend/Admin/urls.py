# admin_dashboard/urls.py
from django.urls import path
from .views import (
    DashboardStatsAPIView, 
    UsersAPIView, 
    VendorsAPIView, 
    PickersAPIView, 
    OrdersAPIView, 
    PaymentsAPIView, 
    KYCVerificationAPIView,
    # AllPickersView,
    ContactView,
)


urlpatterns = [
    # Dashboard overview
    path('admin/stats/', DashboardStatsAPIView.as_view(), name='dashboard_stats'),
    
    # Users management
    path('users/', UsersAPIView.as_view(), name='users_list'),
    path('users/<int:user_id>/', UsersAPIView.as_view(), name='user_detail'),
    
    # Vendors management
    path('vendors/', VendorsAPIView.as_view(), name='vendors_list'),
    path('vendors/<int:vendor_id>/', VendorsAPIView.as_view(), name='vendor_detail'),
    
    # Pickers management
    path('admin-pickers/', PickersAPIView.as_view(), name='pickers_list'),
    path('pickers/<int:picker_id>/', PickersAPIView.as_view(), name='picker_detail'),
    # path('pickers/', AllPickersView.as_view(), name='all-pickers'),
    path('pickers/<int:picker_id>/<str:picker_type>/', PickersAPIView.as_view(), name='picker_type_detail'),
    
    # Orders management
    path('admin-orders/', OrdersAPIView.as_view(), name='orders_list'),
    path('admin-orders/<int:order_id>/', OrdersAPIView.as_view(), name='order_detail'),
    
    # Payments management
    path('admin-payments/', PaymentsAPIView.as_view(), name='payments_list'),
    path('payments/vendor-wallets/', PaymentsAPIView.as_view(), name='vendor_wallets'),
    
    # KYC verification management
    path('admin-kyc-verification/', KYCVerificationAPIView.as_view(), name='kyc_verification_list'),
    path('admin-kyc-verification/<int:verification_id>/', KYCVerificationAPIView.as_view(), name='kyc_verification_detail'),

    #CONTACT US
     path('contact/', ContactView.as_view(), name='contact'),
]
