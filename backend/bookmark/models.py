from django.db import models
from stumart.models import Product
from user.models import User
# Create your models here.

class Bookmark(models.Model):
    """Model for bookmarked / saved products"""
    user        = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        help_text="The user who saved the product",
    )
    product     = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="bookmarks",
        help_text="The bookmarked product",
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    # updated_at  = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        unique_together = ("user", "product")   # one bookmark per user per product
        ordering        = ["-created_at"]
        indexes         = [
            models.Index(fields=["user", "-created_at"], name="bookmark_user_date"),
            models.Index(fields=["user", "product"],     name="bookmark_user_product"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.product.name}"