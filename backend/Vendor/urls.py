# vendor/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'vendor-items', views.ProductViewSet, basename='vendor-products')
router.register(r'orders', views.OrderViewSet, basename='vendor-orders')
router.register(r'inventory', views.InventoryViewSet, basename='vendor-inventory')
router.register(r'payments', views.PaymentViewSet, basename='vendor-payments')
router.register(r'reviews', views.ReviewViewSet, basename='vendor-reviews')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('webhooks/paystack/', views.paystack_webhook, name='paystack_webhook'),
]