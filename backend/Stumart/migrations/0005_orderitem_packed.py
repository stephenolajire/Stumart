# Generated by Django 5.1.6 on 2025-05-21 11:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Stumart', '0004_order_confirm'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='packed',
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
    ]
