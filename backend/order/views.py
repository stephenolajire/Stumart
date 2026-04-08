import json
import logging
import uuid
from datetime import timedelta
from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction
from django.utils.timezone import now
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from stumart.models import Cart, CartItem, Order, OrderItem, Transaction
from user.models import User, Vendor

from wallet.models import DeliveryOpportunity
from .serializers import (
    AcceptDeliveryGetResponseSerializer,
    AcceptDeliveryPostResponseSerializer,
    AcceptDeliveryRequestSerializer,
    CancelOrderResponseSerializer,
    ConfirmDeliveryGetResponseSerializer,
    ConfirmDeliveryPostResponseSerializer,
    ConfirmDeliveryRequestSerializer,
    CreateOrderRequestSerializer,
    CreateOrderResponseSerializer,
    CustomerConfirmationGetResponseSerializer,
    CustomerConfirmationPostResponseSerializer,
    CustomerConfirmationRequestSerializer,
    OrderDetailResponseSerializer,
    OrderHistoryItemSerializer,
    PackOrderRequestSerializer,
    PackOrderResponseSerializer,
    PaystackInitializeRequestSerializer,
    PaystackInitializeResponseSerializer,
    PaystackVerifyResponseSerializer,
)
from .utils import (
    deduct_inventory,
    generate_customer_confirmation_code,
    generate_delivery_confirmation_code,
    generate_delivery_opportunity_code,
    process_automated_transfers,
    restore_inventory,
    send_admin_delivery_completed_email,
    send_admin_notifications,               # ← was imported but never used
    send_admin_transfer_summary_email,
    send_cancellation_emails,
    send_cancelled_riders_emails,
    send_company_rider_opportunity_emails,
    send_customer_delivery_accepted_email,
    send_customer_delivery_completed_email,
    send_customer_order_completed_email,
    send_customer_receipt_email,
    send_out_of_stock_emails,
    send_packing_status_email,
    send_picker_payout_email,
    send_regular_picker_opportunity_emails,
    send_rider_confirmation_link_email,
    send_vendor_order_emails,
    send_vendor_payout_email,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# SHARED PICKER ROUTING UTILITY
# ─────────────────────────────────────────────────────────────

def _dispatch_delivery_opportunities(order: Order, vendor: Vendor) -> None:
    """
    Replaced with multi-vendor aware dispatch.
    'vendor' param kept for signature compatibility but we now fetch ALL vendors on the order.
    """
    _dispatch_multi_vendor(order)


def _dispatch_multi_vendor(order: Order) -> None:
    """
    For each vendor in the order, determine the best picker.

    vendor_is_nearby=True:
        - Find student pickers at the institution who have ALL order vendors
          in preferred_vendors → assign them the whole order.
        - If none cover all vendors, find per-vendor student pickers.
          Vendors not covered by any student picker fall back to
          regular/company pickers. Admin is notified of the split.

    vendor_is_nearby=False:
        - Company riders → regular pickers (existing logic, whole order).
    """
    from stumart.models import OrderItem

    order_items  = list(OrderItem.objects.filter(order=order).select_related("vendor", "vendor__user"))
    order_vendors = list({item.vendor for item in order_items if item.vendor})

    if not order_vendors:
        logger.warning("No vendors found for order %s", order.order_number)
        return

    institution = order_vendors[0].user.institution
    expires_at  = now() + timedelta(hours=24)

    if not order.vendor_is_nearby:
        # ── Non-nearby: company riders → regular pickers (whole order) ────────
        _dispatch_fallback_pickers(order, order_vendors[0], institution, expires_at)
        return

    # ── Nearby: student picker path ───────────────────────────────────────────
    vendor_ids = [v.id for v in order_vendors]

    # 1. Find student pickers who cover ALL vendors in this order
    full_coverage_pickers = User.objects.filter(
        user_type="student_picker",
        institution=institution,
        is_active=True,
        student_picker_profile__is_available=True,
    )
    for vid in vendor_ids:
        full_coverage_pickers = full_coverage_pickers.filter(
            student_picker_profile__preferred_vendors__id=vid
        )
    full_coverage_pickers = full_coverage_pickers.distinct()

    if full_coverage_pickers.exists():
        # Perfect — one group of pickers handles everything
        logger.info(
            "Found %d student picker(s) covering all %d vendors for order %s",
            full_coverage_pickers.count(), len(order_vendors), order.order_number,
        )
        _bulk_create_and_notify(
            order=order,
            pickers=full_coverage_pickers,
            picker_type="student_picker",
            expires_at=expires_at,
            rider_type="regular",
            vendor=order_vendors[0],
        )
        return

    # 2. No single picker covers all vendors — do per-vendor matching
    logger.info(
        "No student picker covers all vendors for order %s — doing per-vendor split",
        order.order_number,
    )

    covered_vendors   = {}   # vendor → queryset of student pickers
    uncovered_vendors = []   # vendors with no student picker

    for vendor in order_vendors:
        pickers = User.objects.filter(
            user_type="student_picker",
            institution=institution,
            is_active=True,
            student_picker_profile__is_available=True,
            student_picker_profile__preferred_vendors__id=vendor.id,
        ).distinct()

        if pickers.exists():
            covered_vendors[vendor] = pickers
        else:
            uncovered_vendors.append(vendor)

    # Notify student pickers for vendors they cover
    for vendor, pickers in covered_vendors.items():
        _bulk_create_and_notify(
            order=order,
            pickers=pickers,
            picker_type="student_picker",
            expires_at=expires_at,
            rider_type="regular",
            vendor=vendor,
        )

    # Fall back to regular/company pickers for uncovered vendors
    for vendor in uncovered_vendors:
        _dispatch_fallback_pickers(order, vendor, institution, expires_at)

    # Notify admin of the split if there's a mix
    if covered_vendors and uncovered_vendors:
        from order.utils import send_admin_split_dispatch_email
        try:
            send_admin_split_dispatch_email(
                order=order,
                covered_vendors=list(covered_vendors.keys()),
                uncovered_vendors=uncovered_vendors,
            )
        except Exception:
            logger.exception("Failed to send admin split-dispatch email for order %s", order.order_number)

    # Warn if nothing was covered at all
    if not covered_vendors and uncovered_vendors:
        logger.info(
            "No student pickers found for any vendor in order %s — fully fell back to regular pickers",
            order.order_number,
        )


def _dispatch_fallback_pickers(order: Order, vendor: Vendor, institution: str, expires_at) -> None:
    """Try company riders first, then regular pickers for a given vendor/institution."""
    company_users = User.objects.filter(
        user_type="company",
        institution=institution,
        is_active=True,
    )

    company_riders = []
    for cu in company_users:
        try:
            company_riders.extend(cu.company_profile.riders.filter(status="active"))
        except AttributeError:
            pass

    if company_riders:
        _bulk_create_and_notify(
            order=order,
            pickers=company_riders,
            picker_type="company_rider",
            expires_at=expires_at,
            rider_type="company",
            vendor=vendor,
        )
        return

    regular_pickers = User.objects.filter(
        user_type="picker",
        institution=institution,
        is_active=True,
    )
    if regular_pickers.exists():
        _bulk_create_and_notify(
            order=order,
            pickers=regular_pickers,
            picker_type="regular_picker",
            expires_at=expires_at,
            rider_type="regular",
            vendor=vendor,
        )
    else:
        logger.warning(
            "No fallback pickers found for vendor %s in institution %s for order %s",
            vendor.business_name, institution, order.order_number,
        )


def _bulk_create_and_notify(order, pickers, picker_type, expires_at, rider_type, vendor):
    """Create DeliveryOpportunity rows in bulk then send emails."""
    opportunities    = []
    notification_data = []

    for picker in pickers:
        prefix = f"CR_{picker.id}" if rider_type == "company" else f"UP_{picker.id}"
        code   = generate_delivery_opportunity_code(order.id, prefix)

        opp_kwargs = dict(
            order=order,
            unique_code=code,
            expires_at=expires_at,
            picker_type=picker_type,
        )
        if rider_type == "company":
            opp_kwargs["company_rider"] = picker
        else:
            opp_kwargs["user_picker"] = picker

        opportunities.append(DeliveryOpportunity(**opp_kwargs))
        notification_data.append({
            "rider" if rider_type == "company" else "picker": picker,
            "unique_code": code,
            "acceptance_link": f"{settings.FRONTEND_URL}/accept-delivery/{code}",
        })

    DeliveryOpportunity.objects.bulk_create(opportunities)

    if rider_type == "company":
        send_company_rider_opportunity_emails(order, vendor, notification_data)
    else:
        send_regular_picker_opportunity_emails(order, vendor, notification_data)


# ─────────────────────────────────────────────────────────────
# CREATE ORDER
# ─────────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    """
    POST order/create/

    REQUEST  → CreateOrderRequestSerializer
    RESPONSE → CreateOrderResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        req = CreateOrderRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        data = req.validated_data
        cart_items = CartItem.objects.filter(id__in=data["cart_items"])

        if not cart_items.exists():
            return Response({"error": "No cart items found."}, status=status.HTTP_400_BAD_REQUEST)

        # ── validate: orders must contain at least one actual product (not just gifts) ──
        has_product = cart_items.filter(product__isnull=False).exists()
        if not has_product:
            return Response(
                {
                    "error": "Your cart contains only gift items. Please add at least one product to create an order.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validation_error = self._validate_cart_categories(cart_items)
        if validation_error:
            return Response({"error": validation_error}, status=status.HTTP_400_BAD_REQUEST)

        referral_code = data.get("referral_code", "").upper() or None
        vendor_is_nearby = data.get("vendor_is_nearby", False)

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=request.user,
                    first_name=data["first_name"],
                    last_name=data["last_name"],
                    email=data["email"],
                    phone=data["phone"],
                    address=data["address"],
                    room_number=data.get("room_number"),
                    subtotal=data["subtotal"],
                    shipping_fee=data["shipping_fee"],
                    tax=data["tax"],
                    takeaway=data.get("takeaway", Decimal("0.00")),  # ✅ was missing
                    total=data["total"],
                    order_status="PENDING",
                    order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
                    referral_code=referral_code,
                    vendor_is_nearby=data.get("vendor_is_nearby", False),  # ✅ was missing
                )

                for cart_item in cart_items:
                    # Skip gift items - only create OrderItems for actual products
                    if not cart_item.product:
                        continue
                    
                    vendor_instance = Vendor.objects.filter(user=cart_item.product.vendor).first()
                    if not vendor_instance:
                        return Response(
                            {"error": f"No vendor profile for {cart_item.product.vendor.email}"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price=cart_item.product.price,
                        vendor=vendor_instance,
                        color=cart_item.color,
                        size=cart_item.size,
                    )

            response_data = {
                "order_id": order.id,
                "order_number": order.order_number,
                "message": "Order created successfully. Proceed to payment.",
                "referral_code_applied": referral_code,
            }
            return Response(
                CreateOrderResponseSerializer(response_data).data,
                status=status.HTTP_201_CREATED,
            )

        except Exception:
            logger.exception("Error creating order")
            return Response({"error": "An error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @staticmethod
    def _validate_cart_categories(cart_items):
        has_food = has_non_food = False
        for item in cart_items:
            # Skip gift items - only validate product categories
            if not item.product:
                continue
            
            vendor = Vendor.objects.filter(user=item.product.vendor).first()
            if not vendor:
                continue
            if vendor.business_category == "food":
                has_food = True
            else:
                has_non_food = True
        if has_food and has_non_food:
            return "Food items cannot be ordered together with other categories. Please place separate orders."
        return None


# ─────────────────────────────────────────────────────────────
# PAYMENT — INITIALIZE
# ─────────────────────────────────────────────────────────────

class PaystackPaymentInitializeView(APIView):
    """
    POST order/payment/initialize/

    REQUEST  → PaystackInitializeRequestSerializer
    RESPONSE → PaystackInitializeResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        req = PaystackInitializeRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        data = req.validated_data

        try:
            order = Order.objects.get(id=data["order_id"])
        except Order.DoesNotExist:
            return Response({"status": "failed", "message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        order_items = OrderItem.objects.filter(order=order).select_related("vendor", "vendor__user")
        if not order_items.exists():
            return Response({"status": "failed", "message": "No items found in the order."}, status=status.HTTP_400_BAD_REQUEST)

        institutions = {item.vendor.user.institution for item in order_items}
        if len(institutions) > 1:
            vendors_by_inst = {}
            for item in order_items:
                inst = item.vendor.user.institution
                vendors_by_inst.setdefault(inst, []).append(
                    {"vendor_name": item.vendor.business_name, "product_name": item.product.name}
                )
            return Response(
                {
                    "status": "failed",
                    "message": "All vendors must be from the same institution.",
                    "error_details": {
                        "multiple_institutions_found": list(institutions),
                        "vendors_by_institution": vendors_by_inst,
                        "suggestion": "Split your order by institution.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = {
            "email": data["email"],
            "amount": data["amount"],
            "callback_url": data["callback_url"],
            "reference": f"ORD-{order.order_number}-{uuid.uuid4().hex[:8]}",
        }
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        try:
            ps_response = requests.post(
                "https://api.paystack.co/transaction/initialize",
                headers=headers,
                data=json.dumps(payload),
                timeout=30,
            ).json()
        except Exception:
            logger.exception("Paystack API call failed")
            return Response({"status": "failed", "message": "Payment gateway error."}, status=status.HTTP_502_BAD_GATEWAY)

        if not ps_response.get("status"):
            return Response(
                {"status": "failed", "message": ps_response.get("message", "Initialization failed.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Transaction.objects.create(
            order=order,
            transaction_id=ps_response["data"]["reference"],
            amount=order.total,
            status="PENDING",
        )

        return Response(
            PaystackInitializeResponseSerializer({
                "status": "success",
                "authorization_url": ps_response["data"]["authorization_url"],
                "reference": ps_response["data"]["reference"],
                "delivery_institution": list(institutions)[0],
            }).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# PAYMENT — VERIFY
# ─────────────────────────────────────────────────────────────
class PaystackPaymentVerifyView(APIView):
    """
    GET order/payment/verify/?reference=<ref>

    Requires authentication — cart is identified via request.user.
    After successful payment, cart items are cleared (cart record kept).

    RESPONSE → PaystackVerifyResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        reference = request.query_params.get("reference")

        if not reference:
            return Response(
                {"status": "failed", "message": "reference is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        txn = Transaction.objects.filter(transaction_id=reference).first()
        if not txn:
            return Response(
                {"status": "failed", "message": "Transaction not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Already verified — return early ───────────────────────────────────
        if txn.status == "COMPLETED":
            return Response(
                PaystackVerifyResponseSerializer({
                    "status": "success",
                    "message": "Payment already verified.",
                    "order_number": txn.order.order_number,
                }).data
            )

        # ── Call Paystack ──────────────────────────────────────────────────────
        try:
            ps_response = requests.get(
                f"https://api.paystack.co/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
                timeout=30,
            ).json()
        except Exception:
            logger.exception("Paystack verify API call failed")
            return Response(
                {"status": "failed", "message": "Payment gateway error."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if not ps_response.get("status"):
            return Response(
                {"status": "failed", "message": ps_response.get("message", "Verification failed.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ps_response["data"]["status"] != "success":
            txn.status = "FAILED"
            txn.save()
            return Response(
                {"status": "failed", "message": "Payment failed or was cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_number = None

        with transaction.atomic():
            txn_obj = Transaction.objects.select_for_update().get(id=txn.id)

            # ── Double-check inside lock (concurrent request guard) ───────────
            if txn_obj.status == "COMPLETED":
                return Response(
                    PaystackVerifyResponseSerializer({
                        "status": "success",
                        "message": "Payment already verified.",
                        "order_number": txn_obj.order.order_number,
                    }).data
                )

            txn_obj.status = "COMPLETED"
            txn_obj.payment_method = "PAYSTACK"
            txn_obj.save()

            order = txn_obj.order
            if order.order_status != "PAID":
                order.order_status = "PAID"
                order.save()

            order_items = list(
                OrderItem.objects.filter(order=order).select_related(
                    "product", "vendor", "vendor__user"
                )
            )

            # 1. Deduct inventory and notify vendors of out-of-stock items
            vendors_oos = deduct_inventory(order_items)
            transaction.on_commit(lambda: send_out_of_stock_emails(vendors_oos))

            # 2. Notify each vendor of their new order
            transaction.on_commit(lambda: send_vendor_order_emails(order, order_items))

            # 3. Send receipt to the customer
            transaction.on_commit(lambda: send_customer_receipt_email(order, order_items))

            # 4. Notify all admin users
            transaction.on_commit(lambda: send_admin_notifications(order, order_items))

            # 5. Send push / in-app notifications
            from order.util.notifications_utils import send_order_notifications
            transaction.on_commit(lambda: _safe_call(send_order_notifications, order, order_items))

            # 6. Dispatch delivery opportunities to pickers / riders
            first_vendor = order_items[0].vendor if order_items else None
            if first_vendor:
                transaction.on_commit(
                    lambda o=order, v=first_vendor: _safe_call(_dispatch_delivery_opportunities, o, v)
                )

            # 7. Clear the user's cart items so paid products don't reappear.
            #    We DELETE the items but keep the Cart row itself — the user
            #    still has a valid (now empty) cart for their next order.
            try:
                user_cart = Cart.objects.filter(user=request.user).first()
                if user_cart:
                    deleted_count, _ = CartItem.objects.filter(cart=user_cart).delete()
                    logger.info(
                        "Cleared %d cart item(s) for user %s after payment ref=%s",
                        deleted_count,
                        request.user.email,
                        reference,
                    )
                else:
                    logger.warning(
                        "No cart found for user %s after payment ref=%s",
                        request.user.email,
                        reference,
                    )
            except Exception:
                logger.exception(
                    "Failed to clear cart for user %s after payment ref=%s",
                    request.user.email,
                    reference,
                )
                # Non-fatal — payment is already confirmed, don't fail the response

            order_number = order.order_number

        return Response(
            PaystackVerifyResponseSerializer({
                "status": "success",
                "message": "Payment verified successfully.",
                "order_number": order_number,
            }).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# CANCEL ORDER
# ─────────────────────────────────────────────────────────────

class CancelOrderView(APIView):
    """
    POST order/<order_id>/cancel/

    RESPONSE → CancelOrderResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"status": "error", "message": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if order.user != request.user:
            return Response({"status": "error", "message": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        if order.order_status in ("DELIVERED", "CANCELLED"):
            return Response(
                {"status": "error", "message": f"Order cannot be cancelled (status: {order.order_status})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.picker and order.order_status == "IN_TRANSIT":
            return Response(
                {"status": "error", "message": "Order is already in transit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.order_status = "CANCELLED"
        order.save()

        order_items = OrderItem.objects.filter(order=order)
        restore_inventory(order_items)
        send_cancellation_emails(order, order_items)

        return Response(
            CancelOrderResponseSerializer({
                "status": "success",
                "message": "Order cancelled successfully.",
                "order_number": order.order_number,
            }).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# ORDER DETAIL
# ─────────────────────────────────────────────────────────────

class OrderDetailView(APIView):
    """
    GET order/<order_number>/

    RESPONSE → OrderDetailResponseSerializer
    """

    def get(self, request, order_number):
        from django.db.models import Prefetch

        try:
            order = (
                Order.objects
                .select_related("user", "picker")
                .prefetch_related(
                    Prefetch(
                        "order_items",
                        queryset=OrderItem.objects.select_related("product", "vendor", "vendor__user"),
                    )
                )
                .get(order_number=order_number)
            )
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        txn = (
            Transaction.objects.filter(order=order)
            .values("transaction_id", "amount", "status", "payment_method", "created_at")
            .first()
        )

        items_data = [
            {
                "id": item.id,
                "product": {
                    "id": item.product.id,
                    "name": item.product.name,
                    "image": str(item.product.image) if item.product.image else None,
                },
                "quantity": item.quantity,
                "price": float(item.price),
                "size": item.size,
                "color": item.color,
                "vendor": item.vendor.user.username if (item.vendor and item.vendor.user) else None,
            }
            for item in order.order_items.all()
        ]

        data = {
            "id": order.id,
            "order_number": order.order_number,
            "first_name": order.first_name,
            "last_name": order.last_name,
            "email": order.email,
            "phone": order.phone,
            "address": order.address,
            "room_number": order.room_number,
            "subtotal": float(order.subtotal),
            "shipping_fee": float(order.shipping_fee),
            "tax": float(order.tax),
            "total": float(order.total),
            "order_status": order.order_status,
            "created_at": order.created_at,
            "order_items": items_data,
            "transaction": txn,
        }

        return Response(OrderDetailResponseSerializer(data).data)


# ─────────────────────────────────────────────────────────────
# ORDER HISTORY
# ─────────────────────────────────────────────────────────────

class OrderHistoryView(APIView):
    """
    GET order/history/

    RESPONSE → list of OrderHistoryItemSerializer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Prefetch

        orders = (
            Order.objects.filter(user=request.user)
            .select_related("picker")
            .prefetch_related(
                "order_items__product",
                "order_items__vendor",
                "picker__picker_profile",
                "picker__student_picker_profile",
            )
            .order_by("-created_at")
        )

        order_data = []
        for order in orders:
            items_data = []
            for item in order.order_items.all():
                image_url = request.build_absolute_uri(item.product.image.url) if item.product.image else None
                items_data.append({
                    "id": item.id,
                    "product": {"id": item.product.id, "name": item.product.name, "image": image_url},
                    "quantity": item.quantity,
                    "price": float(item.price),
                    "size": item.size,
                    "color": item.color,
                    "vendor": item.vendor.business_name if item.vendor else None,
                    "vendor_id": item.vendor.id if item.vendor else None,
                })

            picker_info = self._build_picker_info(order)

            order_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "subtotal": float(order.subtotal),
                "shipping_fee": float(order.shipping_fee),
                "tax": float(order.tax),
                "total": float(order.total),
                "order_status": order.order_status,
                "created_at": order.created_at.isoformat(),
                "reviewed": order.reviewed,
                "order_items": items_data,
                "picker": picker_info,
                "shipping": {
                    "first_name": order.first_name, "last_name": order.last_name,
                    "email": order.email, "phone": order.phone,
                    "address": order.address, "room_number": order.room_number,
                },
            })

        return Response(OrderHistoryItemSerializer(order_data, many=True).data)

    @staticmethod
    def _build_picker_info(order):
        if not order.picker:
            return None
        picker = order.picker
        name = f"{picker.first_name} {picker.last_name}"
        try:
            if hasattr(picker, "picker_profile"):
                p = picker.picker_profile
                return {"user_id": picker.id, "profile_id": p.id, "name": name, "type": "picker",
                        "fleet_type": p.fleet_type, "rating": float(p.rating)}
            elif hasattr(picker, "student_picker_profile"):
                p = picker.student_picker_profile
                return {"user_id": picker.id, "profile_id": p.id, "name": name, "type": "student_picker",
                        "hostel_name": p.hostel_name, "room_number": p.room_number, "rating": float(p.rating)}
        except Exception:
            logger.exception("Error building picker info for order %s", order.order_number)
        return None


# ─────────────────────────────────────────────────────────────
# PACK ORDER (Vendor marks their items as packed)
# ─────────────────────────────────────────────────────────────

class PackOrderView(APIView):
    """
    POST order/pack/

    REQUEST  → PackOrderRequestSerializer
    RESPONSE → PackOrderResponseSerializer
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req = PackOrderRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        order_id = req.validated_data["order_id"]

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        vendor_items = OrderItem.objects.filter(order_id=order_id, vendor__user=request.user)
        if not vendor_items.exists():
            return Response({"error": "No order items found or unauthorised."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            vendor_items = OrderItem.objects.filter(
                order_id=order_id, vendor__user=request.user
            ).select_for_update()
            order = Order.objects.select_for_update().get(id=order_id)
            vendor_items.update(is_packed=True, packed_at=now())
            current_vendor = vendor_items.first().vendor

        all_packed = not OrderItem.objects.filter(order_id=order_id, is_packed=False).exists()
        packed_vendors = list(Vendor.objects.filter(orderitem__order_id=order_id, orderitem__is_packed=True).distinct())
        unpacked_vendors = list(Vendor.objects.filter(orderitem__order_id=order_id, orderitem__is_packed=False).distinct())

        if all_packed:
            order.packed = True
            order.save()
            transaction.on_commit(lambda: send_packing_status_email(order, all_packed=True))

            already_accepted = DeliveryOpportunity.objects.filter(
                order=order, status="accepted"
            ).exists()
            if not already_accepted:
                transaction.on_commit(
                    lambda o=order, v=current_vendor: _safe_call(_dispatch_delivery_opportunities, o, v)
                )

        else:
            transaction.on_commit(
                lambda: send_packing_status_email(
                    order, all_packed=False,
                    packed_vendors=packed_vendors,
                    unpacked_vendors=unpacked_vendors,
                )
            )

        response_data = {
            "message": (
                "All vendors packed. Order ready for delivery."
                if all_packed
                else f"{current_vendor.business_name} packed. Waiting for other vendors."
            ),
            "order_id": order_id,
            "all_packed": all_packed,
            "vendor_packed": current_vendor.business_name,
            "packed_vendors": [v.business_name for v in packed_vendors],
            "unpacked_vendors": [v.business_name for v in unpacked_vendors],
        }
        return Response(PackOrderResponseSerializer(response_data).data, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────
# ACCEPT DELIVERY
# ─────────────────────────────────────────────────────────────

class AcceptDeliveryView(APIView):
    """
    GET  order/delivery/accept/<unique_code>/  → delivery opportunity details
    POST order/delivery/accept/               → accept the opportunity

    GET  RESPONSE → AcceptDeliveryGetResponseSerializer
    POST RESPONSE → AcceptDeliveryPostResponseSerializer
    """
    permission_classes = [AllowAny]

    def get(self, request, unique_code=None):
        if not unique_code:
            return Response(
                {"error": "unique_code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            opp = DeliveryOpportunity.objects.select_related(
                "order",
                "user_picker",
                "company_rider",
                "company_rider__company",
            ).get(unique_code=unique_code)
        except DeliveryOpportunity.DoesNotExist:
            return Response(
                {"error": "Delivery opportunity not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order        = opp.order
        order_vendors = Vendor.objects.filter(orderitem__order=order).distinct()

        # ✅ Derive picker info from model
        if opp.picker_type == "company_rider" and opp.company_rider:
            picker_name  = opp.company_rider.name
            picker_phone = opp.company_rider.phone
            picker_email = opp.company_rider.email
        elif opp.user_picker:
            picker_name  = f"{opp.user_picker.first_name} {opp.user_picker.last_name}"
            picker_phone = opp.user_picker.phone_number
            picker_email = opp.user_picker.email
        else:
            picker_name  = "Unknown"
            picker_phone = "Unknown"
            picker_email = "Unknown"

        data = {
            "opportunity_code": opp.unique_code,
            "can_accept"      : opp.can_be_accepted(),
            "status"          : opp.status,
            "expires_at"      : opp.expires_at,
            "order": {
                "order_number"    : order.order_number,
                "created_at"      : order.created_at,
                "vendors"         : [v.business_name for v in order_vendors],
                "pickup_location" : order_vendors.first().user.institution if order_vendors.exists() else "N/A",
                "delivery_address": order.address,
                "room_number"     : order.room_number or "Not specified",
                "customer_name"   : f"{order.first_name} {order.last_name}",
                "customer_phone"  : order.phone,
                "total_amount"    : float(order.total),
            },
            "picker_info": {
                "type" : opp.picker_type,
                "name" : picker_name,
                "phone": picker_phone,
                "email": picker_email,
            },
        }
        return Response(AcceptDeliveryGetResponseSerializer(data).data)

    def post(self, request):
        req = AcceptDeliveryRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        data        = req.validated_data
        unique_code = data["unique_code"]
        pickup_time = data.get("pickup_time", "ASAP")

        with transaction.atomic():
            try:
                opp = DeliveryOpportunity.objects.select_for_update().select_related(
                    "order",
                    "user_picker",
                    "company_rider",
                    "company_rider__company",
                ).get(unique_code=unique_code)
            except DeliveryOpportunity.DoesNotExist:
                return Response(
                    {"error": "Delivery opportunity not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not opp.can_be_accepted():
                if opp.status == "accepted":
                    return Response(
                        {"error": "Already accepted by another rider."},
                        status=status.HTTP_409_CONFLICT,
                    )
                return Response(
                    {"error": "Opportunity no longer available."},
                    status=status.HTTP_410_GONE,
                )

            # ✅ Derive rider identity entirely from the model
            if opp.picker_type == "company_rider" and opp.company_rider:
                rider_name  = opp.company_rider.name
                rider_phone = opp.company_rider.phone
                rider_email = opp.company_rider.email
            elif opp.user_picker:
                rider_name  = f"{opp.user_picker.first_name} {opp.user_picker.last_name}"
                rider_phone = opp.user_picker.phone_number
                rider_email = opp.user_picker.email
            else:
                return Response(
                    {"error": "No picker attached to this opportunity."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order     = opp.order
            conf_code = generate_delivery_confirmation_code(order.id)

            # Update opportunity
            opp.status                     = "accepted"
            opp.accepted_at                = now()
            opp.accepted_rider_name        = rider_name
            opp.accepted_rider_phone       = rider_phone
            opp.pickup_time                = pickup_time
            opp.delivery_confirmation_code = conf_code
            opp.save()

            # Update order
            if opp.picker_type == "company_rider":
                order.company_picker       = True
                order.company_picker_email = rider_email
                order.picker               = None
            else:
                order.company_picker       = False
                order.company_picker_email = None
                order.picker               = opp.user_picker

            order.order_status = "IN_TRANSIT"
            order.save()

            # Cancel all other pending opportunities for this order
            cancelled_qs = (
                DeliveryOpportunity.objects
                .filter(order=order, status="pending")
                .exclude(id=opp.id)
            )
            cancelled_count = cancelled_qs.count()
            cancelled_qs.update(status="cancelled", accepted_at=now())

            # ✅ Capture loop variables explicitly to avoid lambda closure bugs
            transaction.on_commit(
                lambda o=order, rn=rider_name, rp=rider_phone, pt=pickup_time:
                    send_customer_delivery_accepted_email(o, rn, rp, pt)
            )
            transaction.on_commit(
                lambda o=order, op=opp, rn=rider_name, rp=rider_phone, cc=conf_code:
                    send_rider_confirmation_link_email(o, op, rn, rp, cc)
            )
            # transaction.on_commit(
            #     lambda o=order, op=opp:
            #         send_admin_delivery_accepted_email(o, op, op.accepted_rider_name, op.accepted_rider_phone, op.pickup_time)
            # )
            if cancelled_count > 0:
                transaction.on_commit(
                    lambda o=order, op=opp: send_cancelled_riders_emails(o, op)
                )

        return Response(
            AcceptDeliveryPostResponseSerializer({
                "success"                      : True,
                "message"                      : f"Delivery accepted by {rider_name}.",
                "order_number"                 : order.order_number,
                "pickup_time"                  : pickup_time,
                "rider_name"                   : rider_name,
                "rider_phone"                  : rider_phone,
                "is_company_rider"             : opp.picker_type == "company_rider",
                "other_opportunities_cancelled": cancelled_count,
                "delivery_confirmation_code"   : conf_code,
            }).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# CONFIRM DELIVERY (Rider confirms handover)
# ─────────────────────────────────────────────────────────────

class ConfirmDeliveryView(APIView):
    """
    GET  order/delivery/confirm/<delivery_confirmation_code>/  → delivery details
    POST order/delivery/confirm/                               → confirm delivery

    GET  RESPONSE → ConfirmDeliveryGetResponseSerializer
    POST RESPONSE → ConfirmDeliveryPostResponseSerializer
    """
    permission_classes = [AllowAny]

    def get(self, request, delivery_confirmation_code=None):
        if not delivery_confirmation_code:
            return Response({"error": "delivery_confirmation_code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            opp = DeliveryOpportunity.objects.get(delivery_confirmation_code=delivery_confirmation_code)
        except DeliveryOpportunity.DoesNotExist:
            return Response({"error": "Invalid confirmation code."}, status=status.HTTP_404_NOT_FOUND)

        order = opp.order
        data = {
            "delivery_confirmation_code": delivery_confirmation_code,
            "can_confirm": opp.status == "accepted" and order.order_status != "DELIVERED",
            "opportunity_status": opp.status,
            "order_status": order.order_status,
            "order": {
                "order_number": order.order_number,
                "customer_name": f"{order.first_name} {order.last_name}",
                "customer_phone": order.phone,
                "delivery_address": order.address,
                "room_number": order.room_number or "Not specified",
                "total_amount": float(order.total),
                "created_at": order.created_at,
            },
            "rider_info": {
                "name": opp.accepted_rider_name,
                "phone": opp.accepted_rider_phone,
                "pickup_time": opp.pickup_time,
                "accepted_at": opp.accepted_at,
            },
        }
        return Response(ConfirmDeliveryGetResponseSerializer(data).data)

    def post(self, request):
        req = ConfirmDeliveryRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        conf_code = req.validated_data["delivery_confirmation_code"]

        with transaction.atomic():
            try:
                opp = DeliveryOpportunity.objects.select_for_update().get(delivery_confirmation_code=conf_code)
            except DeliveryOpportunity.DoesNotExist:
                return Response({"error": "Invalid confirmation code."}, status=status.HTTP_404_NOT_FOUND)

            if opp.status != "accepted":
                return Response({"error": f"Opportunity status is '{opp.status}', not 'accepted'."}, status=status.HTTP_400_BAD_REQUEST)

            order = opp.order
            if order.order_status == "DELIVERED":
                return Response({"error": "Order already marked as delivered."}, status=status.HTTP_409_CONFLICT)

            order.order_status = "DELIVERED"
            order.save()

            cust_code = generate_customer_confirmation_code(order.id)
            opp.status = "completed"
            opp.delivered_at = now()
            opp.customer_confirmation_code = cust_code
            opp.save()

            transaction.on_commit(lambda: send_customer_delivery_completed_email(order, opp, cust_code))
            transaction.on_commit(lambda: send_admin_delivery_completed_email(order, opp))

        return Response(
            ConfirmDeliveryPostResponseSerializer({
                "success": True,
                "message": "Delivery confirmed successfully.",
                "order_number": order.order_number,
                "delivered_at": opp.delivered_at,
                "customer_confirmation_code": cust_code,
            }).data,
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────
# CUSTOMER CONFIRMATION (triggers payouts)
# ─────────────────────────────────────────────────────────────

class CustomerConfirmationView(APIView):
    """
    GET  order/delivery/customer-confirm/<customer_confirmation_code>/  → order details
    POST order/delivery/customer-confirm/                               → confirm receipt & trigger payouts

    GET  RESPONSE → CustomerConfirmationGetResponseSerializer
    POST RESPONSE → CustomerConfirmationPostResponseSerializer
    """
    permission_classes = [AllowAny]

    def get(self, request, customer_confirmation_code=None):
        if not customer_confirmation_code:
            return Response({"error": "customer_confirmation_code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            opp = DeliveryOpportunity.objects.get(customer_confirmation_code=customer_confirmation_code)
        except DeliveryOpportunity.DoesNotExist:
            return Response({"error": "Invalid confirmation code."}, status=status.HTTP_404_NOT_FOUND)

        order = opp.order
        data = {
            "customer_confirmation_code": customer_confirmation_code,
            "can_confirm": opp.status == "completed" and order.order_status == "DELIVERED" and not order.confirm,
            "opportunity_status": opp.status,
            "order_status": order.order_status,
            "already_confirmed": order.confirm,
            "delivered_at": getattr(opp, "delivered_at", None),
            "order": {
                "order_number": order.order_number,
                "customer_name": f"{order.first_name} {order.last_name}",
                "customer_phone": order.phone,
                "delivery_address": order.address,
                "room_number": order.room_number or "Not specified",
                "total_amount": float(order.total),
                "shipping_fee": float(order.shipping_fee),
                "created_at": order.created_at,
            },
            "rider_info": {
                "name": opp.accepted_rider_name,
                "phone": opp.accepted_rider_phone,
                "pickup_time": opp.pickup_time,
                "accepted_at": opp.accepted_at,
            },
        }
        return Response(CustomerConfirmationGetResponseSerializer(data).data)

    def post(self, request):
        req = CustomerConfirmationRequestSerializer(data=request.data)
        if not req.is_valid():
            return Response(req.errors, status=status.HTTP_400_BAD_REQUEST)

        cust_code = req.validated_data["customer_confirmation_code"]

        with transaction.atomic():
            try:
                opp = DeliveryOpportunity.objects.select_for_update().get(customer_confirmation_code=cust_code)
            except DeliveryOpportunity.DoesNotExist:
                return Response({"error": "Invalid confirmation code."}, status=status.HTTP_404_NOT_FOUND)

            if opp.status != "completed":
                return Response({"error": "Delivery not yet confirmed by rider."}, status=status.HTTP_400_BAD_REQUEST)

            order = opp.order
            if order.order_status == "COMPLETED":
                return Response({"error": "Order already confirmed."}, status=status.HTTP_409_CONFLICT)

            order.order_status = "COMPLETED"
            order.confirm = True
            order.save()

            transfer_results = process_automated_transfers(order, opp)

            transaction.on_commit(lambda: send_customer_order_completed_email(order, opp))
            transaction.on_commit(lambda: self._send_payout_notifications(order, opp, transfer_results))

        return Response(
            CustomerConfirmationPostResponseSerializer({
                "success": True,
                "message": "Order confirmed. Transfers initiated.",
                "order_number": order.order_number,
                "confirmed_at": now(),
                "transfer_results": transfer_results,
            }).data,
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _send_payout_notifications(order, opp, transfer_results):
        for vt in transfer_results.get("vendor_transfers", []):
            send_vendor_payout_email(order, vt)
        pt = transfer_results.get("picker_transfer")
        if pt:
            send_picker_payout_email(order, pt)
        send_admin_transfer_summary_email(order, opp, transfer_results)


# ─────────────────────────────────────────────────────────────
# INTERNAL HELPERS
# ─────────────────────────────────────────────────────────────

def _safe_call(fn, *args, **kwargs):
    """Call fn(*args, **kwargs) and swallow exceptions so on_commit doesn't crash."""
    try:
        fn(*args, **kwargs)
    except Exception:
        logger.exception("Error in on_commit callback %s", fn.__name__)


# ─────────────────────────────────────────────────────────────
# PAYMENT — PAY WITH WALLET (Referral Earnings)
# ─────────────────────────────────────────────────────────────

from referral.models import Referral, PayoutHistory  # adjust app name if different

class WalletPaymentView(APIView):
    """
    POST order/payment/wallet/

    Settles an order using the user's referral wallet (current period earnings).
    Validates that the order total matches the available balance exactly.

    REQUEST BODY:
        order_id   int   (required)

    RESPONSE 200 → { status, message, order_number, amount_deducted, remaining_balance }
    RESPONSE 400 → { status, message }  — validation failures
    RESPONSE 404 → { status, message }  — order or wallet not found
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response(
                {"status": "failed", "message": "order_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"status": "failed", "message": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Guard: only PENDING orders can be paid ────────────────────────────
        if order.order_status != "PENDING":
            return Response(
                {
                    "status": "failed",
                    "message": f"Order cannot be paid (current status: {order.order_status}).",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Guard: no double-payment ──────────────────────────────────────────
        if Transaction.objects.filter(order=order, status="COMPLETED").exists():
            return Response(
                {"status": "failed", "message": "This order has already been paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Fetch wallet ──────────────────────────────────────────────────────
        try:
            referral = Referral.objects.get(user=request.user, is_active=True)
        except Referral.DoesNotExist:
            return Response(
                {
                    "status": "failed",
                    "message": "You don't have an active referral wallet.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Sync earnings from completed orders before checking balance ───────
        referral.update_stats()
        referral.refresh_from_db()

        wallet_balance = referral.total_earnings
        order_total    = order.total

        # ── Validate: balance must exactly match or exceed order total ────────
        if wallet_balance < order_total:
            return Response(
                {
                    "status": "failed",
                    "message": (
                        f"Insufficient wallet balance. "
                        f"Order total is ₦{order_total:,.0f} but your wallet has ₦{wallet_balance:,.0f}."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_items = list(
            OrderItem.objects.filter(order=order).select_related(
                "product", "vendor", "vendor__user"
            )
        )

        if not order_items:
            return Response(
                {"status": "failed", "message": "No items found in this order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Re-fetch referral inside lock to prevent race conditions
            referral = Referral.objects.select_for_update().get(id=referral.id)

            # Double-check balance inside the lock
            if referral.total_earnings < order_total:
                return Response(
                    {"status": "failed", "message": "Insufficient wallet balance."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ── Deduct from wallet ────────────────────────────────────────────
            period_start = referral.last_reset_date or referral.created_at
            period_end   = now()

            referral.total_earnings  -= order_total
            referral.total_referrals  = max(0, int(referral.total_earnings) // 200)
            referral.total_paid_out  += order_total
            referral.last_payout_amount = order_total
            referral.last_payout_date   = period_end
            referral.save(update_fields=[
                "total_earnings",
                "total_referrals",
                "total_paid_out",
                "last_payout_amount",
                "last_payout_date",
            ])

            # ── Record payout history ─────────────────────────────────────────
            PayoutHistory.objects.create(
                referral=referral,
                amount=order_total,
                referral_count=int(order_total) // 200,
                period_start=period_start,
                period_end=period_end,
                email_sent=False,
                notes=f"Wallet payment for order {order.order_number}",
            )

            # ── Record transaction ────────────────────────────────────────────
            wallet_ref = f"WALLET-{order.order_number}-{uuid.uuid4().hex[:8].upper()}"
            Transaction.objects.create(
                order=order,
                transaction_id=wallet_ref,
                amount=order_total,
                status="COMPLETED",
                payment_method="WALLET",
            )

            # ── Mark order as paid ────────────────────────────────────────────
            order.order_status = "PAID"
            order.save()

            # ── Post-payment pipeline (same as Paystack verify) ───────────────
            vendors_oos = deduct_inventory(order_items)
            transaction.on_commit(lambda: send_out_of_stock_emails(vendors_oos))
            transaction.on_commit(lambda: send_vendor_order_emails(order, order_items))
            transaction.on_commit(lambda: send_customer_receipt_email(order, order_items))
            transaction.on_commit(lambda: send_admin_notifications(order, order_items))

            from order.util.notifications_utils import send_order_notifications
            transaction.on_commit(
                lambda: _safe_call(send_order_notifications, order, order_items)
            )

            first_vendor = order_items[0].vendor if order_items else None
            if first_vendor:
                transaction.on_commit(
                    lambda o=order, v=first_vendor: _safe_call(_dispatch_delivery_opportunities, o, v)
                )

            # ── Clear cart ────────────────────────────────────────────────────
            try:
                user_cart = Cart.objects.filter(user=request.user).first()
                if user_cart:
                    deleted_count, _ = CartItem.objects.filter(cart=user_cart).delete()
                    logger.info(
                        "Cleared %d cart item(s) for user %s after wallet payment ref=%s",
                        deleted_count, request.user.email, wallet_ref,
                    )
            except Exception:
                logger.exception(
                    "Failed to clear cart for user %s after wallet payment ref=%s",
                    request.user.email, wallet_ref,
                )

        return Response(
            {
                "status": "success",
                "message": "Payment successful. Your order is being processed.",
                "order_number": order.order_number,
                "amount_deducted": float(order_total),
                "remaining_balance": float(referral.total_earnings),
                "transaction_reference": wallet_ref,
            },
            status=status.HTTP_200_OK,
        )