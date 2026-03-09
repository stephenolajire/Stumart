from django.urls import path
from .views import (
    AcceptDeliveryView,
    CancelOrderView,
    ConfirmDeliveryView,
    CreateOrderView,
    CustomerConfirmationView,
    OrderDetailView,
    OrderHistoryView,
    PackOrderView,
    PaystackPaymentInitializeView,
    PaystackPaymentVerifyView,
)

app_name = "order"

urlpatterns = [
    # POST  order/create/
    path("order/create/", CreateOrderView.as_view(), name="order-create"),

    # GET   order/history/
    path("order/history/", OrderHistoryView.as_view(), name="order-history"),

    # GET   order/<order_number>/
    path("order/<str:order_number>/", OrderDetailView.as_view(), name="order-detail"),

    # POST  order/<order_id>/cancel/
    path("order/<int:order_id>/cancel/", CancelOrderView.as_view(), name="order-cancel"),

    # POST  order/pack/
    path("order/pack/", PackOrderView.as_view(), name="order-pack"),

    # ── Payment ──────────────────────────────────────────────
    # POST  order/payment/initialize/
    path("order/payment/initialize/", PaystackPaymentInitializeView.as_view(), name="payment-initialize"),

    # GET   order/payment/verify/?reference=<ref>&cart_code=<code>
    path("order/payment/verify/", PaystackPaymentVerifyView.as_view(), name="payment-verify"),

    # ── Delivery ─────────────────────────────────────────────
    # GET   order/delivery/accept/<unique_code>/
    path("order/delivery/accept/<str:unique_code>/", AcceptDeliveryView.as_view(), name="delivery-accept-detail"),

    # POST  order/delivery/accept/
    path("order/delivery/accept/", AcceptDeliveryView.as_view(), name="delivery-accept"),

    # GET   order/delivery/confirm/<delivery_confirmation_code>/
    path("order/delivery/confirm/<str:delivery_confirmation_code>/", ConfirmDeliveryView.as_view(), name="delivery-confirm-detail"),

    # POST  order/delivery/confirm/
    path("order/delivery/confirm/", ConfirmDeliveryView.as_view(), name="delivery-confirm"),

    # GET   order/delivery/customer-confirm/<customer_confirmation_code>/
    path("order/delivery/customer-confirm/<str:customer_confirmation_code>/", CustomerConfirmationView.as_view(), name="customer-confirm-detail"),

    # POST  order/delivery/customer-confirm/
    path("order/delivery/customer-confirm/", CustomerConfirmationView.as_view(), name="customer-confirm"),
]