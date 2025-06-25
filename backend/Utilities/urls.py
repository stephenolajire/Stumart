# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('admin/download/users/', views.DownloadUsersListView.as_view(), name='download_users'),
    path('admin/download/vendors/', views.DownloadVendorsListView.as_view(), name='download_vendors'),
    path('admin/download/pickers/', views.DownloadPickersListView.as_view(), name='download_pickers'),
    path('admin/download/transactions/', views.DownloadTransactionsListView.as_view(), name='download_transactions'),
    path('admin/send/kyc-reminder/', views.SendKYCReminderView.as_view(), name='send_kyc_reminder'),
    path('admin/send/product-reminder/', views.SendProductReminderView.as_view(), name='send_product_reminder'),
    path('admin/send/newsletter/', views.SendNewsletterView.as_view(), name='send_newsletter'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin_stats'),
    path('admin/utilities/', views.AdminUtilitiesView.as_view(), name='admin_utilities'),
]