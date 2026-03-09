from django.urls import path
from . views import *


urlpatterns = [
    path("company/areas/", CompanyAreasAPIView.as_view()),
    path('company/riders/', CompanyRiderListView.as_view(), name='rider-list'),
    path('company/riders/create/', CompanyRiderCreateView.as_view(), name='rider-create'),
    path('company/riders/<int:pk>/', CompanyRiderDetailView.as_view(), name='rider-detail'),
]