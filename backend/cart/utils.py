"""
cart/utils.py
─────────────
Pure helper functions for cart business logic.
No views, no serializers — just reusable logic.
"""
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# SHIPPING FEE CALCULATOR
# ─────────────────────────────────────────────────────────────

FALLBACK_SHIPPING = {
    1: Decimal("800.00"),
    2: Decimal("1000.00"),   # also covers 3
    4: Decimal("1100.00"),   # 4+
}

MULTI_VENDOR_SURCHARGE = {
    2: Decimal("100.00"),
    3: Decimal("200.00"),
    4: Decimal("300.00"),    # 4+ uses this
}


def get_base_delivery_fee(cart_items):
    """
    Look up the delivery fee registered in the Order app for the first
    matching school vendor found in the cart.

    Returns a Decimal or None (caller falls back to hardcoded fees).
    """
    from order.models import Vendor as OrderVendor, School

    for item in cart_items:
        if not (item.product and item.product.vendor):
            continue

        vendor_user = item.product.vendor

        if not hasattr(vendor_user, "vendor_profile"):
            continue

        user_vendor    = vendor_user.vendor_profile
        business_name  = user_vendor.business_name
        institution    = vendor_user.institution

        try:
            school = School.objects.filter(name__iexact=institution).first()
            if not school:
                logger.debug("School '%s' not found in Order app", institution)
                continue

            order_vendor = OrderVendor.objects.filter(
                school=school,
                business_name__iexact=business_name,
                is_active=True,
            ).first()

            if order_vendor:
                logger.debug(
                    "Found registered vendor '%s' in '%s' with fee %s",
                    business_name, school.name, order_vendor.delivery_fee,
                )
                return order_vendor.delivery_fee

            logger.debug(
                "Vendor '%s' not registered in school '%s'", business_name, school.name
            )

        except Exception:
            logger.exception("Error checking vendor registration for '%s'", business_name)

    return None


def calculate_shipping_fee(vendor_count: int, cart_items) -> Decimal:
    """
    Return the shipping fee for the cart.

    Strategy
    --------
    1. Try to find a registered school vendor and use their delivery_fee as the base.
    2. If none found, fall back to hardcoded tiers.
    3. Add a multi-vendor surcharge on top of the base fee for vendor_count > 1.
    """
    if vendor_count == 0:
        return Decimal("0.00")

    base_fee = get_base_delivery_fee(cart_items)

    if base_fee is not None:
        surcharge = MULTI_VENDOR_SURCHARGE.get(min(vendor_count, 4), Decimal("300.00"))
        if vendor_count == 1:
            surcharge = Decimal("0.00")
        fee = base_fee + surcharge
        logger.debug(
            "Registered delivery fee: base=%s  surcharge=%s  final=%s",
            base_fee, surcharge, fee,
        )
        return fee

    # Fallback hardcoded tiers
    if vendor_count == 1:
        fee = FALLBACK_SHIPPING[1]
    elif vendor_count < 4:
        fee = FALLBACK_SHIPPING[2]
    else:
        fee = FALLBACK_SHIPPING[4]

    logger.debug("Fallback shipping fee: %s (vendor_count=%s)", fee, vendor_count)
    return fee


# ─────────────────────────────────────────────────────────────
# TAKEAWAY FEE
# ─────────────────────────────────────────────────────────────

TAKEAWAY_FEE = Decimal("300.00")
TAX_FEE      = Decimal("400.00")
SHIPPING_FEE = Decimal("0.00")  # default, overridden by calculate_shipping_fee


def has_food_vendor(cart_items) -> bool:
    """Return True if any item in the cart belongs to a food-category vendor."""
    for item in cart_items:
        if not (item.product and item.product.vendor):
            continue
        vendor_user = item.product.vendor
        if not hasattr(vendor_user, "vendor_profile"):
            continue
        category = (vendor_user.vendor_profile.business_category or "").lower()
        if category == "food":
            logger.debug("Food vendor found: %s", vendor_user.vendor_profile.business_name)
            return True
    return False


def calculate_takeaway_fee(cart_items) -> Decimal:
    return TAKEAWAY_FEE if has_food_vendor(cart_items) else Decimal("0.00")