from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('user', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='kycverification',
            index=models.Index(fields=['verification_status'], name='kyc_status_idx'),
        ),
        migrations.AddIndex(
            model_name='kycverification',
            index=models.Index(fields=['user', 'verification_status'], name='kyc_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['institution'], name='user_institution_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['state'], name='user_state_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['user_type'], name='user_type_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['institution', 'user_type'], name='user_inst_type_idx'),
        ),
        migrations.AddIndex(
            model_name='vendor',
            index=models.Index(fields=['business_category'], name='vendor_category_idx'),
        ),
        migrations.AddIndex(
            model_name='vendor',
            index=models.Index(fields=['user'], name='vendor_user_idx'),
        ),
        migrations.AddIndex(
            model_name='vendor',
            index=models.Index(fields=['is_verified'], name='vendor_verified_idx'),
        ),
    ]