# urls.py for your service application endpoints

from django.urls import path
from . import views

app_name = 'services'

urlpatterns = [
    path('other/dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('applications/recent/', views.recent_applications, name='recent_applications'),
    path('applications/', views.all_applications, name='all_applications'),
    path('applications/<int:application_id>/', views.application_detail, name='application_detail'),
    path('applications/<int:application_id>/status/', views.update_application_status, name='update_application_status'),
]