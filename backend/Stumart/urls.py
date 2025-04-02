from django.urls import path
from .views import *

urlpatterns = [
    path('vendor-products/<int:id>', ProductsView.as_view(), name='list-vendor-products'),
    path("shops-by-school/", VendorsBySchoolView.as_view(), name="shops-by-school"),
    path("shops-by-category/", VendorsByOtherView.as_view()),
    path("shops-by-school-and-category/", VendorsByOtherandSchoolView.as_view()),
    path("product/<str:id>/", ProductView.as_view()),
    path('create-products/', GetVendorView.as_view()),
    path('vendor-products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('vendor-product/<str:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
]