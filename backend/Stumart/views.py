from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from User.models import Vendor
from django.shortcuts import get_list_or_404
from User.serializers import VendorSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import*
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.renderers import JSONRenderer
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from decimal import Decimal
import requests
import json
import uuid
from django.conf import settings
import requests
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML
from io import BytesIO
from django.utils.timezone import now
import logging
logger = logging.getLogger(__name__)
from rest_framework import generics
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from . paginations import CustomPagination
from django.db import transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Q, Max, Prefetch, OuterRef, Subquery
from django.shortcuts import get_object_or_404
from .models import Product, VendorReview, Vendor
from .serializers import VendorReviewSerializer
from User.models import Vendor
from django.utils.html import strip_tags
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
from django.core.paginator import Paginator
import json
from .models import Conversation, Message, MessageReadStatus, ServiceApplication

class SpecificVendorProductsView(APIView):
    def get(self, request, id):
        try:
            vendor = get_object_or_404(Vendor, id=id)
            products = Product.objects.filter(vendor=vendor.user)
            serializer = ProductSerializer(products, many=True)

            # Vendor Details
            business_data = {
                "business_name": vendor.business_name,
                "shop_image": request.build_absolute_uri(vendor.shop_image.url) if vendor.shop_image else None,
                "business_category": vendor.business_category,
                "business_description":vendor.business_description,
                "rating": vendor.rating
            }

            serializer = ProductSerializer(products, many=True, context={'request': request})
            product_data = serializer.data
            # Remove 'in_stock' if business category is 'food'
            if vendor.business_category and vendor.business_category.lower() == "food":
                for product in product_data:
                    product.pop("in_stock", None)

            return Response(
                {
                    "vendor_details": business_data,
                    "products": product_data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class VendorsBySchoolView(APIView):
    def get(self, request):
        school_name = request.query_params.get("school", None)

        if not school_name:
            return Response(
                {"error": "School name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get users associated with the institution
            users = User.objects.filter(institution__iexact=school_name)
            
            if not users.exists():
                return Response(
                    {"error": "No users found for this institution"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get vendors linked to those users and apply KYC filtering
            vendors = Vendor.objects.filter(user__in=users).distinct()
            vendors = self._apply_kyc_filtering(vendors)
            
            if not vendors.exists():
                return Response(
                    {"error": "No vendors found for this institution"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Serialize and return vendor data
            serializer = VendorSerializer(vendors, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _apply_kyc_filtering(self, queryset):
        """
        Filter out vendors whose KYC is not approved.
        Only show vendors with approved KYC status.
        """
        queryset = queryset.filter(user__kyc__verification_status='approved')
        print(f"After KYC filtering (approved vendors only): {queryset.count()}")
        return queryset


class VendorsByOtherView(APIView):
    def get(self, request):
        category = request.query_params.get("business_category", None)
        specific_category = request.query_params.get("specific_category", None)

        if not category:
            return Response(
                {"error": "The category name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Apply filters dynamically
            filters = {"business_category__iexact": category}
            if specific_category:
                filters["specific_category__iexact"] = specific_category

            vendors = Vendor.objects.filter(**filters)
            # Apply KYC filtering
            vendors = self._apply_kyc_filtering(vendors)

            if not vendors.exists():
                return Response(
                    {"error": "No vendor found for this category"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Serialize and return vendor data
            serializer = VendorSerializer(vendors, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _apply_kyc_filtering(self, queryset):
        """
        Filter out vendors whose KYC is not approved.
        Only show vendors with approved KYC status.
        """
        queryset = queryset.filter(user__kyc__verification_status='approved')
        print(f"After KYC filtering (approved vendors only): {queryset.count()}")
        return queryset

        
class VendorsByOtherandSchoolView(APIView):
    def get(self, request):
        try:
            category = request.query_params.get("business_category", None)
            specific_category = request.query_params.get("specific_category", None)
            school_name = request.query_params.get("school", None)
            
            # Check if user is authenticated
            if request.user.is_authenticated:
                # For authenticated users, use their institution
                user_institution = getattr(request.user, 'institution', None)
                
                if not user_institution:
                    return Response(
                        {"error": "Authenticated user must have an institution"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get all users from the same institution as the authenticated user
                users_in_school = User.objects.filter(institution__iexact=user_institution)
                
                if not users_in_school.exists():
                    return Response(
                        {"error": "No users found for your institution"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Get vendors belonging to these users and apply KYC filtering
                vendors = Vendor.objects.filter(user__in=users_in_school)
                vendors = self._apply_kyc_filtering(vendors)
                
                # Apply category filters if provided
                if category:
                    vendors = vendors.filter(business_category__iexact=category)
                if specific_category:
                    vendors = vendors.filter(specific_category__iexact=specific_category)
                
                if not vendors.exists():
                    return Response(
                        {"error": "No vendors found matching the criteria in your institution"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Serialize and return vendor data
                serializer = VendorSerializer(vendors, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
            else:
                # For non-authenticated users, school parameter is required
                if not school_name:
                    return Response(
                        {"error": "The school name is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # First, filter users by school
                users_in_school = User.objects.filter(institution__iexact=school_name)
                
                if not users_in_school.exists():
                    return Response(
                        {"error": "No users found for this school"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Get vendors belonging to these users and apply KYC filtering
                vendors = Vendor.objects.filter(user__in=users_in_school)
                vendors = self._apply_kyc_filtering(vendors)
                
                # Apply category filters
                if category:
                    vendors = vendors.filter(business_category__iexact=category)
                if specific_category:
                    vendors = vendors.filter(specific_category__iexact=specific_category)
                
                if not vendors.exists():
                    return Response(
                        {"error": "No vendor found matching the criteria"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Serialize and return vendor data
                serializer = VendorSerializer(vendors, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _apply_kyc_filtering(self, queryset):
        """
        Filter out vendors whose KYC is not approved.
        Only show vendors with approved KYC status.
        """
        queryset = queryset.filter(user__kyc__verification_status='approved')
        print(f"After KYC filtering (approved vendors only): {queryset.count()}")
        return queryset
        
class ProductView(APIView):
    def get(self, request, id):
        try:
            product = Product.objects.get(id=id)
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class GetVendorView(APIView):
    """API endpoint to get vendor information before creating a product"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Get vendor information to determine what fields to show"""
        try:
            user = request.user
            vendor = Vendor.objects.get(user=user)
            business_category = vendor.business_category if vendor.business_category else ""
            
            return Response({
                "business_category": business_category,
                "vendor_id": vendor.id,
                "business_name": vendor.business_name
            })
        except vendor.DoesNotExist:
            return Response(
                {"error": "User is not registered as a vendor"},
                status=status.HTTP_403_FORBIDDEN
            )

class ProductListCreateAPIView(APIView):
    """API endpoints for listing and creating products"""
    permission_classes = [IsAuthenticated]
    # parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request, *args, **kwargs):
        """List all products for current vendor"""
        try:
            user = request.user
            vendor = Vendor.objects.get(user=user)
            products = Product.objects.filter(vendor=user)
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
        except vendor.DoesNotExist:
            return Response(
                {"error": "User is not registered as a vendor"},
                status=status.HTTP_403_FORBIDDEN
            )
    
    def post(self, request, *args, **kwargs):
        """Create a new product"""
        try:
            # Verify user is a vendor
            user = request.user
            if user.user_type == "vendor":
            
                # Create product
                serializer = ProductCreateSerializer(
                    data=request.data,
                    context={'request': request}
                )
                
                if serializer.is_valid():
                    serializer.save()
                    return Response(
                        {"message": "Product created successfully", "data": serializer.data},
                        status=status.HTTP_201_CREATED
                    )
            
                # Return validation errors
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except user.DoesNotExist:
            return Response(
                {"error": "User is not registered as a vendor"},
                status=status.HTTP_403_FORBIDDEN
            )


class ProductDetailAPIView(APIView):
    """API endpoints for retrieving, updating and deleting a product"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_object(self, pk, request):
        """Helper method to get product object and verify ownership"""
        product = get_object_or_404(Product, pk=pk)
        user = request.user
        vendor = Vendor.objects.get(user=user)
        
        # Verify the product belongs to the requesting vendor
        if product.vendor != vendor.user:
            return None
            
        return product
    
    def get(self, request, pk, *args, **kwargs):
        """Retrieve a product"""
        product = self.get_object(pk, request)
        
        if not product:
            return Response(
                {"error": "Product not found or you don't have permission to view it"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    
    def put(self, request, pk, *args, **kwargs):
        """Update a product"""
        product = self.get_object(pk, request)
        
        if not product:
            return Response(
                {"error": "Product not found or you don't have permission to update it"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = ProductCreateSerializer(
            product,
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Product updated successfully", "data": serializer.data}
            )
            
        return Response(
            {"errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def delete(self, request, pk, *args, **kwargs):
        """Delete a product"""
        product = self.get_object(pk, request)
        
        if not product:
            return Response(
                {"error": "Product not found or you don't have permission to delete it"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        product.delete()
        return Response(
            {"message": "Product deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
        
class ServiceDetailAPIView(APIView):
    
    def get(self, request, pk):
        service = get_object_or_404(Vendor, pk=pk, business_category='others')
        serializer = VendorSerializer(service)
        return Response(serializer.data)       

class ServiceApplicationAPIView(APIView):
    def post(self, request):
        # Get the service details
        service_id = request.data.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'},
                          status=status.HTTP_400_BAD_REQUEST)
                
        service = get_object_or_404(Vendor, pk=service_id, business_category='others')
                
        # Create application data
        application_data = {
            'service': service.id,
            'name': request.data.get('name'),
            'email': request.data.get('email'),
            'phone': request.data.get('phone'),
            'description': request.data.get('description'),
            'preferred_date': request.data.get('preferredDate'),
            'additional_details': request.data.get('additionalDetails'),
        }
                
        # If the user is authenticated, associate with the application
        if request.user.is_authenticated:
            application_data['user'] = request.user.id
                
        serializer = ServiceApplicationSerializer(data=application_data)
                
        if serializer.is_valid():
            application = serializer.save()
                        
            # Send email to user
            user_email = application_data['email']
            send_user_notification_email(
                user_email, 
                application, 
                service
            )
                        
            # Send email to vendor
            # Access vendor's email through the user foreign key
            vendor_email = service.user.email  # Get email from the User model linked to Vendor
            send_vendor_notification_email(
                vendor_email, 
                application, 
                service
            )
                        
            return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserServiceApplicationsAPIView(APIView):
    """
    Get all service applications submitted by the authenticated user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        applications = ServiceApplication.objects.filter(user=request.user)
        serializer = ServiceApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class VendorServiceApplicationsAPIView(APIView):
    """
    Get all service applications for the vendor's services
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if the user is a vendor
        try:
            vendor = Vendor.objects.get(user=request.user)
            applications = ServiceApplication.objects.filter(service=vendor)
            serializer = ServiceApplicationSerializer(applications, many=True)
            return Response(serializer.data)
        except Vendor.DoesNotExist:
            return Response({'error': 'User is not a vendor'}, 
                            status=status.HTTP_403_FORBIDDEN)


class ApplicationStatusUpdateAPIView(APIView):
    """
    Update the status of a service application (vendor only)
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        application = get_object_or_404(ServiceApplication, pk=pk)
        
        # Check if the current user is the vendor for this application
        try:
            vendor = Vendor.objects.get(user=request.user)
            if application.service != vendor:
                return Response({'error': 'You do not have permission to update this application'}, 
                               status=status.HTTP_403_FORBIDDEN)
        except Vendor.DoesNotExist:
            return Response({'error': 'User is not a vendor'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Update application status and response
        application.status = request.data.get('status', application.status)
        application.vendor_response = request.data.get('vendor_response', application.vendor_response)
        
        if application.status == 'completed' and not application.completion_date:
            application.completion_date = timezone.now()
        
        application.save()
        serializer = ServiceApplicationSerializer(application)
        return Response(serializer.data)


class SearchServicesAPIView(APIView):
    """
    Search for services by keywords
    """
    def get(self, request):
        keyword = request.query_params.get('keyword', '')
        
        if not keyword:
            return Response({'error': 'Keyword parameter is required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Search in business name and specific category
        services = Vendor.objects.filter(
            Q(business_category='others') &
            (Q(business_name__icontains=keyword) | 
             Q(specific_category__icontains=keyword))
        )
        
        serializer = VendorDetailSerializer(services, many=True)
        return Response(serializer.data)


def send_user_notification_email(email, application, service):
    """Send confirmation email to the user who submitted the application"""
    subject = f"Your application for {service.business_name} has been received"
    
    # Context data for the template
    context = {
        'application': application,
        'service': service,
        'user_name': application.name,
        'service_name': service.business_name,
        'preferred_date': application.preferred_date,
        'description': application.description,
    }
    
    # Render HTML template
    html_message = render_to_string('email/service_application.html', context)
    # Create plain text version by stripping HTML tags
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,  # Plain text version
        settings.EMAIL_HOST_USER,
        [email],
        html_message=html_message,  # HTML version
        fail_silently=False,
    )

def send_vendor_notification_email(email, application, service):
    """Send notification email to the vendor about the new application"""
    subject = f"New service application received"
    
    # Context data for the template
    context = {
        'application': application,
        'service': service,
        'client_name': application.name,
        'client_email': application.email,
        'client_phone': application.phone,
        'description': application.description,
        'preferred_date': application.preferred_date,
        'additional_details': application.additional_details,
        'service_name': service.business_name,
    }
    
    # Render HTML template
    html_message = render_to_string('email/service_notification.html', context)
    # Create plain text version by stripping HTML tags
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,  # Plain text version
        settings.EMAIL_HOST_USER,
        [email],
        html_message=html_message,  # HTML version
        fail_silently=False,
    )

class SearchProductsView(APIView):
    def get(self, request):
        product_name = request.query_params.get('product_name')
        state = request.query_params.get('state')
        school = request.query_params.get('institution')

        try:
            # Start with all products
            products_query = Product.objects.all()
            print(f"\nSearch parameters - Product: {product_name}, State: {state}, School: {school}")

            if product_name:
                # First try to find products matching the name/description/keyword
                products_query = products_query.filter(
                    Q(name__icontains=product_name) |
                    Q(description__icontains=product_name) |
                    Q(keyword__icontains=product_name)
                )
                
                # If no products found, check vendor business names
                if not products_query.exists():
                    print(f"No products found, checking vendor business names for: {product_name}")
                    matching_vendors = Vendor.objects.filter(
                        business_name__icontains=product_name
                    )
                    
                    if matching_vendors.exists():
                        print(f"Found matching vendors: {[v.business_name for v in matching_vendors]}")
                        # Get all products from matching vendors
                        vendor_users = [vendor.user for vendor in matching_vendors]
                        products_query = Product.objects.filter(vendor__in=vendor_users)
                        print(f"Found {products_query.count()} products from matching vendors")

                print(f"Total products found: {products_query.count()}")
                print("Products found:", [p.name for p in products_query])

            # Filter by state and institution if provided
            if state:
                products_query = products_query.filter(vendor__state__iexact=state)
                print(f"After state filter: {products_query.count()} products")

            if school:
                products_query = products_query.filter(vendor__institution__iexact=school)
                print(f"After school filter: {products_query.count()} products")

            # Print the actual SQL query for debugging
            print("\nSQL Query:", products_query.query)

            # Fetch products with related data
            products = products_query.select_related('vendor').all()

            if not products.exists():
                print("No products found matching the criteria")
                return Response({
                    "status": "not_found",
                    "message": "No products found matching your criteria",
                    "search_type": "vendor" if product_name and not products_query.filter(
                        Q(name__icontains=product_name) |
                        Q(description__icontains=product_name) |
                        Q(keyword__icontains=product_name)
                    ).exists() else "product"
                }, status=status.HTTP_404_NOT_FOUND)

            # Serialize the products
            serializer = ProductSerializer(products, many=True, context={'request': request})

            # Return successful response with products
            return Response({
                "status": "success",
                "count": products.count(),
                "products": serializer.data,
                "search_type": "vendor" if product_name and not products_query.filter(
                    Q(name__icontains=product_name) |
                    Q(description__icontains=product_name) |
                    Q(keyword__icontains=product_name)
                ).exists() else "product"
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"\nError in search: {str(e)}")
            print("Full error details:", e)
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SearchSpecificServiceView(APIView):
    def get(self, request):
        specific_category = request.query_params.get('specific_category')
        state = request.query_params.get('state')
        school = request.query_params.get('institution')

        try:
            # Start with all vendors that are service providers
            vendors_query = Vendor.objects.filter(business_category='others')
            print(f"\nSearch parameters - Service: {specific_category}, State: {state}, School: {school}")

            # Filter by specific category if provided (case-insensitive)
            if specific_category and specific_category != 'all':
                vendors_query = vendors_query.filter(
                    specific_category__iexact=specific_category
                )
                print(f"After category filter: Found {vendors_query.count()} vendors")
                print("Vendors found:", [v.business_name for v in vendors_query])

            # Filter by state if provided
            if state:
                vendors_query = vendors_query.filter(user__state__iexact=state)
                print(f"After state filter: {vendors_query.count()} vendors")
                print("Vendors after state filter:", [v.business_name for v in vendors_query])

            # Filter by school if provided
            if school:
                vendors_query = vendors_query.filter(user__institution__iexact=school)
                print(f"After school filter: {vendors_query.count()} vendors")
                print("Vendors after school filter:", [v.business_name for v in vendors_query])

            # Print the actual SQL query for debugging
            print("\nSQL Query:", vendors_query.query)

            # Fetch vendors with related user data
            vendors = vendors_query.select_related('user').all()

            if not vendors.exists():
                print("No service providers found matching the criteria")
                return Response({
                    "status": "not_found",
                    "message": "No service providers found matching your criteria",
                    "search_params": {
                        "specific_category": specific_category,
                        "state": state,
                        "school": school
                    }
                }, status=status.HTTP_404_NOT_FOUND)

            # Serialize the vendors
            serializer = VendorSerializer(vendors, many=True)
            print(f"\nTotal service providers found: {vendors.count()}")

            return Response({
                "status": "success",
                "count": vendors.count(),
                "services": serializer.data,
                "search_params": {
                    "specific_category": specific_category,
                    "state": state,
                    "school": school
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"\nError in service search: {str(e)}")
            print("Full error details:", e)
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}",
                "search_params": {
                    "specific_category": specific_category,
                    "state": state,
                    "school": school
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AllProductsView(APIView):
    pagination_class = CustomPagination

    def get(self, request):
        try:
            # Parse request parameters
            filters = self._parse_request_params(request)
            
            print(f"Request params - viewOtherProducts: {filters['view_other_products']}, authenticated: {request.user.is_authenticated}")
            if request.user.is_authenticated:
                print(f"User institution: {request.user.institution}")
            if filters['school']:
                print(f"School parameter provided: {filters['school']}")
            
            # Handle different user states separately
            if request.user.is_authenticated:
                if filters['view_other_products']:
                    queryset = self._handle_authenticated_viewing_other_schools(request, filters)
                else:
                    queryset = self._handle_authenticated_viewing_own_school(request, filters)
            else:
                queryset = self._handle_anonymous_user(request, filters)
            
            # Apply KYC filtering first (most restrictive)
            queryset = self._apply_kyc_filtering(queryset)
            
            # Apply common filters and return response
            queryset = self._apply_common_filters(queryset, filters)
            queryset = self._apply_sorting(queryset, filters['sort'])
            
            return self._paginate_and_serialize(queryset, request, filters)

        except Exception as e:
            return self._handle_error(e)

    def _apply_kyc_filtering(self, queryset):
        # Filter to only include products from vendors with approved KYC
        queryset = queryset.filter(vendor__kyc__verification_status='approved')
        print(f"After KYC filtering (approved only): {queryset.count()}")
        return queryset

    def _handle_authenticated_viewing_own_school(self, request, filters):
        print(f"Authenticated user viewing own school: {request.user.institution}")
        print("IGNORING any 'school' parameter - user can only see their own institution")
        
        # Start with all products, then filter ONLY by user's institution
        queryset = Product.objects.all()
        queryset = queryset.filter(vendor__institution__iexact=request.user.institution)
        
        print(f"Products from user's institution ({request.user.institution}): {queryset.count()}")
        
        return queryset

    def _handle_authenticated_viewing_other_schools(self, request, filters):
        print("Authenticated user viewing other schools")
        
        # Start with all products
        queryset = Product.objects.all()
        
        # If they specify a particular school, filter by that school
        if filters['school']:
            print(f"Filtering by specific school: {filters['school']}")
            queryset = queryset.filter(vendor__institution__iexact=filters['school'])
            print(f"Products from specified school: {queryset.count()}")
        else:
            # No school specified = show products from ALL schools
            print(f"Showing products from all schools: {queryset.count()}")
        
        return queryset

    def _handle_anonymous_user(self, request, filters):
        
        print("Anonymous user browsing products")
        
        # Start with all products
        queryset = Product.objects.all()
        
        # If they specify a school, filter by that school
        if filters['school']:
            print(f"Anonymous user filtering by school: {filters['school']}")
            queryset = queryset.filter(vendor__institution__iexact=filters['school'])
            print(f"Products from specified school: {queryset.count()}")
        else:
            # No school specified = show products from ALL schools
            print(f"Anonymous user seeing all products: {queryset.count()}")
        
        return queryset

    def _apply_common_filters(self, queryset, filters):
        
        # Category filter
        if filters['category']:
            queryset = queryset.filter(vendor__vendor_profile__business_category__iexact=filters['category'])
            print(f"After category filter: {queryset.count()}")

        # Price range filter
        queryset = queryset.filter(
            price__gte=filters['min_price'], 
            price__lte=filters['max_price']
        )
        print(f"After price filter: {queryset.count()}")

        # Search filter
        if filters['search']:
            queryset = queryset.filter(
                models.Q(name__icontains=filters['search']) |
                models.Q(description__icontains=filters['search'])
            )
            print(f"After search filter: {queryset.count()}")

        # State filter
        if filters['state']:
            queryset = queryset.filter(vendor__state__iexact=filters['state'])
            print(f"After state filter: {queryset.count()}")

        # Vendor filter
        if filters['vendor']:
            queryset = queryset.filter(vendor__vendor_profile__business_name__iexact=filters['vendor'])
            print(f"After vendor filter: {queryset.count()}")

        return queryset

    def _apply_sorting(self, queryset, sort_option):
        """Apply sorting based on user's choice"""
        if sort_option == 'price_low':
            return queryset.order_by('price')
        elif sort_option == 'price_high':
            return queryset.order_by('-price')
        elif sort_option == 'rating':
            return queryset.order_by('-vendor__rating')
        else:  # default to 'newest'
            return queryset.order_by('-created_at')

    def _parse_request_params(self, request):
        """Parse and validate all request parameters"""
        params = request.query_params
        
        # Parse price filters with error handling
        try:
            min_price = Decimal(params.get('minPrice')) if params.get('minPrice') else Decimal('0')
        except (ValueError, TypeError):
            min_price = Decimal('0')

        try:
            max_price = Decimal(params.get('maxPrice')) if params.get('maxPrice') else Decimal('999999999')
        except (ValueError, TypeError):
            max_price = Decimal('999999999')

        return {
            'category': params.get('category', '').strip(),
            'min_price': min_price,
            'max_price': max_price,
            'search': params.get('search', '').strip(),
            'sort': params.get('sort', 'newest'),
            'state': params.get('state', '').strip(),
            'school': params.get('school', '').strip(),
            'vendor': params.get('vendor', '').strip(),
            'view_other_products': params.get('viewOtherProducts', '').lower() == 'true'
        }

    def _paginate_and_serialize(self, queryset, request, filters):
        """Handle pagination and serialization"""
        print(f"Final product count: {queryset.count()}")
        
        # Pagination
        paginator = self.pagination_class()
        paginated_products = paginator.paginate_queryset(queryset, request)
        
        # Serialization
        serializer = ProductSerializer(paginated_products, many=True)
        response = paginator.get_paginated_response(serializer.data)
        
        # Add metadata
        response.data['user_institution'] = request.user.institution if request.user.is_authenticated else None
        response.data['view_other_products'] = filters['view_other_products']
        response.data['total_products'] = queryset.count()
        
        # Calculate user's institution product count for authenticated users
        if request.user.is_authenticated:
            # Also apply KYC filtering to user's institution product count
            user_institution_products = Product.objects.filter(
                vendor__institution__iexact=request.user.institution,
                vendor__kyc__verification_status='approved'
            ).count()
            response.data['user_institution_product_count'] = user_institution_products
        else:
            response.data['user_institution_product_count'] = None
        
        return response

    def _handle_error(self, error):
        """Handle errors gracefully"""
        print(f"Error in AllProductsView: {str(error)}")
        return Response(
            {
                'error': 'An error occurred while processing your request.',
                'detail': str(error)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        

class CreateVendorReviewView(APIView):
    """Create a vendor review"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = VendorReviewSerializer(data=request.data, context={'request': request})
            
            if serializer.is_valid():
                order_id = serializer.validated_data['order'].id
                vendor_id = serializer.validated_data['vendor'].id
                
                # Check if order belongs to the current user
                order = get_object_or_404(Order, id=order_id, user=request.user)
                
                # Check if review already exists
                if VendorReview.objects.filter(order=order, vendor_id=vendor_id).exists():
                    return Response({
                        'error': 'You have already reviewed this vendor for this order'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if order is completed
                if order.order_status.upper() != 'COMPLETED':
                    return Response({
                        'error': 'You can only review completed orders'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                review = serializer.save()
                
                # Update vendor's average rating
                update_vendor_rating(vendor_id)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreatePickerReviewView(APIView):
    """Create a picker review"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = PickerReviewSerializer(data=request.data, context={'request': request})
            
            if serializer.is_valid():
                order_id = serializer.validated_data['order'].id
                picker_id = serializer.validated_data['picker'].id
                
                # Check if order belongs to the current user
                order = get_object_or_404(Order, id=order_id, user=request.user)
                
                # Check if review already exists
                if PickerReview.objects.filter(order=order, picker_id=picker_id).exists():
                    return Response({
                        'error': 'You have already reviewed this picker for this order'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if order is completed
                if order.order_status.upper() != 'COMPLETED':
                    return Response({
                        'error': 'You can only review completed orders'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                review = serializer.save()
                
                # Update picker's average rating
                update_picker_rating(picker_id)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmitReviewsView(APIView):
    """Submit both vendor and picker reviews in one request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            serializer = ReviewSubmissionSerializer(data=request.data)
            
            if serializer.is_valid():
                data = serializer.validated_data
                order_id = data['order_id']
                
                # Check if order belongs to the current user
                order = get_object_or_404(Order, id=order_id, user=request.user)
                
                # Check if order is completed
                if order.order_status.upper() != 'COMPLETED':
                    return Response({
                        'error': 'You can only review completed orders'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if reviews already exist
                vendor_review_exists = VendorReview.objects.filter(
                    order=order, vendor_id=data['vendor_id']
                ).exists()
                picker_review_exists = PickerReview.objects.filter(
                    order=order, picker_id=data['picker_id']
                ).exists()
                
                if vendor_review_exists or picker_review_exists:
                    return Response({
                        'error': 'You have already reviewed this order'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Create both reviews in a transaction
                with transaction.atomic():
                    # Create vendor review
                    vendor_review = VendorReview.objects.create(
                        order=order,
                        vendor_id=data['vendor_id'],
                        reviewer=request.user,
                        rating=data['vendor_rating'],
                        comment=data.get('vendor_comment', '')
                    )
                    
                    # Create picker review
                    picker_review = PickerReview.objects.create(
                        order=order,
                        picker_id=data['picker_id'],
                        reviewer=request.user,
                        rating=data['picker_rating'],
                        comment=data.get('picker_comment', '')
                    )
                    
                    # Mark order as reviewed
                    order.reviewed = True
                    order.save()
                    
                    # Update ratings
                    update_vendor_rating(data['vendor_id'])
                    update_picker_rating(data['picker_id'])
                
                return Response({
                    'message': 'Reviews submitted successfully',
                    'vendor_review': VendorReviewSerializer(vendor_review).data,
                    'picker_review': PickerReviewSerializer(picker_review).data
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def update_vendor_rating(vendor_id):
    """Update vendor's average rating"""
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        reviews = VendorReview.objects.filter(vendor=vendor)
        
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            avg_rating = total_rating / reviews.count()
            vendor.rating = round(avg_rating, 2)
            vendor.total_ratings = reviews.count()
            vendor.save()
    except Vendor.DoesNotExist:
        pass


def update_picker_rating(picker_id):
    """Update picker's average rating"""
    try:
        picker_user = User.objects.get(id=picker_id)
        reviews = PickerReview.objects.filter(picker=picker_user)
        
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            avg_rating = total_rating / reviews.count()
            
            # Update rating based on user type
            if hasattr(picker_user, 'picker_profile'):
                picker_user.picker_profile.rating = round(avg_rating, 2)
                picker_user.picker_profile.save()
            elif hasattr(picker_user, 'student_picker_profile'):
                picker_user.student_picker_profile.rating = round(avg_rating, 2)
                picker_user.student_picker_profile.save()
    except User.DoesNotExist:
        pass


class ProductReviewListView(APIView):
    """
    Get all reviews for a specific product with statistics
    """
    
    def get(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            reviews = ProductReview.objects.filter(product=product).select_related('reviewer', 'order')
            
            # Calculate review statistics
            review_stats = reviews.aggregate(
                total_reviews=Count('id'),
                average_rating=Avg('rating')
            )
            
            # Rating breakdown (count of each rating 1-5)
            rating_breakdown = {}
            for i in range(1, 6):
                rating_breakdown[i] = reviews.filter(rating=i).count()
            
            # Serialize reviews
            serialized_reviews = []
            for review in reviews:
                serialized_reviews.append({
                    'id': review.id,
                    'rating': review.rating,
                    'comment': review.comment,
                    'reviewer_name': review.reviewer_name,
                    'created_at': review.created_at.strftime('%B %d, %Y'),
                    'order_number': review.order.order_number if review.order else None,
                })
            
            return Response({
                'reviews': serialized_reviews,
                'stats': {
                    'total_reviews': review_stats['total_reviews'] or 0,
                    'average_rating': round(review_stats['average_rating'] or 0, 1),
                    'rating_breakdown': rating_breakdown
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching product reviews: {str(e)}")
            return Response(
                {'error': 'Failed to fetch reviews'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserReviewStatusView(APIView):
    """
    Check if user has bought the product and if they've already reviewed it
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            user = request.user
            
            # Check if user has bought this product
            has_bought = OrderItem.objects.filter(
                product=product,
                order__user=user,
                order__order_status__in=['DELIVERED', 'COMPLETED']  # Only completed orders
            ).exists()
            
            # Check if user has already reviewed this product
            existing_review = ProductReview.objects.filter(
                product=product,
                reviewer=user
            ).first()
            
            has_reviewed = existing_review is not None
            
            review_data = None
            if existing_review:
                review_data = {
                    'id': existing_review.id,
                    'rating': existing_review.rating,
                    'comment': existing_review.comment,
                    'created_at': existing_review.created_at.strftime('%B %d, %Y'),
                }
            
            return Response({
                'has_bought': has_bought,
                'has_reviewed': has_reviewed,
                'existing_review': review_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error checking user review status: {str(e)}")
            return Response(
                {'error': 'Failed to check review status'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductReviewCreateView(APIView):
    """
    Create a new product review
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            user = request.user
            
            # Validate request data
            rating = request.data.get('rating')
            comment = request.data.get('comment', '').strip()
            
            if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be an integer between 1 and 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user has bought this product
            order_item = OrderItem.objects.filter(
                product=product,
                order__user=user,
                order__order_status__in=['DELIVERED', 'COMPLETED']
            ).select_related('order').first()
            
            if not order_item:
                return Response(
                    {'error': 'You can only review products you have purchased'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user has already reviewed this product
            existing_review = ProductReview.objects.filter(
                product=product,
                reviewer=user
            ).first()
            
            if existing_review:
                return Response(
                    {'error': 'You have already reviewed this product'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the review
            review = ProductReview.objects.create(
                product=product,
                reviewer=user,
                order=order_item.order,
                rating=rating,
                comment=comment if comment else None
            )
            
            return Response({
                'message': 'Review created successfully',
                'review': {
                    'id': review.id,
                    'rating': review.rating,
                    'comment': review.comment,
                    'reviewer_name': review.reviewer_name,
                    'created_at': review.created_at.strftime('%B %d, %Y'),
                }
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating product review: {str(e)}")
            return Response(
                {'error': 'Failed to create review'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductReviewDetailView(APIView):
    """
    Update or delete an existing product review
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, product_id, review_id):
        """Update an existing product review"""
        try:
            product = get_object_or_404(Product, id=product_id)
            review = get_object_or_404(
                ProductReview, 
                id=review_id, 
                product=product, 
                reviewer=request.user
            )
            
            # Validate request data
            rating = request.data.get('rating')
            comment = request.data.get('comment', '').strip()
            
            if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be an integer between 1 and 5'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the review
            review.rating = rating
            review.comment = comment if comment else None
            review.updated_at = timezone.now()
            review.save()
            
            return Response({
                'message': 'Review updated successfully',
                'review': {
                    'id': review.id,
                    'rating': review.rating,
                    'comment': review.comment,
                    'reviewer_name': review.reviewer_name,
                    'created_at': review.created_at.strftime('%B %d, %Y'),
                    'updated_at': review.updated_at.strftime('%B %d, %Y'),
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error updating product review: {str(e)}")
            return Response(
                {'error': 'Failed to update review'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, product_id, review_id):
        """Delete a product review"""
        try:
            product = get_object_or_404(Product, id=product_id)
            review = get_object_or_404(
                ProductReview, 
                id=review_id, 
                product=product, 
                reviewer=request.user
            )
            
            review.delete()
            
            return Response(
                {'message': 'Review deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error deleting product review: {str(e)}")
            return Response(
                {'error': 'Failed to delete review'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserReviewListView(APIView):
    """
    Get all reviews written by the current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            reviews = ProductReview.objects.filter(reviewer=request.user).select_related('product', 'order')
            
            serialized_reviews = []
            for review in reviews:
                serialized_reviews.append({
                    'id': review.id,
                    'product_name': review.product.name,
                    'product_id': review.product.id,
                    'rating': review.rating,
                    'comment': review.comment,
                    'created_at': review.created_at.strftime('%B %d, %Y'),
                    'order_number': review.order.order_number if review.order else None,
                })
            
            return Response({
                'reviews': serialized_reviews
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching user reviews: {str(e)}")
            return Response(
                {'error': 'Failed to fetch user reviews'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetBothVideosView(APIView):
    """Get both register and product videos"""
    
    def get(self, request):
        try:
            register_video = RegisterVideo.objects.first()
            product_video = AddProductVideo.objects.first()
            
            register_data = None
            product_data = None
            
            if register_video:
                register_serializer = RegisterVideoSerializer(register_video)
                register_data = register_serializer.data
                
            if product_video:
                product_serializer = AddProductVideoSerializer(product_video)
                product_data = product_serializer.data
                
            return Response({
                'success': True,
                'register_video': register_data,
                'product_video': product_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class MySubmittedApplicationsAPIView(APIView):
    """
    Get all service applications submitted by the authenticated user (client perspective)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all applications submitted by this user
        applications = ServiceApplication.objects.filter(
            user=user
        ).select_related('service', 'service__user')
        
        # Optional filtering by status
        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)
        
        if not applications.exists():
            return Response(
                {'message': 'You have not submitted any applications', 'applications': []}, 
                status=status.HTTP_200_OK
            )
        
        # Serialize the applications
        serializer = ServiceApplicationSerializer(applications, many=True)
        
        return Response({
            'message': f'You have {applications.count()} submitted application(s)',
            'applications': serializer.data
        }, status=status.HTTP_200_OK)
    

# views.py for unified messaging system




class BaseMessagingView(View):
    """Base class for messaging views with common functionality"""
    
    def get_user_type_and_profile(self, user):
        """Determine if user is a vendor or regular user"""
        try:
            vendor_profile = user.vendor_profile
            return 'vendor', vendor_profile
        except:
            return 'user', user
    
    def get_conversations_for_user(self, user, user_type):
        """Get conversations for a user based on their type"""
        if user_type == 'vendor':
            conversations = Conversation.objects.filter(
                vendor=user.vendor_profile,
                is_active=True
            ).select_related('user', 'vendor', 'service_application')
        else:
            conversations = Conversation.objects.filter(
                user=user,
                is_active=True
            ).select_related('user', 'vendor', 'service_application')
        
        return conversations.order_by('-updated_at')
    
    def get_unread_count(self, conversation, user, user_type):
        """Get unread message count for a conversation"""
        try:
            read_status = MessageReadStatus.objects.get(
                conversation=conversation,
                reader_type=user_type,
                **{f'reader_{user_type}': user.vendor_profile if user_type == 'vendor' else user}
            )
            
            if read_status.last_read_message:
                unread_count = Message.objects.filter(
                    conversation=conversation,
                    created_at__gt=read_status.last_read_message.created_at
                ).exclude(
                    **{f'sender_{user_type}': user.vendor_profile if user_type == 'vendor' else user}
                ).count()
            else:
                unread_count = Message.objects.filter(
                    conversation=conversation
                ).exclude(
                    **{f'sender_{user_type}': user.vendor_profile if user_type == 'vendor' else user}
                ).count()
                
        except MessageReadStatus.DoesNotExist:
            unread_count = Message.objects.filter(
                conversation=conversation
            ).exclude(
                **{f'sender_{user_type}': user.vendor_profile if user_type == 'vendor' else user}
            ).count()
        
        return unread_count


@method_decorator(login_required, name='dispatch')
class ConversationListView(BaseMessagingView):
    """Get list of conversations for current user"""
    
    def get(self, request):
        user = request.user
        user_type, profile = self.get_user_type_and_profile(user)
        
        conversations = self.get_conversations_for_user(user, user_type)
        
        conversations_data = []
        for conv in conversations:
            # Get participant info
            if user_type == 'vendor':
                participant = conv.user
                participant_name = f"{participant.first_name} {participant.last_name}".strip()
                participant_email = participant.email
            else:
                participant = conv.vendor
                participant_name = participant.business_name
                participant_email = participant.user.email if participant.user else ""
            
            # Get unread count
            unread_count = self.get_unread_count(conv, user, user_type)
            
            conversations_data.append({
                'id': conv.id,
                'participant_name': participant_name,
                'participant_email': participant_email,
                'service_name': conv.service_name,
                'service_application_id': conv.service_application.id if conv.service_application else None,
                'last_message': conv.last_message,
                'last_message_sender': conv.last_message_sender,
                'last_message_at': conv.last_message_at.isoformat() if conv.last_message_at else None,
                'updated_at': conv.updated_at.isoformat(),
                'unread_count': unread_count,
                'is_active': conv.is_active,
            })
        
        return JsonResponse({
            'success': True,
            'conversations': conversations_data,
            'user_type': user_type
        })


@method_decorator(login_required, name='dispatch')
class CreateConversationView(BaseMessagingView):
    """Create a new conversation"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            user = request.user
            user_type, profile = self.get_user_type_and_profile(user)
            
            # Get required parameters based on user type
            if user_type == 'vendor':
                # Vendor creating conversation with user
                user_id = data.get('user_id')
                service_application_id = data.get('service_application_id')
                
                if not user_id:
                    return JsonResponse({
                        'success': False,
                        'error': 'user_id is required'
                    }, status=400)
                
                target_user = get_object_or_404(User, id=user_id)
                vendor_profile = profile
                
            else:
                # User creating conversation with vendor
                vendor_id = data.get('vendor_id')
                service_application_id = data.get('service_application_id')
                
                if not vendor_id:
                    return JsonResponse({
                        'success': False,
                        'error': 'vendor_id is required'
                    }, status=400)
                
                vendor_profile = get_object_or_404(Vendor, id=vendor_id)
                target_user = user
            
            # Check if conversation already exists
            existing_conversation = Conversation.objects.filter(
                user=target_user,
                vendor=vendor_profile
            )
            
            if service_application_id:
                service_application = get_object_or_404(ServiceApplication, id=service_application_id)
                existing_conversation = existing_conversation.filter(service_application=service_application)
            
            existing_conversation = existing_conversation.first()
            
            if existing_conversation:
                conversation = existing_conversation
            else:
                # Create new conversation
                conversation_data = {
                    'user': target_user,
                    'vendor': vendor_profile,
                }
                
                if service_application_id:
                    conversation_data['service_application'] = service_application
                    conversation_data['service_name'] = vendor_profile.business_name
                
                # Add service info if provided
                service_id = data.get('service_id')
                service_name = data.get('service_name')
                if service_id:
                    conversation_data['service_id'] = service_id
                if service_name:
                    conversation_data['service_name'] = service_name
                
                conversation = Conversation.objects.create(**conversation_data)
            
            # Return conversation data
            participant_name = (
                f"{target_user.first_name} {target_user.last_name}".strip() 
                if user_type == 'vendor' 
                else vendor_profile.business_name
            )
            
            return JsonResponse({
                'success': True,
                'conversation': {
                    'id': conversation.id,
                    'participant_name': participant_name,
                    'service_name': conversation.service_name,
                    'created_at': conversation.created_at.isoformat(),
                    'is_active': conversation.is_active,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


@method_decorator(login_required, name='dispatch')
class MessageListView(BaseMessagingView):
    """Get messages for a specific conversation"""
    
    def get(self, request, conversation_id):
        user = request.user
        user_type, profile = self.get_user_type_and_profile(user)
        
        # Get conversation and verify user has access
        if user_type == 'vendor':
            conversation = get_object_or_404(
                Conversation, 
                id=conversation_id, 
                vendor=profile
            )
        else:
            conversation = get_object_or_404(
                Conversation, 
                id=conversation_id, 
                user=user
            )
        
        # Get messages with pagination
        page = request.GET.get('page', 1)
        messages = Message.objects.filter(
            conversation=conversation
        ).select_related('sender_user', 'sender_vendor').order_by('created_at')
        
        paginator = Paginator(messages, 50)  # 50 messages per page
        messages_page = paginator.get_page(page)
        
        messages_data = []
        for message in messages_page:
            messages_data.append({
                'id': message.id,
                'content': message.content,
                'sender_type': message.sender_type,
                'sender_name': message.get_sender_name(),
                'created_at': message.created_at.isoformat(),
                'is_read': message.is_read,
                'message_type': message.message_type,
            })
        
        # Mark messages as read for current user
        self._mark_messages_as_read(conversation, user, user_type, messages_page.object_list)
        
        return JsonResponse({
            'success': True,
            'messages': messages_data,
            'has_next': messages_page.has_next(),
            'has_previous': messages_page.has_previous(),
            'total_pages': paginator.num_pages,
            'current_page': messages_page.number,
        })
    
    def _mark_messages_as_read(self, conversation, user, user_type, messages):
        """Mark messages as read for the current user"""
        if not messages:
            return
        
        latest_message = messages[-1]  # Last message in the list
        
        # Update or create read status
        read_status_data = {
            'conversation': conversation,
            'reader_type': user_type,
            'last_read_message': latest_message,
        }
        
        if user_type == 'vendor':
            read_status_data['reader_vendor'] = user.vendor_profile
            read_status_data['reader_user'] = None
        else:
            read_status_data['reader_user'] = user
            read_status_data['reader_vendor'] = None
        
        MessageReadStatus.objects.update_or_create(
            conversation=conversation,
            reader_type=user_type,
            **{f'reader_{user_type}': user.vendor_profile if user_type == 'vendor' else user},
            defaults=read_status_data
        )


@method_decorator(login_required, name='dispatch')
class SendMessageView(BaseMessagingView):
    """Send a message in a conversation"""
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            user = request.user
            user_type, profile = self.get_user_type_and_profile(user)
            
            conversation_id = data.get('conversation_id')
            content = data.get('content', '').strip()
            
            if not conversation_id or not content:
                return JsonResponse({
                    'success': False,
                    'error': 'conversation_id and content are required'
                }, status=400)
            
            # Get conversation and verify user has access
            if user_type == 'vendor':
                conversation = get_object_or_404(
                    Conversation, 
                    id=conversation_id, 
                    vendor=profile
                )
            else:
                conversation = get_object_or_404(
                    Conversation, 
                    id=conversation_id, 
                    user=user
                )
            
            # Create message
            message_data = {
                'conversation': conversation,
                'content': content,
                'sender_type': user_type,
                'message_type': data.get('message_type', 'text'),
            }
            
            if user_type == 'vendor':
                message_data['sender_vendor'] = profile
            else:
                message_data['sender_user'] = user
            
            message = Message.objects.create(**message_data)
            
            return JsonResponse({
                'success': True,
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'sender_type': message.sender_type,
                    'sender_name': message.get_sender_name(),
                    'created_at': message.created_at.isoformat(),
                    'message_type': message.message_type,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
