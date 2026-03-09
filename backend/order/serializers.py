from rest_framework import serializers
from decimal import Decimal


# ─────────────────────────────────────────────
# REQUEST SERIALIZERS
# ─────────────────────────────────────────────

class CreateOrderRequestSerializer(serializers.Serializer):
    """POST /order/create/"""
    cart_items       = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of CartItem IDs to convert into an order"
    )
    first_name       = serializers.CharField()
    last_name        = serializers.CharField()
    email            = serializers.EmailField()
    phone            = serializers.CharField()
    address          = serializers.CharField(help_text="Delivery address / hostel name")
    room_number      = serializers.CharField(required=False, allow_null=True)
    subtotal         = serializers.DecimalField(max_digits=10, decimal_places=2)
    shipping_fee     = serializers.DecimalField(max_digits=10, decimal_places=2)
    tax              = serializers.DecimalField(max_digits=10, decimal_places=2)
    takeaway         = serializers.DecimalField(max_digits=10, decimal_places=2,  # ✅ was missing
                                                required=False, default=Decimal("0.00"))
    total            = serializers.DecimalField(max_digits=10, decimal_places=2)
    referral_code    = serializers.CharField(required=False, allow_blank=True,
                                             help_text="Optional referral code (will be uppercased)")
    vendor_is_nearby = serializers.BooleanField(required=False, default=False)  # ✅ was missing



class PaystackInitializeRequestSerializer(serializers.Serializer):
    """POST /order/payment/initialize/"""
    order_id     = serializers.IntegerField()
    email        = serializers.EmailField()
    amount       = serializers.IntegerField(help_text="Amount in kobo (naira × 100)")
    callback_url = serializers.URLField(help_text="URL Paystack redirects to after payment")


class CancelOrderRequestSerializer(serializers.Serializer):
    """POST /order/<order_id>/cancel/"""
    # order_id comes from the URL; no body required
    pass


class PackOrderRequestSerializer(serializers.Serializer):
    """POST /order/pack/"""
    order_id = serializers.IntegerField()


class AcceptDeliveryRequestSerializer(serializers.Serializer):
    """POST /order/delivery/accept/"""
    unique_code  = serializers.CharField(help_text="Delivery opportunity code sent to the rider")
    # rider_name   = serializers.CharField()
    # rider_phone  = serializers.CharField()
    pickup_time  = serializers.CharField(default="ASAP", required=False)


class ConfirmDeliveryRequestSerializer(serializers.Serializer):
    """POST /order/delivery/confirm/"""
    delivery_confirmation_code = serializers.CharField(
        help_text="Code sent to the rider after accepting the delivery"
    )


class CustomerConfirmationRequestSerializer(serializers.Serializer):
    """POST /order/delivery/customer-confirm/"""
    customer_confirmation_code = serializers.CharField(
        help_text="Code sent to the customer after rider confirms delivery"
    )


# ─────────────────────────────────────────────
# NESTED / SHARED RESPONSE SERIALIZERS
# ─────────────────────────────────────────────

class TransactionResponseSerializer(serializers.Serializer):
    transaction_id = serializers.CharField()
    amount         = serializers.DecimalField(max_digits=10, decimal_places=2)
    status         = serializers.CharField()
    payment_method = serializers.CharField(allow_null=True)
    created_at     = serializers.DateTimeField()


class OrderItemProductSerializer(serializers.Serializer):
    id    = serializers.IntegerField()
    name  = serializers.CharField()
    image = serializers.CharField(allow_null=True)


class OrderItemResponseSerializer(serializers.Serializer):
    id       = serializers.IntegerField()
    product  = OrderItemProductSerializer()
    quantity = serializers.IntegerField()
    price    = serializers.FloatField()
    size     = serializers.CharField(allow_null=True)
    color    = serializers.CharField(allow_null=True)
    vendor   = serializers.CharField(allow_null=True,
                                     help_text="Vendor username or business name")
    vendor_id = serializers.IntegerField(allow_null=True, required=False)


class PickerInfoSerializer(serializers.Serializer):
    user_id    = serializers.IntegerField()
    profile_id = serializers.IntegerField()
    name       = serializers.CharField()
    type       = serializers.ChoiceField(choices=["picker", "student_picker"])
    rating     = serializers.FloatField()
    # picker-only fields
    fleet_type  = serializers.CharField(required=False, allow_null=True)
    # student_picker-only fields
    hostel_name = serializers.CharField(required=False, allow_null=True)
    room_number = serializers.CharField(required=False, allow_null=True)


class ShippingInfoSerializer(serializers.Serializer):
    first_name  = serializers.CharField()
    last_name   = serializers.CharField()
    email       = serializers.EmailField()
    phone       = serializers.CharField()
    address     = serializers.CharField()
    room_number = serializers.CharField(allow_null=True)


# ─────────────────────────────────────────────
# TOP-LEVEL RESPONSE SERIALIZERS
# ─────────────────────────────────────────────

class CreateOrderResponseSerializer(serializers.Serializer):
    """201 — POST /order/create/"""
    order_id              = serializers.IntegerField()
    order_number          = serializers.CharField()
    message               = serializers.CharField()
    referral_code_applied = serializers.CharField(required=False, allow_null=True,
                                                  help_text="Present only when a referral code was supplied")


class PaystackInitializeResponseSerializer(serializers.Serializer):
    """200 — POST /order/payment/initialize/"""
    status               = serializers.ChoiceField(choices=["success", "failed"])
    authorization_url    = serializers.URLField(help_text="Redirect the user here to complete payment")
    reference            = serializers.CharField()
    delivery_institution = serializers.CharField(help_text="Institution all vendors belong to")


class PaystackVerifyResponseSerializer(serializers.Serializer):
    """200 — GET /order/payment/verify/?reference=<ref>&cart_code=<code>"""
    status       = serializers.ChoiceField(choices=["success", "failed"])
    message      = serializers.CharField()
    order_number = serializers.CharField()


class CancelOrderResponseSerializer(serializers.Serializer):
    """200 — POST /order/<order_id>/cancel/"""
    status       = serializers.ChoiceField(choices=["success", "error"])
    message      = serializers.CharField()
    order_number = serializers.CharField(required=False)


class OrderDetailResponseSerializer(serializers.Serializer):
    """200 — GET /order/<order_number>/"""
    id           = serializers.IntegerField()
    order_number = serializers.CharField()
    first_name   = serializers.CharField()
    last_name    = serializers.CharField()
    email        = serializers.EmailField()
    phone        = serializers.CharField()
    address      = serializers.CharField()
    room_number  = serializers.CharField(allow_null=True)
    subtotal     = serializers.FloatField()
    shipping_fee = serializers.FloatField()
    tax          = serializers.FloatField()
    total        = serializers.FloatField()
    order_status = serializers.ChoiceField(
        choices=["PENDING", "PAID", "PACKED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"]
    )
    created_at   = serializers.DateTimeField()
    order_items  = OrderItemResponseSerializer(many=True)
    transaction  = TransactionResponseSerializer(allow_null=True)


class OrderHistoryItemSerializer(serializers.Serializer):
    """One entry in the order history list"""
    id           = serializers.IntegerField()
    order_number = serializers.CharField()
    subtotal     = serializers.FloatField()
    shipping_fee = serializers.FloatField()
    tax          = serializers.FloatField()
    total        = serializers.FloatField()
    order_status = serializers.ChoiceField(
        choices=["PENDING", "PAID", "PACKED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"]
    )
    created_at   = serializers.CharField(help_text="ISO-8601 datetime string")
    reviewed     = serializers.BooleanField()
    order_items  = OrderItemResponseSerializer(many=True)
    picker       = PickerInfoSerializer(allow_null=True)
    shipping     = ShippingInfoSerializer()


class PackOrderResponseSerializer(serializers.Serializer):
    """200 — POST /order/pack/"""
    message          = serializers.CharField()
    order_id         = serializers.IntegerField()
    all_packed       = serializers.BooleanField()
    vendor_packed    = serializers.CharField(help_text="Business name of the vendor who just packed")
    packed_vendors   = serializers.ListField(
        child=serializers.CharField(), required=False,
        help_text="Business names of vendors who have packed (present when all_packed=False)"
    )
    unpacked_vendors = serializers.ListField(
        child=serializers.CharField(), required=False,
        help_text="Business names of vendors yet to pack (present when all_packed=False)"
    )


class DeliveryOpportunityOrderSerializer(serializers.Serializer):
    order_number     = serializers.CharField()
    created_at       = serializers.DateTimeField()
    vendors          = serializers.ListField(child=serializers.CharField())
    pickup_location  = serializers.CharField()
    delivery_address = serializers.CharField()
    room_number      = serializers.CharField()
    customer_name    = serializers.CharField()
    customer_phone   = serializers.CharField()
    total_amount     = serializers.FloatField()


class DeliveryOpportunityPickerSerializer(serializers.Serializer):
    type = serializers.CharField()
    name = serializers.CharField()


class AcceptDeliveryGetResponseSerializer(serializers.Serializer):
    """200 — GET /order/delivery/accept/<unique_code>/"""
    opportunity_code = serializers.CharField()
    can_accept       = serializers.BooleanField()
    status           = serializers.CharField()
    expires_at       = serializers.DateTimeField()
    order            = DeliveryOpportunityOrderSerializer()
    picker_info      = DeliveryOpportunityPickerSerializer()


class AcceptDeliveryPostResponseSerializer(serializers.Serializer):
    """200 — POST /order/delivery/accept/"""
    success                        = serializers.BooleanField()
    message                        = serializers.CharField()
    order_number                   = serializers.CharField()
    pickup_time                    = serializers.CharField()
    rider_name                     = serializers.CharField()
    rider_phone                    = serializers.CharField()
    is_company_rider               = serializers.BooleanField()
    other_opportunities_cancelled  = serializers.IntegerField()
    delivery_confirmation_code     = serializers.CharField(
        help_text="Rider must submit this code after delivering the order"
    )


class RiderInfoSerializer(serializers.Serializer):
    name        = serializers.CharField()
    phone       = serializers.CharField()
    pickup_time = serializers.CharField()
    accepted_at = serializers.DateTimeField()


class ConfirmDeliveryGetResponseSerializer(serializers.Serializer):
    """200 — GET /order/delivery/confirm/<delivery_confirmation_code>/"""
    delivery_confirmation_code = serializers.CharField()
    can_confirm                = serializers.BooleanField()
    opportunity_status         = serializers.CharField()
    order_status               = serializers.CharField()
    order                      = serializers.DictField()
    rider_info                 = RiderInfoSerializer()


class ConfirmDeliveryPostResponseSerializer(serializers.Serializer):
    """200 — POST /order/delivery/confirm/"""
    success                    = serializers.BooleanField()
    message                    = serializers.CharField()
    order_number               = serializers.CharField()
    delivered_at               = serializers.DateTimeField()
    customer_confirmation_code = serializers.CharField(
        help_text="Customer must submit this code to trigger vendor/picker payouts"
    )


class VendorTransferResultSerializer(serializers.Serializer):
    vendor_id     = serializers.IntegerField()
    vendor_name   = serializers.CharField()
    vendor_email  = serializers.EmailField()
    gross_amount  = serializers.FloatField()
    platform_fee  = serializers.FloatField()
    net_amount    = serializers.FloatField()
    success       = serializers.BooleanField()
    reference     = serializers.CharField(required=False)
    transfer_code = serializers.CharField(required=False)
    error         = serializers.CharField(required=False)


class PickerTransferResultSerializer(serializers.Serializer):
    picker_email  = serializers.EmailField()
    picker_name   = serializers.CharField()
    picker_type   = serializers.CharField()
    gross_amount  = serializers.FloatField()
    platform_fee  = serializers.FloatField()
    net_amount    = serializers.FloatField()
    success       = serializers.BooleanField()
    reference     = serializers.CharField(required=False)
    transfer_code = serializers.CharField(required=False)
    error         = serializers.CharField(required=False)


class CompanyRiderTransferResultSerializer(serializers.Serializer):
    rider_name    = serializers.CharField()
    company_name  = serializers.CharField()
    gross_amount  = serializers.FloatField()
    commission    = serializers.FloatField()
    net_amount    = serializers.FloatField()
    success       = serializers.BooleanField()
    note          = serializers.CharField()


class TransferResultsSerializer(serializers.Serializer):
    vendor_transfers       = VendorTransferResultSerializer(many=True)
    picker_transfer        = PickerTransferResultSerializer(allow_null=True)
    company_rider_transfer = CompanyRiderTransferResultSerializer(allow_null=True)
    stumart_earnings       = serializers.FloatField()


class CustomerConfirmationGetResponseSerializer(serializers.Serializer):
    """200 — GET /order/delivery/customer-confirm/<customer_confirmation_code>/"""
    customer_confirmation_code = serializers.CharField()
    can_confirm                = serializers.BooleanField()
    opportunity_status         = serializers.CharField()
    order_status               = serializers.CharField()
    already_confirmed          = serializers.BooleanField()
    delivered_at               = serializers.DateTimeField(allow_null=True)
    order                      = serializers.DictField()
    rider_info                 = RiderInfoSerializer()


class CustomerConfirmationPostResponseSerializer(serializers.Serializer):
    """200 — POST /order/delivery/customer-confirm/"""
    success          = serializers.BooleanField()
    message          = serializers.CharField()
    order_number     = serializers.CharField()
    confirmed_at     = serializers.DateTimeField()
    transfer_results = TransferResultsSerializer()