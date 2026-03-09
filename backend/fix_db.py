import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # Make cart_code nullable since model no longer uses it
    cursor.execute("""
        ALTER TABLE stumart_cart 
        ALTER COLUMN cart_code DROP NOT NULL;
    """)
    
    # Also set default to empty string for existing constraint
    cursor.execute("""
        ALTER TABLE stumart_cart 
        ALTER COLUMN cart_code SET DEFAULT '';
    """)

    connection.commit()
    print("✅ cart_code constraint fixed!")