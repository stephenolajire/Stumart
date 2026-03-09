# Add this to your urls.py file
from django.urls import path
from .views import *

urlpatterns = [
    path('home/vendors/by-category/', VendorsByCategoryView.as_view(), name='vendors-by-category'),
    path('home/products/by-category/', ProductCategoryView.as_view(), name='products-by-category'),
    path('home/categories/last-five/', CategoryLastFiveView.as_view(), name='categories-last-five'),
    path('home/vendors/by-school/', VendorsBySchoolView.as_view(), name='vendors-by-school'),
    path('home/vendors/all-names/', AllVendorNamesView.as_view(), name='all-vendor-names'),
]