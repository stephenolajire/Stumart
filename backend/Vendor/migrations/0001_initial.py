# Generated by Django 5.1.6 on 2025-04-11 00:53

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('Stumart', '0010_orderitem_color_orderitem_size'),
        ('User', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)])),
                ('comment', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('vendor_response', models.TextField(blank=True, null=True)),
                ('response_date', models.DateTimeField(blank=True, null=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='Stumart.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='VendorStats',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_sales', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('total_orders', models.PositiveIntegerField(default=0)),
                ('total_products', models.PositiveIntegerField(default=0)),
                ('low_stock_products', models.PositiveIntegerField(default=0)),
                ('pending_reviews', models.PositiveIntegerField(default=0)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('vendor', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='dashboard_stats', to='User.vendor')),
            ],
        ),
        migrations.CreateModel(
            name='VendorRevenueData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.CharField(max_length=20)),
                ('year', models.PositiveIntegerField()),
                ('value', models.DecimalField(decimal_places=2, max_digits=12)),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='revenue_data', to='User.vendor')),
            ],
            options={
                'unique_together': {('vendor', 'month', 'year')},
            },
        ),
        migrations.CreateModel(
            name='VendorSalesData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.CharField(max_length=20)),
                ('year', models.PositiveIntegerField()),
                ('value', models.PositiveIntegerField()),
                ('vendor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sales_data', to='User.vendor')),
            ],
            options={
                'unique_together': {('vendor', 'month', 'year')},
            },
        ),
    ]
