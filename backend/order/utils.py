import uuid
import string
import random
import logging
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.timezone import now
from weasyprint import HTML

from wallet.models import DeliveryOpportunity
from wallet.models import (
    VendorWallets, CompanyWallet,
    PickerWalletAccount, StudentPickerWalletAccount,
    StumartWalletAccount, WalletTransactionAccount,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# UNIQUE CODE HELPERS
# ─────────────────────────────────────────────────────────────

def generate_delivery_opportunity_code(order_id: int, picker_identifier: str) -> str:
    """Return a guaranteed-unique DEL_<order_id>_<6-char-suffix> code."""
    while True:
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        code = f"DEL_{order_id}_{suffix}"
        if not DeliveryOpportunity.objects.filter(unique_code=code).exists():
            return code


def generate_delivery_confirmation_code(order_id: int) -> str:
    """Return a guaranteed-unique CONF_<order_id>_<8-char-UUID> code."""
    while True:
        code = f"CONF_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        if not DeliveryOpportunity.objects.filter(delivery_confirmation_code=code).exists():
            return code


def generate_customer_confirmation_code(order_id: int) -> str:
    """Return a CUST_CONF_<order_id>_<8-char-UUID> code (collisions extremely unlikely)."""
    return f"CUST_CONF_{order_id}_{str(uuid.uuid4())[:8].upper()}"


# ─────────────────────────────────────────────────────────────
# INVENTORY MANAGEMENT
# ─────────────────────────────────────────────────────────────

def deduct_inventory(order_items) -> set:
    """
    Deduct stock for every item in an order.
    Returns the set of vendors whose product just hit zero stock (for out-of-stock emails).
    """
    from stumart.models import ProductSize, ProductColor

    vendors_out_of_stock = set()

    for item in order_items:
        product = item.product

        product.in_stock = max(product.in_stock - item.quantity, 0)
        product.save()

        if item.size:
            try:
                size_obj = ProductSize.objects.get(product=product, size=item.size)
                size_obj.quantity = max(size_obj.quantity - item.quantity, 0)
                size_obj.save()
                logger.info(
                    "Updated size inventory — product %s, size %s → %s",
                    product.id, item.size, size_obj.quantity,
                )
                if size_obj.quantity == 0 and item.vendor:
                    vendors_out_of_stock.add(item.vendor)
            except ProductSize.DoesNotExist:
                logger.warning("Size %s not found for product %s", item.size, product.id)

        if item.color:
            try:
                from stumart.models import ProductColor
                color_obj = ProductColor.objects.get(product=product, color=item.color)
                color_obj.quantity = max(color_obj.quantity - item.quantity, 0)
                color_obj.save()
                logger.info(
                    "Updated color inventory — product %s, color %s → %s",
                    product.id, item.color, color_obj.quantity,
                )
            except ProductColor.DoesNotExist:
                logger.warning("Color %s not found for product %s", item.color, product.id)

    return vendors_out_of_stock


def restore_inventory(order_items) -> None:
    """Restore stock for a cancelled order."""
    from stumart.models import ProductSize, ProductColor

    for item in order_items:
        product = item.product
        product.in_stock += item.quantity
        product.save()

        if item.size:
            try:
                size_obj = ProductSize.objects.get(product=product, size=item.size)
                size_obj.quantity += item.quantity
                size_obj.save()
            except ProductSize.DoesNotExist:
                pass

        if item.color:
            try:
                color_obj = ProductColor.objects.get(product=product, color=item.color)
                color_obj.quantity += item.quantity
                color_obj.save()
            except ProductColor.DoesNotExist:
                pass


# ─────────────────────────────────────────────────────────────
# EMAIL — VENDOR NOTIFICATIONS
# ─────────────────────────────────────────────────────────────

def send_out_of_stock_emails(vendors: set) -> None:
    """Notify vendors that a product has gone out of stock."""
    for vendor in vendors:
        try:
            send_mail(
                subject="Product Out of Stock",
                message=(
                    f"Dear {vendor.business_name},\n\n"
                    "One or more of your products is now out of stock. "
                    "Please restock to continue receiving orders."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[vendor.user.email],
            )
            logger.info("Sent out-of-stock email to vendor %s", vendor.id)
        except Exception:
            logger.exception("Failed to send out-of-stock email to vendor %s", vendor.id)


def send_vendor_order_emails(order, order_items) -> None:
    """
    For each vendor in the order, send a personalised HTML email with a PDF
    attachment listing only their items.
    """
    vendors_to_notify = {
        item.vendor for item in order_items if item.vendor is not None
    }

    for vendor in vendors_to_notify:
        try:
            vendor_items = []
            vendor_total = 0

            for item in order_items:
                if item.vendor and item.vendor.id == vendor.id:
                    item_price = item.price or 0
                    item.subtotal = item_price * item.quantity
                    vendor_total += item.subtotal
                    vendor_items.append(item)

            if not vendor_items:
                continue

            context = {
                "order": order,
                "vendor_items": vendor_items,
                "vendor": vendor,
                "current_year": now().year,
                "total": vendor_total,
                "dashboard_url": (
                    f"{settings.FRONTEND_URL}/vendor/dashboard/orders/{order.order_number}"
                ),
            }

            html_content = render_to_string("email/ordered.html", context)
            pdf_buffer = BytesIO()
            HTML(string=html_content).write_pdf(pdf_buffer)
            pdf_buffer.seek(0)

            email_msg = EmailMultiAlternatives(
                subject=f"New Order Notification - #{order.order_number}",
                body="You have received a new order. Details are attached as a PDF.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[vendor.user.email],
            )
            email_msg.attach_alternative(html_content, "text/html")
            email_msg.attach(
                f"order_{order.order_number}.pdf", pdf_buffer.getvalue(), "application/pdf"
            )
            email_msg.send()
            logger.info("Order notification sent to vendor %s for order %s", vendor.id, order.order_number)

        except Exception:
            logger.exception("Error sending notification to vendor %s", vendor.id)


# ─────────────────────────────────────────────────────────────
# EMAIL — CUSTOMER RECEIPT
# ─────────────────────────────────────────────────────────────

def send_customer_receipt_email(order, order_items) -> None:
    """Send an HTML + PDF receipt to the customer."""
    try:
        for item in order_items:
            item.total = (item.price or 0) * item.quantity

        context = {
            "order": order,
            "order_items": order_items,
            "current_year": now().year,
        }

        html_content = render_to_string("email/receipts.html", context)
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)

        email_msg = EmailMultiAlternatives(
            subject=f"Your Order Receipt - #{order.order_number}",
            body="Your order receipt is attached as a PDF.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.email],
        )
        email_msg.attach_alternative(html_content, "text/html")
        email_msg.attach(
            f"receipt_{order.order_number}.pdf", pdf_buffer.getvalue(), "application/pdf"
        )
        email_msg.send()
        logger.info("Sent receipt email to %s for order %s", order.email, order.order_number)

    except Exception:
        logger.exception("Error sending receipt for order %s", order.order_number)


# ─────────────────────────────────────────────────────────────
# EMAIL — ORDER CANCELLATION
# ─────────────────────────────────────────────────────────────

def send_cancellation_emails(order, order_items) -> None:
    """Notify the customer and all involved vendors about an order cancellation."""
    # Customer
    try:
        send_mail(
            subject=f"Order #{order.order_number} Cancelled",
            message=(
                f"Your order #{order.order_number} has been cancelled.\n\n"
                f"Order Total: ₦{order.total}\n"
                "If you have any questions, please contact support."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send cancellation email to customer for order %s", order.order_number)

    # Vendors
    notified: set = set()
    for item in order_items:
        vendor = item.vendor
        if vendor and vendor.id not in notified:
            try:
                send_mail(
                    subject=f"Order #{order.order_number} Cancelled",
                    message=(
                        f"Order #{order.order_number} has been cancelled by the customer.\n\n"
                        "Please note that the inventory has been automatically restored."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[vendor.user.email],
                    fail_silently=True,
                )
                notified.add(vendor.id)
            except Exception:
                logger.exception("Failed to send cancellation email to vendor %s", vendor.id)


# ─────────────────────────────────────────────────────────────
# EMAIL — PACKING STATUS
# ─────────────────────────────────────────────────────────────

def send_packing_status_email(
    order, all_packed: bool,
    packed_vendors=None, unpacked_vendors=None,
) -> None:
    """Notify the customer of packing progress."""
    try:
        if all_packed:
            subject = f"Order #{order.order_number} Ready for Delivery"
            message = (
                f"Hello {order.first_name},\n\n"
                f"Your order #{order.order_number} has been completely packed "
                "by all vendors and is now ready for delivery.\n\n"
                "Our delivery team has been notified and will contact you soon.\n\n"
                "Thank you for your patronage!"
            )
        else:
            packed_names   = [v.business_name for v in (packed_vendors   or [])]
            unpacked_names = [v.business_name for v in (unpacked_vendors or [])]
            subject = f"Order #{order.order_number} Partially Packed"
            message = (
                f"Hello {order.first_name},\n\n"
                f"Your order #{order.order_number} is being prepared.\n\n"
                f"✅ Packed by: {', '.join(packed_names)}\n"
                f"⏳ Still preparing: {', '.join(unpacked_names)}\n\n"
                "We'll notify you once all items are ready for delivery.\n\n"
                "Thank you for your patience!"
            )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send packing status email for order %s", order.order_number)


# ─────────────────────────────────────────────────────────────
# EMAIL — DELIVERY OPPORTUNITY (PICKERS / RIDERS)
# ─────────────────────────────────────────────────────────────

def send_company_rider_opportunity_emails(order, vendor, rider_data: list) -> None:
    """Send personalised delivery-opportunity emails to company riders."""
    from user.models import Vendor as VendorModel

    order_vendors = VendorModel.objects.filter(orderitem__order=order).distinct()
    vendor_names  = [v.business_name for v in order_vendors]

    for data in rider_data:
        rider           = data["rider"]
        unique_code     = data["unique_code"]
        acceptance_link = data["acceptance_link"]

        subject = f"🚛 URGENT: Delivery Opportunity - Order #{order.order_number}"
        message = (
            f"Hello {rider.name},\n\n"
            f"A new delivery opportunity is available for immediate pickup!\n\n"
            f"📦 ORDER DETAILS:\n"
            f"• Order Number: {order.order_number}\n"
            f"• Opportunity Code: {unique_code}\n"
            f"• Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"• Pickup Location: {', '.join(vendor_names)} at {vendor.user.institution}\n"
            f"• Delivery Address: {order.address}\n"
            f"• Room Number: {order.room_number or 'Not specified'}\n"
            f"• Customer: {order.first_name} {order.last_name} ({order.phone})\n"
            f"• Order Value: ₦{order.total}\n\n"
            f"🎯 QUICK ACCEPT:\n{acceptance_link}\n\n"
            f"📞 ALTERNATIVE — reply with:\n"
            f"• Your name: {rider.name}\n"
            f"• Phone: {rider.phone}\n"
            f"• Code: {unique_code}\n"
            f"• Expected pickup time\n\n"
            f"⚠️ Expires in 24 hours. First acceptance wins!\n\n"
            f"Company: {rider.company.user.first_name} {rider.company.user.last_name}\n"
            f"Contact: {rider.company.user.phone_number}\n\n"
            f"Best regards,\nStumart Team"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[rider.email],
                fail_silently=False,
            )
            logger.info("Sent delivery opportunity to rider %s (%s)", rider.name, unique_code)
        except Exception:
            logger.exception("Failed to send opportunity email to rider %s", rider.name)


def send_regular_picker_opportunity_emails(order, vendor, picker_data: list) -> None:
    """Send personalised delivery-opportunity emails to regular / student pickers."""
    from user.models import Vendor as VendorModel

    order_vendors = VendorModel.objects.filter(orderitem__order=order).distinct()
    vendor_names  = [v.business_name for v in order_vendors]

    for data in picker_data:
        picker          = data["picker"]
        unique_code     = data["unique_code"]
        acceptance_link = data["acceptance_link"]

        subject = f"🚴 New Delivery Opportunity - Order #{order.order_number}"
        message = (
            f"Hello {picker.first_name} {picker.last_name},\n\n"
            f"A new delivery opportunity is available at your institution!\n\n"
            f"📦 ORDER DETAILS:\n"
            f"• Order Number: {order.order_number}\n"
            f"• Opportunity Code: {unique_code}\n"
            f"• Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            f"• Pickup Location: {', '.join(vendor_names)} at {vendor.user.institution}\n"
            f"• Delivery Address: {order.address}\n"
            f"• Room Number: {order.room_number or 'Not specified'}\n"
            f"• Customer: {order.first_name} {order.last_name} ({order.phone})\n"
            f"• Order Value: ₦{order.total}\n\n"
            f"🎯 QUICK ACCEPT:\n{acceptance_link}\n\n"
            f"📞 ALTERNATIVE — reply with:\n"
            f"• Your name and contact\n"
            f"• Code: {unique_code}\n"
            f"• Expected pickup time\n\n"
            f"⚠️ Expires in 24 hours. First acceptance wins!\n\n"
            f"Best regards,\nStumart Team"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[picker.email],
                fail_silently=False,
            )
            logger.info(
                "Sent delivery opportunity to picker %s %s (%s)",
                picker.first_name, picker.last_name, unique_code,
            )
        except Exception:
            logger.exception(
                "Failed to send opportunity email to picker %s", picker.email
            )


# ─────────────────────────────────────────────────────────────
# EMAIL — DELIVERY ACCEPTANCE
# ─────────────────────────────────────────────────────────────

def send_rider_confirmation_link_email(
    order, opportunity, rider_name: str, rider_phone: str, delivery_confirmation_code: str,
) -> None:
    """Send the confirmation link to the rider so they can confirm delivery later."""
    rider_email = (
        opportunity.company_rider.email
        if opportunity.company_rider
        else opportunity.user_picker.email
    )
    confirmation_link = f"{settings.FRONTEND_URL}/confirm-delivery/{delivery_confirmation_code}"

    message = (
        f"Hello {rider_name},\n\n"
        f"Thank you for accepting delivery for Order #{order.order_number}.\n\n"
        f"📦 ORDER DETAILS:\n"
        f"• Order Number: {order.order_number}\n"
        f"• Customer: {order.first_name} {order.last_name}\n"
        f"• Delivery Address: {order.address}\n"
        f"• Room Number: {order.room_number or 'Not specified'}\n"
        f"• Customer Phone: {order.phone}\n"
        f"• Order Value: ₦{order.total}\n\n"
        f"🚀 CONFIRM DELIVERY AFTER HANDOVER:\n{confirmation_link}\n\n"
        f"📋 INSTRUCTIONS:\n"
        f"1. Contact the customer when on your way\n"
        f"2. Verify identity before handover\n"
        f"3. Click the link ONLY after successful delivery\n\n"
        f"Thank you for your service!\n\nBest regards,\nStumart Team"
    )

    try:
        send_mail(
            subject=f"Delivery Confirmation Link - Order #{order.order_number}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[rider_email],
            fail_silently=False,
        )
        logger.info("Sent delivery confirmation link to %s for order %s", rider_name, order.order_number)
    except Exception:
        logger.exception("Failed to send delivery confirmation link to %s", rider_name)


def send_customer_delivery_accepted_email(order, rider_name: str, rider_phone: str, pickup_time: str) -> None:
    try:
        send_mail(
            subject=f"Your Order #{order.order_number} is Out for Delivery!",
            message=(
                f"Hello {order.first_name},\n\n"
                f"Your order #{order.order_number} has been accepted for delivery.\n\n"
                f"🚴 DELIVERY DETAILS:\n"
                f"• Rider: {rider_name}\n"
                f"• Contact: {rider_phone}\n"
                f"• Pickup Time: {pickup_time}\n"
                f"• Delivery Address: {order.address}\n"
                f"• Room: {order.room_number or 'Not specified'}\n\n"
                "Your rider will contact you when on the way.\n\n"
                "Thank you for choosing Stumart!"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to notify customer of delivery acceptance for order %s", order.order_number)


def send_admin_notifications(order, order_items) -> None:
    try:
        # ✅ Read directly from settings instead of querying User model
        admin_emails = getattr(settings, "ADMIN_EMAILS", [])

        if not admin_emails:
            logger.warning("No admin emails configured in settings for order %s", order.order_number)
            return

        items_summary = "\n".join(
            f"  - {item.product.name} x{item.quantity} @ ₦{item.price} ({item.vendor.business_name})"
            for item in order_items
        )

        message = (
            f"New paid order received.\n\n"
            f"Order Number : {order.order_number}\n"
            f"Customer     : {order.first_name} {order.last_name}\n"
            f"Email        : {order.email}\n"
            f"Phone        : {order.phone}\n"
            f"Address      : {order.address}\n"
            f"Room         : {order.room_number or 'N/A'}\n"
            f"Vendor Nearby: {'Yes' if order.vendor_is_nearby else 'No'}\n\n"
            f"Items:\n{items_summary}\n\n"
            f"Subtotal     : ₦{order.subtotal}\n"
            f"Shipping     : ₦{order.shipping_fee}\n"
            f"Tax          : ₦{order.tax}\n"
            f"Total        : ₦{order.total}\n"
        )

        send_mail(
            subject=f"[StuMart] New Order — {order.order_number}",
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@stumart.com"),
            recipient_list=admin_emails,
            fail_silently=False,  # ✅ changed to False so failures surface in logs
        )

        logger.info(
            "Admin notification sent for order %s to %d admin(s): %s",
            order.order_number, len(admin_emails), admin_emails,
        )

    except Exception:
        logger.exception("Failed to send admin notification for order %s", order.order_number)


def send_cancelled_riders_emails(order, accepted_opportunity) -> None:
    """Notify riders whose opportunity was cancelled because another rider accepted first."""
    cancelled = DeliveryOpportunity.objects.filter(
        order=order, status="cancelled"
    ).exclude(id=accepted_opportunity.id)

    for opp in cancelled:
        try:
            if opp.company_rider:
                email = opp.company_rider.email
                name  = opp.company_rider.name
            else:
                email = opp.user_picker.email
                name  = f"{opp.user_picker.first_name} {opp.user_picker.last_name}"

            send_mail(
                subject=f"Delivery Opportunity Taken - Order #{order.order_number}",
                message=(
                    f"Hello {name},\n\n"
                    f"The delivery opportunity for Order #{order.order_number} has been accepted by another rider.\n\n"
                    "Don't worry — more opportunities are on the way!\n\n"
                    "Best regards,\nStumart Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            logger.exception("Failed to notify cancelled rider %s", opp.id)


# ─────────────────────────────────────────────────────────────
# EMAIL — DELIVERY CONFIRMED (rider → customer)
# ─────────────────────────────────────────────────────────────

def send_customer_delivery_completed_email(order, opportunity, customer_confirmation_code: str) -> None:
    customer_confirmation_link = (
        f"{settings.FRONTEND_URL}/confirm-order-received/{customer_confirmation_code}"
    )
    try:
        send_mail(
            subject=f"Order #{order.order_number} Delivered Successfully!",
            message=(
                f"Hello {order.first_name},\n\n"
                f"Your order #{order.order_number} has been delivered.\n\n"
                f"📦 DELIVERY DETAILS:\n"
                f"• Delivered To: {order.address}\n"
                f"• Room: {order.room_number or 'Not specified'}\n"
                f"• Delivered By: {opportunity.accepted_rider_name}\n"
                f"• Delivered At: {opportunity.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"• Order Value: ₦{order.total}\n\n"
                f"✅ CONFIRM RECEIPT:\n{customer_confirmation_link}\n\n"
                "Thank you for choosing Stumart!\n\nBest regards,\nStumart Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Failed to send delivery-completed email to customer for order %s", order.order_number)


def send_admin_delivery_completed_email(order, opportunity) -> None:
    try:
        send_mail(
            subject=f"Delivery Completed - Order #{order.order_number}",
            message=(
                f"A delivery has been completed:\n\n"
                f"ORDER INFO:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Customer: {order.first_name} {order.last_name}\n"
                f"• Address: {order.address}\n"
                f"• Total: ₦{order.total}\n\n"
                f"DELIVERY INFO:\n"
                f"• Rider: {opportunity.accepted_rider_name}\n"
                f"• Phone: {opportunity.accepted_rider_phone}\n"
                f"• Delivered At: {opportunity.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"• Confirmation Code: {opportunity.delivery_confirmation_code}\n\n"
                "Status: Order marked as DELIVERED"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send admin delivery-completed email for order %s", order.order_number)


# ─────────────────────────────────────────────────────────────
# EMAIL — PAYOUT NOTIFICATIONS (post customer confirmation)
# ─────────────────────────────────────────────────────────────

def send_customer_order_completed_email(order, opportunity) -> None:
    try:
        send_mail(
            subject=f"✅ Order Confirmed - #{order.order_number}",
            message=(
                f"Dear {order.first_name} {order.last_name},\n\n"
                "Thank you for confirming receipt of your order!\n\n"
                f"📦 Order Number: {order.order_number}\n"
                f"Total Amount: ₦{order.total}\n"
                f"Delivery Address: {order.address}\n"
                f"Confirmed At: {now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"🚴 Rider: {opportunity.accepted_rider_name} ({opportunity.accepted_rider_phone})\n\n"
                "All payments have been processed automatically.\n\n"
                "Thank you for shopping with Stumart!\n\nBest regards,\nThe Stumart Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send order-completed email to customer for order %s", order.order_number)


def send_vendor_payout_email(order, vendor_transfer: dict) -> None:
    vendor_email = vendor_transfer.get("vendor_email")
    vendor_name  = vendor_transfer.get("vendor_name")
    if not vendor_email or not vendor_name:
        return

    if vendor_transfer["success"]:
        subject = f"💰 Payment Sent - Order #{order.order_number}"
        message = (
            f"Dear {vendor_name},\n\n"
            "Your payment has been automatically processed and sent to your bank account.\n\n"
            f"💸 PAYMENT DETAILS:\n"
            f"• Order Number: {order.order_number}\n"
            f"• Gross: ₦{vendor_transfer['gross_amount']:.2f}\n"
            f"• Platform Fee: ₦{vendor_transfer['platform_fee']:.2f}\n"
            f"• Net Amount: ₦{vendor_transfer['net_amount']:.2f}\n"
            f"• Reference: {vendor_transfer.get('reference', 'N/A')}\n"
            f"• Transfer Code: {vendor_transfer.get('transfer_code', 'N/A')}\n"
            f"• ETA: 10–30 minutes\n\n"
            "No manual withdrawal needed!\n\nBest regards,\nStumart Team"
        )
    else:
        subject = f"⚠️ Transfer Issue - Order #{order.order_number}"
        message = (
            f"Dear {vendor_name},\n\n"
            "We attempted to transfer your payment automatically but encountered an issue.\n\n"
            f"• Order Number: {order.order_number}\n"
            f"• Net Amount: ₦{vendor_transfer['net_amount']:.2f}\n"
            f"• Issue: {vendor_transfer.get('error', 'Transfer failed')}\n\n"
            "Your payment has been credited to your Stumart wallet. "
            "You can withdraw it manually through the app.\n\nBest regards,\nStumart Team"
        )

    try:
        send_mail(
            subject=subject, message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[vendor_email], fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send payout email to vendor %s", vendor_name)


def send_picker_payout_email(order, picker_transfer: dict) -> None:
    picker_email = picker_transfer.get("picker_email")
    picker_name  = picker_transfer.get("picker_name", picker_email)
    if not picker_email:
        return

    if picker_transfer["success"]:
        subject = f"💰 Delivery Payment Sent - Order #{order.order_number}"
        message = (
            f"Hello {picker_name},\n\n"
            "Your delivery payment has been automatically processed!\n\n"
            f"💸 PAYMENT DETAILS:\n"
            f"• Order Number: {order.order_number}\n"
            f"• Gross: ₦{picker_transfer['gross_amount']:.2f}\n"
            f"• Platform Fee: ₦{picker_transfer['platform_fee']:.2f}\n"
            f"• Net Amount: ₦{picker_transfer['net_amount']:.2f}\n"
            f"• Reference: {picker_transfer.get('reference', 'N/A')}\n"
            f"• ETA: 10–30 minutes\n\n"
            "Thank you for your excellent delivery service!\n\nBest regards,\nStumart Team"
        )
    else:
        subject = f"⚠️ Payment Issue - Order #{order.order_number}"
        message = (
            f"Hello {picker_name},\n\n"
            "We attempted to process your delivery payment automatically but encountered an issue.\n\n"
            f"• Order Number: {order.order_number}\n"
            f"• Net Amount: ₦{picker_transfer['net_amount']:.2f}\n"
            f"• Issue: {picker_transfer.get('error', 'Transfer failed')}\n\n"
            "Your payment has been credited to your Stumart wallet.\n\nBest regards,\nStumart Team"
        )

    try:
        send_mail(
            subject=subject, message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[picker_email], fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send payout email to picker %s", picker_name)


def send_admin_transfer_summary_email(order, opportunity, transfer_results: dict) -> None:
    vendor_lines = []
    for v in transfer_results.get("vendor_transfers", []):
        icon = "✓" if v["success"] else "✗"
        vendor_lines.append(
            f"  {icon} {v.get('vendor_name', 'Unknown')}: "
            f"₦{v['net_amount']:.2f}  ref={v.get('reference', v.get('error', 'N/A'))}"
        )
    vendor_text = "\n".join(vendor_lines) or "  None"

    pt = transfer_results.get("picker_transfer")
    cr = transfer_results.get("company_rider_transfer")
    if pt:
        icon = "✓" if pt["success"] else "✗"
        picker_text = (
            f"  {icon} {pt.get('picker_name', pt.get('picker_email', '?'))} "
            f"({pt['picker_type']})  ₦{pt['net_amount']:.2f}  "
            f"ref={pt.get('reference', pt.get('error', 'N/A'))}"
        )
    elif cr:
        picker_text = (
            f"  ✓ COMPANY RIDER {cr['rider_name']}  ₦{cr['net_amount']:.2f}  "
            f"credited to {cr['company_name']}"
        )
    else:
        picker_text = "  None"

    try:
        send_mail(
            subject=f"🔄 Automated Transfers Completed - Order #{order.order_number}",
            message=(
                f"Transfers processed for order #{order.order_number}:\n\n"
                f"Customer: {order.first_name} {order.last_name}  |  Total: ₦{order.total}\n\n"
                f"VENDOR TRANSFERS:\n{vendor_text}\n\n"
                f"PICKER/RIDER TRANSFER:\n{picker_text}\n\n"
                f"STUMART EARNINGS: ₦{transfer_results.get('stumart_earnings', 0):.2f}\n\n"
                "Successful transfers arrive in 10–30 minutes.\n"
                "Failed transfers have been credited to wallets for manual processing."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send admin transfer summary for order %s", order.order_number)


# ─────────────────────────────────────────────────────────────
# EMAIL — ADMIN NEW ORDER NOTIFICATION
# ─────────────────────────────────────────────────────────────

def send_admin_notifications(order, order_items) -> None:
    """
    Notify all admin users by email when a new order is paid.
    Called via transaction.on_commit after payment verification.
    """
    from user.models import User

    try:
        admin_emails = list(
            User.objects.filter(user_type="admin", is_active=True)
            .values_list("email", flat=True)
        )

        if not admin_emails:
            logger.warning("No active admin users found to notify for order %s", order.order_number)
            return

        items_summary = "\n".join(
            f"  - {item.product.name} x{item.quantity} @ ₦{item.price} ({item.vendor.business_name})"
            for item in order_items
        )

        message = (
            f"New paid order received.\n\n"
            f"Order Number : {order.order_number}\n"
            f"Customer     : {order.first_name} {order.last_name}\n"
            f"Email        : {order.email}\n"
            f"Phone        : {order.phone}\n"
            f"Address      : {order.address}\n"
            f"Room         : {order.room_number or 'N/A'}\n"
            f"Vendor Nearby: {'Yes' if order.vendor_is_nearby else 'No'}\n\n"
            f"Items:\n{items_summary}\n\n"
            f"Subtotal     : ₦{order.subtotal}\n"
            f"Shipping     : ₦{order.shipping_fee}\n"
            f"Tax          : ₦{order.tax}\n"
            f"Total        : ₦{order.total}\n"
        )

        send_mail(
            subject=f"[StuMart] New Order — {order.order_number}",
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@stumart.com"),
            recipient_list=admin_emails,
            fail_silently=True,
        )

        logger.info(
            "Admin notification sent for order %s to %d admin(s)",
            order.order_number, len(admin_emails),
        )

    except Exception:
        logger.exception("Failed to send admin notification for order %s", order.order_number)


# ─────────────────────────────────────────────────────────────
# AUTOMATED PAYOUTS
# ─────────────────────────────────────────────────────────────

def calculate_vendor_payments(order) -> dict:
    """Returns {vendor_id: Decimal amount} for all vendors in the order."""
    totals = {}
    for item in order.order_items.all():
        vid = item.vendor.id
        amount = Decimal(str(item.quantity)) * Decimal(str(item.price))
        totals[vid] = totals.get(vid, Decimal("0")) + amount
    return totals


def process_automated_transfers(order, opportunity) -> dict:
    """
    Called after customer confirms receipt.
    Processes Paystack transfers to vendors and picker/rider,
    credits wallets as fallback, and records all wallet transactions.
    Returns a transfer_results dict for the API response.
    """
    from user.paystack_register import PaystackTransferService
    from user.models import Vendor

    transfer_service = PaystackTransferService()
    results = {
        "vendor_transfers": [],
        "picker_transfer": None,
        "company_rider_transfer": None,
        "stumart_earnings": 0,
    }

    shipping_fee        = Decimal(str(order.shipping_fee))
    tax_amount          = Decimal(str(order.tax))
    company_commission  = Decimal("100.00")
    vendor_platform_fee = Decimal("50.00")
    picker_platform_fee = Decimal("100.00")

    is_company = opportunity.picker_type == "company_rider"
    stumart_earnings = tax_amount + (company_commission if is_company else picker_platform_fee)

    # ── Stumart wallet ──────────────────────────────────────
    stumart_wallet = StumartWalletAccount.get_instance()
    from user.models import User
    stumart_user = getattr(stumart_wallet, "user", None) or User.objects.filter(is_superuser=True).first()

    if stumart_user:
        stumart_wallet.add_tax(tax_amount)
        stumart_wallet.add_commission(company_commission if is_company else picker_platform_fee)

        WalletTransactionAccount.objects.create(
            transaction_type="tax", amount=tax_amount,
            order=order, user=stumart_user,
            description=f"Tax from order #{order.order_number}",
        )
        WalletTransactionAccount.objects.create(
            transaction_type="commission",
            amount=company_commission if is_company else picker_platform_fee,
            order=order, user=stumart_user,
            description=f"Commission from order #{order.order_number}",
        )

    results["stumart_earnings"] = float(stumart_earnings)

    # ── Vendor payouts ──────────────────────────────────────
    vendor_payments = calculate_vendor_payments(order)
    total_vendor_fees = vendor_platform_fee * len(vendor_payments)
    stumart_earnings += total_vendor_fees
    results["stumart_earnings"] = float(stumart_earnings)

    if stumart_user and vendor_payments:
        WalletTransactionAccount.objects.create(
            transaction_type="commission", amount=total_vendor_fees,
            order=order, user=stumart_user,
            description=f"Vendor platform fees ({len(vendor_payments)} vendors) — order #{order.order_number}",
        )

    for vendor_id, gross in vendor_payments.items():
        try:
            vendor      = Vendor.objects.get(id=vendor_id)
            net         = max(gross - vendor_platform_fee, Decimal("0"))
            timestamp   = int(now().timestamp() * 1000)
            reference   = f"vendor_{vendor_id}_order_{order.order_number}_{timestamp}"

            if not vendor.paystack_recipient_code:
                _credit_vendor_wallet(vendor, net, order, f"No recipient code — order #{order.order_number}")
                results["vendor_transfers"].append(_vendor_result(vendor, gross, vendor_platform_fee, net, False, error="No recipient code configured"))
                continue

            success, transfer_data, error = transfer_service.initiate_transfer(
                amount=int(net * 100),
                recipient_code=vendor.paystack_recipient_code,
                reason=f"Order #{order.order_number} payment (less ₦{vendor_platform_fee} fee)",
                reference=reference,
            )

            if success:
                transfer_code = (transfer_data or {}).get("transfer_code")
                WalletTransactionAccount.objects.create(
                    transaction_type="vendor_payment", amount=net,
                    order=order, user=vendor.user,
                    description=f"Transfer {reference} | Code: {transfer_code}",
                )
                results["vendor_transfers"].append(
                    _vendor_result(vendor, gross, vendor_platform_fee, net, True, reference=reference, transfer_code=transfer_code)
                )
            else:
                _credit_vendor_wallet(vendor, net, order, f"Transfer failed: {error}")
                results["vendor_transfers"].append(_vendor_result(vendor, gross, vendor_platform_fee, net, False, error=error))

        except Exception:
            logger.exception("Error processing transfer for vendor %s", vendor_id)
            results["vendor_transfers"].append({"vendor_id": vendor_id, "success": False, "error": "Internal error"})

    # ── Picker / Rider payouts ──────────────────────────────
    if is_company and opportunity.company_rider:
        rider   = opportunity.company_rider
        company = rider.company
        net     = shipping_fee - company_commission

        rider.total_earnings = (rider.total_earnings or Decimal("0")) + net
        rider.completed_deliveries += 1
        rider.save()

        wallet, _ = CompanyWallet.objects.get_or_create(company=company, defaults={"balance": Decimal("0")})
        wallet.balance += net
        wallet.save()

        WalletTransactionAccount.objects.create(
            transaction_type="rider_earnings", amount=net,
            order=order, user=company.user,
            description=f"Rider earnings for order #{order.order_number}",
        )
        results["company_rider_transfer"] = {
            "rider_name": rider.name, "company_name": company.user.email,
            "gross_amount": float(shipping_fee), "commission": float(company_commission),
            "net_amount": float(net), "success": True,
            "note": "Credited to company wallet",
        }

    elif opportunity.user_picker:
        picker      = opportunity.user_picker
        net         = max(shipping_fee - picker_platform_fee, Decimal("0"))
        profile     = None
        recip_code  = None

        if picker.user_type == "picker":
            profile    = picker.picker_profile
            recip_code = profile.paystack_recipient_code
            profile.total_deliveries += 1
            profile.save()
        elif picker.user_type == "student_picker":
            profile    = picker.student_picker_profile
            recip_code = profile.paystack_recipient_code
            profile.total_deliveries += 1
            profile.save()

        if not recip_code:
            _credit_picker_wallet(picker, profile, net, order, "No recipient code")
            results["picker_transfer"] = _picker_result(picker, shipping_fee, picker_platform_fee, net, False, error="No recipient code (wallet credited)")
        else:
            timestamp = int(now().timestamp() * 1000)
            reference = f"picker_{picker.id}_order_{order.order_number}_{timestamp}"
            success, transfer_data, error = transfer_service.initiate_transfer(
                amount=int(net * 100),
                recipient_code=recip_code,
                reason=f"Delivery for order #{order.order_number}",
                reference=reference,
            )
            if success:
                transfer_code = (transfer_data or {}).get("transfer_code")
                WalletTransactionAccount.objects.create(
                    transaction_type="delivery_payment", amount=net,
                    order=order, user=picker,
                    description=f"Transfer {reference} | Code: {transfer_code}",
                )
                results["picker_transfer"] = _picker_result(
                    picker, shipping_fee, picker_platform_fee, net, True,
                    reference=reference, transfer_code=transfer_code,
                )
            else:
                _credit_picker_wallet(picker, profile, net, order, f"Transfer failed: {error}")
                results["picker_transfer"] = _picker_result(picker, shipping_fee, picker_platform_fee, net, False, error=error)

    return results


# ── private helpers ─────────────────────────────────────────

def _credit_vendor_wallet(vendor, amount, order, description):
    wallet, _ = VendorWallets.objects.get_or_create(vendor=vendor, defaults={"balance": Decimal("0")})
    wallet.balance += amount
    wallet.save()
    WalletTransactionAccount.objects.create(
        transaction_type="vendor_payment", amount=amount,
        order=order, user=vendor.user, description=description,
    )


def _credit_picker_wallet(picker, profile, amount, order, description):
    if picker.user_type == "picker":
        wallet, _ = PickerWalletAccount.objects.get_or_create(picker=profile, defaults={"amount": Decimal("0")})
        wallet.amount += amount
        wallet.save()
    else:
        wallet, _ = StudentPickerWalletAccount.objects.get_or_create(student_picker=profile, defaults={"amount": Decimal("0")})
        wallet.amount += amount
        wallet.save()
    WalletTransactionAccount.objects.create(
        transaction_type="delivery_payment", amount=amount,
        order=order, user=picker, description=description,
    )


def _vendor_result(vendor, gross, fee, net, success, **kwargs):
    return {
        "vendor_id": vendor.id, "vendor_name": vendor.business_name,
        "vendor_email": vendor.user.email,
        "gross_amount": float(gross), "platform_fee": float(fee), "net_amount": float(net),
        "success": success, **kwargs,
    }


def _picker_result(picker, gross, fee, net, success, **kwargs):
    return {
        "picker_email": picker.email,
        "picker_name": f"{picker.first_name} {picker.last_name}",
        "picker_type": picker.user_type,
        "gross_amount": float(gross), "platform_fee": float(fee), "net_amount": float(net),
        "success": success, **kwargs,
    }

def send_admin_split_dispatch_email(order, covered_vendors: list, uncovered_vendors: list) -> None:
    """
    Notify admin that a multi-vendor order was split between student pickers
    (for some vendors) and regular/company pickers (for the rest).
    """
    admin_emails = getattr(settings, "ADMIN_EMAILS", [])
    if not admin_emails:
        logger.warning("No admin emails configured in settings for split-dispatch order %s", order.order_number)
        return

    covered_lines = "\n".join(
        f"  • {v.business_name} → student picker(s) notified"
        for v in covered_vendors
    )
    uncovered_lines = "\n".join(
        f"  • {v.business_name} → regular/company picker(s) notified"
        for v in uncovered_vendors
    )

    message = (
        f"Order #{order.order_number} has been split across picker types "
        f"because no single student picker covers all vendors.\n\n"
        f"Customer : {order.first_name} {order.last_name}\n"
        f"Phone    : {order.phone}\n"
        f"Address  : {order.address}  |  Room: {order.room_number or 'N/A'}\n"
        f"Total    : ₦{order.total}\n\n"
        f"HANDLED BY STUDENT PICKERS:\n{covered_lines or '  None'}\n\n"
        f"HANDLED BY REGULAR/COMPANY PICKERS:\n{uncovered_lines or '  None'}\n\n"
        "Please monitor this order closely as it involves multiple delivery types.\n\n"
        "— Stumart System"
    )

    try:
        send_mail(
            subject=f"⚠️ Split Dispatch — Order #{order.order_number}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=admin_emails,  # ✅ fixed
            fail_silently=False,          # ✅ surface failures in logs
        )
        logger.info(
            "Sent split-dispatch admin email for order %s to %d admin(s)",
            order.order_number, len(admin_emails),
        )
    except Exception:
        logger.exception("Failed to send split-dispatch admin email for order %s", order.order_number)