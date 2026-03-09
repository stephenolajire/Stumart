import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP
from rest_framework.views import exception_handler
from rest_framework.exceptions import Throttled

logger = logging.getLogger(__name__)

def send_otp_email(user):
    try:
        # Create OTP
        otp = OTP.objects.create(user=user)
        
        # Prepare email content
        subject = 'Verify your Stumart account'
        message = f'''
        Welcome to Stumart!
        
        Your verification code is: {otp.code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        '''
        
        # Send email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        logger.info(f"OTP email sent successfully to {user.email}")
        return otp
        
    except Exception as e:
        logger.error(f"Failed to send OTP email: {str(e)}")
        raise Exception("Failed to send verification email")

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, Throttled):
        custom_response_data = {
            'error': 'Too many attempts. Please try again later.',
            'wait_seconds': exc.wait
        }
        response.data = custom_response_data

    return response