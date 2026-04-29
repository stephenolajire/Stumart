from pathlib import Path
from decouple import config
import os
import cloudinary
import dj_database_url
from dotenv import load_dotenv
from datetime import timedelta
import json
import tempfile

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0, os.path.join(BASE_DIR))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')



# Application definition

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework_simplejwt',
    'rest_framework',
    'drf_spectacular',
    'user',
    # 'stumart',
    'vendor',
    'picker',
    'cloudinary_storage',
    'cloudinary',
    'adminn',
    'other',
    'chatbot',
    'chat',
    'utilities',
    'home',
    'company',
    'django_filters',
    'order',
    'payment',
    'wallet',
    'django_crontab',
    'stumart.apps.StumartConfig',
    'referral',
    'cart',
    'bookmark',
    'gift',
    # 'silk',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'user.middlewares.SubscriptionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'middleware.NoCacheMiddleware',
    # 'silk.middleware.SilkyMiddleware',
]

ROOT_URLCONF = 'Project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Project.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.environ.get('DB_NAME', 'your_db_name'),
#         'USER': os.environ.get('DB_USER', 'your_user'),
#         'PASSWORD': os.environ.get('DB_PASS', 'your_password'),
#         'HOST': os.environ.get('DB_HOST', 'localhost'),
#         'PORT': os.environ.get('DB_PORT', '5432'),
#     }
# }

DATABASES = {
    'default': dj_database_url.config(
        default=config("DATABASE_URL"),
        conn_max_age=0,        # Fresh connection per request (safest)
        conn_health_checks=True,
        ssl_require=True
    )
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'
STATIC_URL = 'static/'  
STATIC_ROOT = os.path.join(BASE_DIR, 'static') 

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Update ALLOWED_HOSTS configuration
if DEBUG:
    ALLOWED_HOSTS = [
        'localhost',
        '127.0.0.1',
    ]
else:
    ALLOWED_HOSTS = [
    'stumart-server.onrender.com',
    'stumart-fe1z.onrender.com',
    'stumart.com.ng',
    'www.stumart.com.ng',  # Add this
    'localhost',
    '127.0.0.1',
    'stumart-server-pvo1.onrender.com',
]

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://www.stumart.com.ng",
    "https://stumart.com.ng",
    "https://stumart-server.onrender.com",
    "https://server-stumart.onrender.com",
    "https://stumart-fe1z.onrender.com",
    "https://stumart-server-pvo1.onrender.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Important: Add this
CORS_PREFLIGHT_MAX_AGE = 86400

CSRF_TRUSTED_ORIGINS = [
    "https://stumart.com.ng",
    "https://www.stumart.com.ng",  # ← Make sure this is here
    "https://stumart-server.onrender.com",
    "https://server-stumart.onrender.com",
    "https://stumart-fe1z.onrender.com",
    "http://localhost:5173",
    "https://stumart-server-pvo1.onrender.com",
]


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/day',
        'user': '10000/day',
        'login': '5/minute',
        'email_verification': '3/minute',
        'password_reset': '3/minute',
        'register': '3/hour',
    },
    'EXCEPTION_HANDLER': 'user.utils.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# drf-spectacular configuration for Swagger/OpenAPI
SPECTACULAR_SETTINGS = {
    'TITLE': 'stumart API',
    'DESCRIPTION': 'stumart E-Commerce Platform API Documentation',
    'VERSION': '1.0.0',
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SCHEMA_PATH_PREFIX': r'/api',
    'COERCE_DECIMAL_TO_STRING': True,
    'ENUM_ADD_EXPLICIT_BLANK_CHOICE': False,
}

AUTH_USER_MODEL = "user.User"

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': config('CLOUD_NAME'),
    'API_KEY': config('API_KEY'),
    'API_SECRET': config('API_SECRET')
}

cloudinary.config(
    cloud_name=CLOUDINARY_STORAGE["CLOUD_NAME"],
    api_key=CLOUDINARY_STORAGE["API_KEY"],
    api_secret=CLOUDINARY_STORAGE["API_SECRET"],
    secure = True
)

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

# Email Configuration
#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend' # For development
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend' #For production
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_USE_TLS = True
EMAIL_PORT = 587
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
ADMIN_EMAIL = config('ADMIN_EMAIL')

PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY')
FRONTEND_URL = config('FRONTEND_URL')

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(hours=2),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# Add these security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_TYPE_NOSNIFF = True

# Dialogflow Settings
DIALOGFLOW_PROJECT_ID = config('DIALOGFLOW_PROJECT_ID')

try:
    from google.oauth2 import service_account
    from google.cloud import dialogflow_v2 as dialogflow
    
    # Create temp file with credentials in both environments
    credentials_dict = {
        "type": config("GOOGLE_TYPE", "service_account"),
        "project_id": DIALOGFLOW_PROJECT_ID,
        "private_key_id": config("GOOGLE_PRIVATE_KEY_ID"),
        "private_key": config("GOOGLE_PRIVATE_KEY").replace("\\n", "\n"),
        "client_email": config("GOOGLE_CLIENT_EMAIL"),
        "client_id": config("GOOGLE_CLIENT_ID"),
        "auth_uri": config("GOOGLE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth"),
        "token_uri": config("GOOGLE_TOKEN_URI", "https://oauth2.googleapis.com/token"),
        "auth_provider_x509_cert_url": config("GOOGLE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs"),
        "client_x509_cert_url": config("GOOGLE_CLIENT_X509_CERT_URL"),
        "universe_domain": config("GOOGLE_UNIVERSE_DOMAIN", "googleapis.com")
    }

    # Write credentials to temporary file
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as temp_file:
        json.dump(credentials_dict, temp_file)
        temp_file_path = temp_file.name

    # Set environment variable for Google credentials
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_file_path
    
    # Initialize client
    credentials = service_account.Credentials.from_service_account_file(temp_file_path)
    session_client = dialogflow.SessionsClient(credentials=credentials)

except Exception as e:
    print(f"Dialogflow initialization error: {str(e)}")
    session_client = None


PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY', 'your-secret-key-here')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY', 'your-public-key-here')
PAYSTACK_BASE_URL = 'https://api.paystack.co'

# Withdrawal Settings
MIN_WITHDRAWAL_AMOUNT = 5000  # ₦1,000
MAX_WITHDRAWAL_AMOUNT = 100000  # ₦100,000
WITHDRAWAL_FEE = 0  # No fee for now
DAILY_WITHDRAWAL_LIMIT = 500000  # ₦500,000
MONTHLY_WITHDRAWAL_LIMIT = 2000000  # ₦2,000,000

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'withdrawal.log',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'Vendor': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}


JAZZMIN_SETTINGS = {
    'site_title': 'stumart Admin',
    'site_header': 'stumart Admin Page',
    'welcome_sign': 'Welcome to My stumart Admin',
    "site_logo": "../stumart.jpeg",
    "login_logo": "../stumart.jpeg",
    "site_logo_classes": "img-circle",
    "copyright": "stumart 2025",
    'show_sidebar': True,
    'related_modal_active': True,
    'changeform_format': 'stacked',
    'show_ui_builder': True,
    'navigation_expanded': False,
}

CRONJOBS = [
    # Check payout status every 30 minutes
    # Format: ('schedule', 'function_path', ['arguments'])
    ('*/30 * * * *', 'django.core.management.call_command', ['check_payout_status'], {}, '>> /var/log/stumart/payout_check.log 2>&1'),
    
    # Retry failed payouts every 4 hours
    ('0 */4 * * *', 'django.core.management.call_command', ['retry_failed_payouts'], {}, '>> /var/log/stumart/payout_retry.log 2>&1'),
    
    # Optional: Daily summary report at 9 AM
    # ('0 9 * * *', 'django.core.management.call_command', ['send_daily_payout_report'], {}, '>> /var/log/stumart/daily_report.log 2>&1'),
]

# Optional: Add prefix to cron job comments
CRONTAB_COMMENT = 'stumart-payouts'

# Optional: Lock file to prevent concurrent runs
CRONTAB_LOCK_JOBS = True


LOGS_DIR = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

CRONJOBS = [
    # Check payout status every 30 minutes
    (
        '*/30 * * * *',
        'django.core.management.call_command',
        ['check_payout_status'],
        {},
        f'>> {LOGS_DIR}/payout_check.log 2>&1'
    ),
    (
        '*/3 * * * *',
        'django.core.management.call_command',
        ['register_existing_recipients'],
        {},
        f'>> {LOGS_DIR}/recipint_check.log 2>&1'
    ),
    
    # Retry failed payouts every 4 hours
    (
        '0 */4 * * *',
        'django.core.management.call_command',
        ['retry_failed_payouts'],
        {},
        f'>> {LOGS_DIR}/payout_retry.log 2>&1'
    ),
    
    # Optional: Clear old logs weekly (Sunday at midnight)
    (
        '0 0 * * 0',
        'django.core.management.call_command',
        ['clear_old_logs'],
        {'days': 30},
        f'>> {LOGS_DIR}/maintenance.log 2>&1'
    ),
]


# Add command prefix for easier identification
CRONTAB_COMMAND_PREFIX = 'DJANGO_SETTINGS_MODULE=stumart.settings'

import os

ADMIN_EMAILS = [email.strip() for email in os.environ.get('ADMIN_EMAILS', '').split(',') if email.strip()]


ADMIN_PHONE_NUMBERS = [phone.strip() for phone in os.environ.get('ADMIN_PHONE_NUMBERS', '').split(',') if phone.strip()]



LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'ERROR',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}