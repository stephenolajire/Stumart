# Add to your middleware.py file or create one

from django.http import JsonResponse
from django.utils import timezone

class SubscriptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Process request
        response = self.get_response(request)
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Skip middleware for authentication and subscription related views
        if request.path.startswith('/api/auth/') or request.path.startswith('/api/subscription'):
            return None
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return None
        
        # Check if user is a vendor with 'others' category
        try:
            vendor = request.user.vendor_profile
            if vendor.business_category != 'others':
                return None
        except:
            return None
        
        # Check subscription status
        try:
            subscription = request.user.subscription
            if subscription.status == 'active' and subscription.end_date > timezone.now():
                return None
            elif subscription.status == 'trial' and subscription.end_date > timezone.now():
                return None
            else:
                return JsonResponse(
                    {"detail": "Subscription required or expired. Please subscribe to continue."},
                    status=403
                )
        except:
            # No subscription found
            return JsonResponse(
                {"detail": "Subscription required. Please subscribe to continue."},
                status=403
            )