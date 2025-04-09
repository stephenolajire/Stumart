from django.urls import path
from .views import *

urlpatterns = [
    path('vendor-products/<int:id>', ProductsView.as_view(), name='list-vendor-products'),
    path("shops-by-school/", VendorsBySchoolView.as_view(), name="shops-by-school"),
    path("shops-by-category/", VendorsByOtherView.as_view()),
    path("shops-by-school-and-category/", VendorsByOtherandSchoolView.as_view()),
    path("product/<str:id>/", ProductView.as_view()),
    path('create-products/', GetVendorView.as_view()),
    path('vendor-products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('vendor-product/<str:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('add-to-cart/', AddToCartView.as_view(), name='add-to-cart'),
    path('update-cart-item/<int:item_id>/', UpdateCartItemView.as_view(), name='update-cart-item'),
    path('remove-cart-item/<int:item_id>/', RemoveCartItemView.as_view(), name='remove-cart-item'),
    path('clear-cart/', ClearCartView.as_view(), name='clear-cart'),
    path('cart/', CartItemsView.as_view(), name='cart-items'),
    path('orders/create/', CreateOrderView.as_view(), name='order-create'),
    path('payment/initialize/', PaystackPaymentInitializeView.as_view(), name='order-detail'),
    path('payment/verify/', PaystackPaymentVerifyView.as_view(), name='order-detail'),
]