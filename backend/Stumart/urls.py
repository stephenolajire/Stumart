from django.urls import path
from .views import *
from .views import SearchProductsView
from .views import SearchSpecificServiceView

urlpatterns = [
    path('vendor-products/<int:id>', SpecificVendorProductsView.as_view(), name='list-vendor-products'),
    path("shops-by-school/", VendorsBySchoolView.as_view(), name="shops-by-school"),
    path("shops-by-category/", VendorsByOtherView.as_view()),
    path("shops-by-school-and-category/", VendorsByOtherandSchoolView.as_view()),
    path("product/<str:id>/", ProductView.as_view()),
    path('create-products/', GetVendorView.as_view()),
    path('vendor-products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('vendor-product/<str:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('all-products/', AllProductsView.as_view(), name='all-products'),
    # Service specific endpoints
    path('service-detail/<int:pk>/', ServiceDetailAPIView.as_view(), name='service-detail'),
    path('service-application/', ServiceApplicationAPIView.as_view(), name='submit-service-application'),
    path('user-service-applications/', UserServiceApplicationsAPIView.as_view(),  name='user-service-applications'),
    path('vendor-service-applications/', VendorServiceApplicationsAPIView.as_view(), name='vendor-service-applications'),
    path('update-application-status/<int:pk>/', ApplicationStatusUpdateAPIView.as_view(),  name='update-application-status'),
    path('search-services/', SearchServicesAPIView.as_view(), name='search-services'),
    path('search-products/', SearchProductsView.as_view(), name='search-products'),
    path('search-specific-services/', SearchSpecificServiceView.as_view(), name='search-specific-services'),

    # review
    path('vendor-review/', CreateVendorReviewView.as_view(), name='create_vendor_review'),
    path('picker-review/', CreatePickerReviewView.as_view(), name='create_picker_review'),
    path('submit-reviews/', SubmitReviewsView.as_view(), name='submit_reviews'),

    # Product Review endpoints
    # Get all reviews for a product
    path('products/<int:product_id>/reviews/', ProductReviewListView.as_view(), name='get_product_reviews'),
    
    # Check user's review status for a product
    path('products/<int:product_id>/user-review-status/', UserReviewStatusView.as_view(), name='get_user_review_status'),
    
    # Create a new review for a product
    path('products/<int:product_id>/reviews/create/', ProductReviewCreateView.as_view(), name='create_product_review'),
    
    # Update or delete a specific review
    path('products/<int:product_id>/reviews/<int:review_id>/', ProductReviewDetailView.as_view(), name='update_delete_product_review'),
    
    # Get all reviews by the current user
    path('user/reviews/', UserReviewListView.as_view(), name='get_user_reviews'),

    path('videos/both/', GetBothVideosView.as_view(), name='get-both-videos'),
    path('my-submitted-applications/', MySubmittedApplicationsAPIView.as_view(), name='my-submitted-applications'),


    # Unified messaging endpoints
    path('conversations/', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/create/', CreateConversationView.as_view(), name='create_conversation'),
    path('conversations/<int:conversation_id>/messages/', MessageListView.as_view(), name='message_list'),
    path('messages/send/', SendMessageView.as_view(), name='send_message'),
]