from django.urls import path
from .views import *

urlpatterns = [
    path('products/<str:id>', ProductView.as_view(), name='list-vendor-products'),
    path("shops-by-school/", VendorsBySchoolView.as_view(), name="shops-by-school"),
]