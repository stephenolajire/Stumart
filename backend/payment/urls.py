from django.urls import path
from . import views

urlpatterns = [
    # Main withdrawal endpoints
    path('withdraw/', views.WithdrawalView.as_view(), name='withdraw'),
    path('history/', views.WithdrawalView.as_view(), name='withdrawal_history'),
    
    # Account verification
    path('verify-account/', views.AccountVerificationView.as_view(), name='verify_account'),
    
    # Bank management
    path('banks/', views.BankListView.as_view(), name='bank_list'),
    path('banks/search/', views.BankSearchView.as_view(), name='bank_search'),
    
    # Withdrawal status and limits
    path('status/<int:withdrawal_id>/', views.WithdrawalStatusView.as_view(), name='withdrawal_status'),
    path('limits/', views.WithdrawalLimitsView.as_view(), name='withdrawal_limits'),
    path('stats/', views.WithdrawalStatsView.as_view(), name='withdrawal_stats'),
    
    # Paystack webhook
    path('webhook/paystack/', views.PaystackWebhookView.as_view(), name='paystack_webhook'),
]