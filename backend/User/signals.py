from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from .models import Vendor, Subscription

@receiver(post_save, sender=Vendor)
def create_vendor_subscription(sender, instance, created, **kwargs):
    """
    Automatically create a free trial subscription for newly created vendors
    in the 'others' business category.
    """
    if created and instance.business_category == 'others':
        user = instance.user
        if not hasattr(user, 'subscription'):
            Subscription.objects.create(
                user=user,
                plan=None,  # Free trial has no specific plan
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=180),
                status='trial'
            )
