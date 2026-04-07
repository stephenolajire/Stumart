from django.db import models
from stumart.models import Product
from user.models import User, Vendor


class Bookmark(models.Model):
    """Model for bookmarked / saved products"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        help_text="The user who saved the product",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        help_text="The bookmarked product",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="bookmark_user_date"),
            models.Index(fields=["user", "product"], name="bookmark_user_product"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.product.name}"


class VendorBookmark(models.Model):
    """Model for bookmarked / saved vendors"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="vendor_bookmarks",
        help_text="The user who saved the vendor",
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        help_text="The bookmarked vendor",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "vendor")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="vbookmark_user_date"),
            models.Index(fields=["user", "vendor"], name="vbookmark_user_vendor"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.vendor.business_name}"