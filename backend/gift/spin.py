import random
from .models import GiftItem


def pick_gift() -> GiftItem | None:
    """
    Returns a weighted-random active GiftItem, or None if none exist.
    GiftItem has no 'product' FK — gifts are standalone free rewards.
    """
    items = list(GiftItem.objects.filter(is_active=True))
    if not items:
        return None

    weights = [item.weight for item in items]
    return random.choices(items, weights=weights, k=1)[0]