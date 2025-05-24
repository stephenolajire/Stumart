from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """Throttle for login attempts"""
    rate = '5/minute'
    scope = 'login'

class EmailVerificationThrottle(AnonRateThrottle):
    """Throttle for email verification attempts"""
    rate = '3/minute'
    scope = 'email_verification'

class PasswordResetThrottle(AnonRateThrottle):
    """Throttle for password reset attempts"""
    rate = '3/minute'
    scope = 'password_reset'

class RegisterThrottle(AnonRateThrottle):
    """Throttle for registration attempts"""
    rate = '1/hour'
    scope = 'register'
