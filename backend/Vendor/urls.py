# vendor/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import UpdateStockAPIView, ProductStockHistoryAPIView, ProductPromtionAPIView
from .webhooks import PaystackWebhookView

router = DefaultRouter()
router.register(r'vendor-items', views.ProductViewSet, basename='vendor-products')
# router.register(r'orders', views.OrderViewSet, basename='vendor-orders')
router.register(r'inventory', views.InventoryViewSet, basename='vendor-inventory')
router.register(r'payments', views.PaymentViewSet, basename='vendor-payments')
# router.register(r'reviews', views.ReviewViewSet, basename='vendor-reviews')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    # path('webhooks/paystack/', views.paystack_webhook, name='paystack_webhook'),
    path('vendor-orders/', views.OrderView.as_view(), name='vendor-orders'),
    path('vendor-details/', views.VendorDetailsView.as_view(), name='vendor-details'),
     path('webhooks/paystack/', PaystackWebhookView.as_view(), name='paystack_webhook'),
    # picker reviews
    path('vendor/reviews/', views.VendorReviewsAPIView.as_view(), name='vendor_reviews'),
    path('assigned/picker/', views.PickerDetailsView.as_view(), name='picker-details'),

    # Stock update endpoints
    path('products/<int:product_id>/update-stock/', 
         UpdateStockAPIView.as_view(), 
         name='update_stock'),
    
    path('products/<int:product_id>/stock-history/', 
         ProductStockHistoryAPIView.as_view(), 
         name='product_stock_history'),

     path('products/<int:product_id>/update-promotion/', 
         ProductPromtionAPIView.as_view(), 
         name='product_stock_history'),

     path('products/bulk-discount/', views.BulkDiscountAPIView.as_view()),

    path('vendor/settings/', views.get_settings_data, name='get_settings_data'),
    path('settings/account/', views.UserAccountUpdateView.as_view(), name='user_account_update'),
    path('settings/store/', views.VendorStoreUpdateView.as_view(), name='vendor_store_update'),
    path('settings/payment/', views.VendorPaymentUpdateView.as_view(), name='vendor_payment_update'),
    path('settings/password/', views.PasswordChangeView.as_view(), name='password_change'),
    
    # Profile endpoint
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
]