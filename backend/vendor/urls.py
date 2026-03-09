# vendor/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    UpdateStockAPIView, 
    ProductStockHistoryAPIView, 
    ProductPromtionAPIView, 
    VendorProductsListView
)
from .webhooks import PaystackWebhookView

router = DefaultRouter()
router.register(r'vendor/items', views.ProductViewSet, basename='vendor-products')
router.register(r'vendor/inventory', views.InventoryViewSet, basename='vendor-inventory')
router.register(r'vendor/payments', views.PaymentViewSet, basename='vendor-payments')

urlpatterns = [
    path('', include(router.urls)),
    
    # Dashboard & Stats
    path('vendor/dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    
    # Orders
    path('vendor/orders/', views.OrderView.as_view(), name='vendor-orders'),
    
    # Vendor Details
    path('vendor/details/', views.VendorDetailsView.as_view(), name='vendor-details'),
    
    # Webhooks
    path('vendor/webhooks/paystack/', PaystackWebhookView.as_view(), name='paystack_webhook'),
    
    # Reviews
    path('vendor/reviews/', views.VendorReviewsAPIView.as_view(), name='vendor_reviews'),
    
    # Picker
    path('vendor/assigned-picker/', views.PickerDetailsView.as_view(), name='picker-details'),
    
    # Stock Management
    path('vendor/products/<int:product_id>/update-stock/', 
         UpdateStockAPIView.as_view(), 
         name='update_stock'),
    
    path('vendor/products/<int:product_id>/stock-history/', 
         ProductStockHistoryAPIView.as_view(), 
         name='product_stock_history'),
    
    path('vendor/products/<int:product_id>/update-promotion/', 
         ProductPromtionAPIView.as_view(), 
         name='product_promotion'),
    
    # Bulk Discount
    path('vendor/products/bulk-discount/', 
         views.BulkDiscountAPIView.as_view(),
         name='bulk_discount'),
    
    # Settings
    path('vendor/settings/', 
         views.get_settings_data, 
         name='get_settings_data'),
    
    path('vendor/settings/account/', 
         views.UserAccountUpdateView.as_view(), 
         name='user_account_update'),
    
    path('vendor/settings/store/', 
         views.VendorStoreUpdateView.as_view(), 
         name='vendor_store_update'),
    
    path('vendor/settings/payment/', 
         views.VendorPaymentUpdateView.as_view(), 
         name='vendor_payment_update'),
    
    path('vendor/settings/password/', 
         views.PasswordChangeView.as_view(), 
         name='password_change'),
    
    # Profile
    path('vendor/profile/', 
         views.UserProfileView.as_view(), 
         name='user_profile'),
    
    # Admin - Vendor Products
    path('vendor/admin/<int:vendor_id>/products/', 
         VendorProductsListView.as_view(), 
         name='vendor_products_list'),
]