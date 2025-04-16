from django.urls import path
from . import views


urlpatterns = [
    # Dashboard
    path('picker/dashboard/', views.PickerDashboardView.as_view(), name='dashboard'),
    
    # Available Orders
    path('available-orders/', views.AvailableOrdersView.as_view(), name='available_orders'),
    path('orders/<int:order_id>/accept/', views.AvailableOrdersView.as_view(), name='accept_order'),
    
    # My Deliveries
    path('my-deliveries/', views.MyDeliveriesView.as_view(), name='my_deliveries'),
    path('orders/<int:order_id>/deliver/', views.MyDeliveriesView.as_view(), name='deliver_order'),
    
    # Order Detail
    path('orders/<int:order_id>/', views.OrderDetailView.as_view(), name='order_detail'),
    
    # Earnings
    path('earnings/', views.EarningsView.as_view(), name='earnings'),
    
    # Reviews
    path('reviews/', views.ReviewsView.as_view(), name='reviews'),
    
    # Settings
    path('settings/', views.SettingsView.as_view(), name='settings'),
]