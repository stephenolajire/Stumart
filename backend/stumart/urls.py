from django.urls import path
from .views import *
from .views import SearchProductsView
from .views import SearchSpecificServiceView

urlpatterns = [

    # ── Products ─────────────────────────────────────────────
    path('stumart/products/all/', AllProductsView.as_view(), name='all-products'),
    path('stumart/products/create/', GetVendorView.as_view(), name='create-products'),
    path('stumart/products/search/', SearchProductsView.as_view(), name='search-products'),
    path('stumart/products/<str:id>/', ProductView.as_view(), name='product-detail-view'),

    # ── Vendor Products ──────────────────────────────────────
    path('stumart/vendor/products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('stumart/vendor/products/<int:id>/', SpecificVendorProductsView.as_view(), name='list-vendor-products'),
    path('stumart/vendor/products/<str:pk>/detail/', ProductDetailAPIView.as_view(), name='product-detail'),

    # ── Shops / Vendors ──────────────────────────────────────
    path('stumart/shops/by-category/', VendorsByOtherView.as_view(), name='shops-by-category'),
    path('stumart/shops/by-school-and-category/', VendorsByOtherandSchoolView.as_view(), name='shops-by-school-and-category'),

    # ── Services ─────────────────────────────────────────────
    path('stumart/services/<int:pk>/', ServiceDetailAPIView.as_view(), name='service-detail'),
    path('stumart/services/search/', SearchServicesAPIView.as_view(), name='search-services'),
    path('stumart/services/search/specific/', SearchSpecificServiceView.as_view(), name='search-specific-services'),

    # ── Service Applications ─────────────────────────────────
    path('stumart/service-applications/', ServiceApplicationAPIView.as_view(), name='submit-service-application'),
    path('stumart/service-applications/mine/', MySubmittedApplicationsAPIView.as_view(), name='my-submitted-applications'),
    path('stumart/service-applications/user/', UserServiceApplicationsAPIView.as_view(), name='user-service-applications'),
    path('stumart/service-applications/vendor/', VendorServiceApplicationsAPIView.as_view(), name='vendor-service-applications'),
    path('stumart/service-applications/<int:pk>/update-status/', ApplicationStatusUpdateAPIView.as_view(), name='update-application-status'),

    # ── Reviews ──────────────────────────────────────────────
    path('stumart/reviews/vendor/', CreateVendorReviewView.as_view(), name='create-vendor-review'),
    path('stumart/reviews/picker/', CreatePickerReviewView.as_view(), name='create-picker-review'),
    path('stumart/reviews/submit/', SubmitReviewsView.as_view(), name='submit-reviews'),
    path('stumart/reviews/user/', UserReviewListView.as_view(), name='get-user-reviews'),

    # ── Product Reviews ──────────────────────────────────────
    path('stumart/products/<int:product_id>/reviews/', ProductReviewListView.as_view(), name='get-product-reviews'),
    path('stumart/products/<int:product_id>/reviews/create/', ProductReviewCreateView.as_view(), name='create-product-review'),
    path('stumart/products/<int:product_id>/reviews/<int:review_id>/', ProductReviewDetailView.as_view(), name='update-delete-product-review'),
    path('stumart/products/<int:product_id>/user-review-status/', UserReviewStatusView.as_view(), name='get-user-review-status'),

    # ── Videos ───────────────────────────────────────────────
    path('stumart/videos/both/', GetBothVideosView.as_view(), name='get-both-videos'),
]