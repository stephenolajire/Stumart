# Generated by Django 5.1.6 on 2025-04-04 16:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Stumart', '0009_alter_productcolor_color_alter_productsize_size'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='gender',
            field=models.CharField(blank=True, choices=[('men', 'Men'), ('women', 'Women'), ('unisex', 'Unisex'), ('kids', 'Kids')], default='unisex', max_length=10, null=True),
        ),
    ]
