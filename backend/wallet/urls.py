from django.urls import path
from . views import *

urlpatterns = [
    path('add-to-cart/', AddToCartView.as_view(), name='add-to-cart'),
    path('update-cart-item/<int:item_id>/', UpdateCartItemView.as_view(), name='update-cart-item'),
    path('remove-cart-item/<int:item_id>/', RemoveCartItemView.as_view(), name='remove-cart-item'),
    path('clear-cart/', ClearCartView.as_view(), name='clear-cart'),
    path('cart/', CartItemsView.as_view(), name='cart-items'),
    path('orders/create/', CreateOrderView.as_view(), name='order-create'),
    path('orders/<int:order_id>/cancel/', CancelOrderView.as_view(), name='cancel-order'),
    path('payment/initialize/', PaystackPaymentInitializeView.as_view(), name='order-detail'),
    path('payment/verify/', PaystackPaymentVerifyView.as_view(), name='order-detail'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/', OrderHistoryView.as_view(), name='order-list'),
    path('pack-order/', PackOrderView.as_view(), name='pack-order'),
    path('accept-delivery/', AcceptDeliveryView.as_view(), name='accept-delivery'),
    path('delivery-details/<str:unique_code>/', AcceptDeliveryView.as_view(), name='delivery-details'),
    path('delivery/confirm/', ConfirmDeliveryView.as_view(), name='confirm-delivery'),
    path('delivery/confirm/<str:delivery_confirmation_code>/', ConfirmDeliveryView.as_view(), name='delivery-details'),
    path('customer/confirm-order/', CustomerConfirmationView.as_view(), name='confirm-delivery'),
    path('customer/confirm-order/<str:customer_confirmation_code>/', CustomerConfirmationView.as_view(), name='delivery-details'),
]
