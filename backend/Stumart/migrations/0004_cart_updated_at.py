# Generated by Django 5.1.6 on 2025-04-06 16:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Stumart', '0003_cart_cartitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='cart',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
