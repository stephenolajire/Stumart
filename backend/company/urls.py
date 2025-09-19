from django.urls import path
from . views import *


urlpatterns = [
    path("company/areas/", CompanyAreasAPIView.as_view()),
     path('riders/', CompanyRiderListView.as_view(), name='rider-list'),
    path('riders/create/', CompanyRiderCreateView.as_view(), name='rider-create'),
    path('riders/<int:pk>/', CompanyRiderDetailView.as_view(), name='rider-detail'),
]