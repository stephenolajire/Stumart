import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    # chat_conversation missing columns
    cursor.execute("ALTER TABLE chat_conversation ADD COLUMN IF NOT EXISTS last_message_sender varchar(20) DEFAULT '';")
    cursor.execute("ALTER TABLE chat_conversation ADD COLUMN IF NOT EXISTS service_name varchar(255) DEFAULT '';")
    cursor.execute("ALTER TABLE chat_conversation ADD COLUMN IF NOT EXISTS vendor_id bigint REFERENCES user_vendor(id) ON DELETE SET NULL;")
    cursor.execute("ALTER TABLE chat_conversation ADD COLUMN IF NOT EXISTS last_message_at timestamp with time zone;")
    cursor.execute("ALTER TABLE chat_conversation ADD COLUMN IF NOT EXISTS last_message text DEFAULT '';")

    # chat_message missing columns
    cursor.execute("ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS sender_type varchar(20) DEFAULT '';")
    cursor.execute("ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;")
    cursor.execute("ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS message_type varchar(20) DEFAULT '';")
    cursor.execute("ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS sender_vendor_id bigint REFERENCES user_vendor(id) ON DELETE SET NULL;")

    # chat_messagereadstatus - entire new table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messagereadstatus (
            id bigserial PRIMARY KEY,
            reader_type varchar(20) NOT NULL DEFAULT '',
            conversation_id bigint REFERENCES chat_conversation(id) ON DELETE CASCADE,
            reader_vendor_id bigint REFERENCES user_vendor(id) ON DELETE SET NULL,
            reader_user_id bigint REFERENCES user_user(id) ON DELETE SET NULL,
            last_read_at timestamp with time zone,
            last_read_message_id bigint REFERENCES chat_message(id) ON DELETE SET NULL
        );
    """)

    # stumart_cart missing user_id
    cursor.execute("ALTER TABLE stumart_cart ADD COLUMN IF NOT EXISTS user_id bigint REFERENCES user_user(id) ON DELETE CASCADE;")

    # stumart_order missing vendor_is_nearby
    cursor.execute("ALTER TABLE stumart_order ADD COLUMN IF NOT EXISTS vendor_is_nearby boolean NOT NULL DEFAULT false;")

    connection.commit()
    print("✅ All missing columns and tables created!")