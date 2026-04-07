from django.core.management.base import BaseCommand
from gift.models import GiftItem


class Command(BaseCommand):
    help = "Seed the database with test GiftItem data (student merchandise items)"

    def handle(self, *args, **options):
        # Clear existing gifts (optional)
        # GiftItem.objects.all().delete()

        gifts_data = [
            {
                "name": "Premium Ballpoint Pen Set",
                "description": "Set of 5 quality ballpoint pens in assorted colors",
                "weight": 70,
                "in_stock": 50,
            },
            {
                "name": "College T-Shirt",
                "description": "Comfortable branded college t-shirt (available in S-XXL)",
                "weight": 65,
                "in_stock": 45,
            },
            {
                "name": "Canvas Tote Bag",
                "description": "Durable canvas tote bag perfect for carrying books and materials",
                "weight": 60,
                "in_stock": 40,
            },
            {
                "name": "Backpack",
                "description": "School backpack with multiple compartments and padded laptop sleeve",
                "weight": 50,
                "in_stock": 25,
            },
            {
                "name": "Adjustable Baseball Cap",
                "description": "Comfortable adjustable cap with embroidered logo",
                "weight": 55,
                "in_stock": 35,
            },
            {
                "name": "Scientific Calculator",
                "description": "Advanced scientific calculator for engineering and maths courses",
                "weight": 45,
                "in_stock": 30,
            },
            {
                "name": "Notebook Set (3-Pack)",
                "description": "Pack of 3 quality ruled notebooks for note-taking",
                "weight": 70,
                "in_stock": 50,
            },
            {
                "name": "Desk Lamp",
                "description": "LED desk lamp with adjustable brightness for study sessions",
                "weight": 35,
                "in_stock": 20,
            },
            {
                "name": "Wrist Watch",
                "description": "Stylish analog wrist watch perfect for students",
                "weight": 40,
                "in_stock": 22,
            },
            {
                "name": "USB Flash Drive (32GB)",
                "description": "High-speed USB 3.0 flash drive for storing projects and materials",
                "weight": 45,
                "in_stock": 28,
            },
            {
                "name": "Headphones",
                "description": "Quality over-ear headphones with noise cancellation",
                "weight": 30,
                "in_stock": 18,
            },
            {
                "name": "Desk Organizer",
                "description": "Wooden desk organizer with compartments for pens, notes, and supplies",
                "weight": 35,
                "in_stock": 25,
            },
            {
                "name": "Water Bottle",
                "description": "Reusable stainless steel water bottle (750ml)",
                "weight": 50,
                "in_stock": 40,
            },
            {
                "name": "Sweatshirt/Hoodie",
                "description": "Comfortable college-branded sweatshirt (available in S-XXL)",
                "weight": 55,
                "in_stock": 30,
            },
            {
                "name": "Phone Stand",
                "description": "Adjustable phone stand for studying and video calls",
                "weight": 40,
                "in_stock": 32,
            },
        ]

        created_count = 0
        for gift_data in gifts_data:
            gift_item, created = GiftItem.objects.get_or_create(
                name=gift_data["name"],
                defaults={
                    "description": gift_data["description"],
                    "weight": gift_data["weight"],
                    "in_stock": gift_data["in_stock"],
                    "price": 0.00,  # All gifts are free compensation
                    "is_active": True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created: {gift_item.name}"),
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"→ Already exists: {gift_item.name}"),
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Seeding complete! Created {created_count} new student gift items."
            )
        )
