import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import OTP

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