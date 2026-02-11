from django.urls import path
from .views import (
    CreateReferralView,
    ListAllReferralsView,
    GetReferralByCodeView,
    GetReferralByEmailView,
    ValidateReferralCodeView,
    ReferralStatsView,
    UpdateReferralStatsView,
    ResetReferralEarningsView,
    BulkResetEarningsView,
    SendPayoutEmailView,
    BulkSendPayoutEmailsView,
    PayoutHistoryView
)

urlpatterns = [
    # Create referral
    path('create/', CreateReferralView.as_view(), name='create-referral'),
    
    # List all referrals (Admin)
    path('list/', ListAllReferralsView.as_view(), name='list-referrals'),
    
    # Get referral by code
    path('code/<str:referral_code>/', GetReferralByCodeView.as_view(), name='get-referral-by-code'),
    
    # Get referral by email
    path('email/<str:email>/', GetReferralByEmailView.as_view(), name='get-referral-by-email'),
    
    # Validate referral code
    path('validate/', ValidateReferralCodeView.as_view(), name='validate-referral'),
    
    # Get stats
    path('<str:referral_code>/stats/', ReferralStatsView.as_view(), name='referral-stats'),
    
    # Update stats
    path('<str:referral_code>/update-stats/', UpdateReferralStatsView.as_view(), name='update-referral-stats'),
    
    # Reset earnings (process payout)
    path('<str:referral_code>/reset/', ResetReferralEarningsView.as_view(), name='reset-earnings'),
    
    # Bulk reset earnings
    path('bulk-reset/', BulkResetEarningsView.as_view(), name='bulk-reset-earnings'),
    
    # Send payout email
    path('<str:referral_code>/send-email/', SendPayoutEmailView.as_view(), name='send-payout-email'),
    
    # Bulk send payout emails
    path('bulk-send-emails/', BulkSendPayoutEmailsView.as_view(), name='bulk-send-payout-emails'),
    
    # Get payout history
    path('<str:referral_code>/payout-history/', PayoutHistoryView.as_view(), name='payout-history'),
]