# Generated by Django 5.1.6 on 2025-04-11 04:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Stumart', '0010_orderitem_color_orderitem_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='wallet',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
