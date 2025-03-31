from django.urls import path
from .views import *

urlpatterns = [
    path('products/<str:id>', ProductsView.as_view(), name='list-vendor-products'),
    path("shops-by-school/", VendorsBySchoolView.as_view(), name="shops-by-school"),
    path("shops-by-category/", VendorsByOtherView.as_view()),
    path("shops-by-school-and-category/", VendorsByOtherandSchoolView.as_view()),
    path('product/<str:id>', ProductView.as_view(), name='list-products'),
    path("products/", ProductCreateView.as_view()),
]