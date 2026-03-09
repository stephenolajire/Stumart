import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Project.settings')
django.setup()

from django.db import connection
from django.apps import apps

with connection.cursor() as cursor:
    for model in apps.get_models():
        table = model._meta.db_table
        cursor.execute('SELECT column_name FROM information_schema.columns WHERE table_name=%s', [table])
        db_cols = set(row[0] for row in cursor.fetchall())
        django_cols = set(f.column for f in model._meta.concrete_fields)
        missing = django_cols - db_cols
        if missing:
            print('MISSING ' + table + ': ' + str(missing))

print('DONE')