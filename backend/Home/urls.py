# Add this to your urls.py file
from django.urls import path
from .views import *

urlpatterns = [
    path('product-category/', ProductCategoryView.as_view(), name='product-category'),
    path('category-last-five/', CategoryLastFiveView.as_view(), name='category_last_five'),
]