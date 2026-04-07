from django.db import models
from django.conf import settings
from django.utils import timezone


class GiftItem(models.Model):
    """
    A standalone gift/reward that can appear on the spinner wheel.
    Gifts are FREE compensation items given to customers, not for sale.
    Gifts exist as independent products and don't require linking to existing products.
    weight controls relative probability — higher = more likely.
    e.g. item A weight=70, item B weight=20, item C weight=10
    gives A a 70% chance, B 20%, C 10%.
    """
    name        = models.CharField(max_length=120)
    description = models.CharField(max_length=255, blank=True)
    image       = models.ImageField(upload_to="gift_items/", blank=True, null=True)
    
    # Gift as standalone FREE reward product
    # Price is always 0.00 (gifts are compensation, not sold)
    price       = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        editable=False,
        help_text="Gifts are always free (compensation for customers)"
    )
    in_stock    = models.PositiveIntegerField(
        default=1,
        help_text="Number of gift units available"
    )
    
    weight      = models.PositiveIntegerField(
        default=10,
        help_text="Relative probability weight. Higher = more likely to land."
    )
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-weight", "name"]

    def __str__(self):
        return f"{self.name} (weight={self.weight})"


class SpinResult(models.Model):
    """
    Audit log of every spin attempt.
    """
    STATUS_CHOICES = [
        ("won",    "Won"),
        ("failed", "Failed"),  # e.g. product out of stock, cart error
    ]

    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="spin_results",
    )
    gift_item   = models.ForeignKey(
        GiftItem,
        on_delete=models.SET_NULL,
        null=True,
        related_name="spin_results",
    )
    status      = models.CharField(max_length=10, choices=STATUS_CHOICES, default="won")
    spun_at     = models.DateTimeField(auto_now_add=True)
    # Snapshot the item name in case GiftItem is deleted later
    item_name   = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["-spun_at"]

    def __str__(self):
        return f"{self.user} won '{self.item_name}' at {self.spun_at:%Y-%m-%d %H:%M}"


# ── helpers ────────────────────────────────────────────────────────────────────

SPIN_COOLDOWN_HOURS = 24


def get_last_spin(user):
    return SpinResult.objects.filter(user=user).order_by("-spun_at").first()


def can_user_spin(user):
    """Returns (bool, next_spin_dt | None)."""
    last = get_last_spin(user)
    if last is None:
        return True, None
    delta = timezone.now() - last.spun_at
    if delta.total_seconds() >= SPIN_COOLDOWN_HOURS * 3600:
        return True, None
    next_spin = last.spun_at + timezone.timedelta(hours=SPIN_COOLDOWN_HOURS)
    return False, next_spin