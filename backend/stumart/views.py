from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from user.models import Vendor
from django.shortcuts import get_list_or_404
from user.serializers import VendorSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import (
    # existing model serializers
    ProductSerializer,
    ProductCreateSerializer,
    VendorDetailSerializer,
    ServiceApplicationSerializer,
    VendorReviewSerializer,
    PickerReviewSerializer,
    ReviewSubmissionSerializer,
    RegisterVideoSerializer,
    AddProductVideoSerializer,
    # request serializers
    SpecificVendorProductsQuerySerializer,
    VendorsByCategoryQuerySerializer,
    VendorsBySchoolAndCategoryQuerySerializer,
    AllProductsQuerySerializer,
    SearchProductsQuerySerializer,
    SearchServicesQuerySerializer,
    SearchSpecificServiceQuerySerializer,
    ServiceApplicationCreateBodySerializer,
    ApplicationStatusUpdateBodySerializer,
    MySubmittedApplicationsQuerySerializer,
    VendorReviewCreateBodySerializer,
    PickerReviewCreateBodySerializer,
    SubmitReviewsBodySerializer,
    ProductCreateBodySerializer,
    ProductReviewCreateBodySerializer,
    ProductReviewUpdateBodySerializer,
    # response serializers
    SpecificVendorProductsResponseSerializer,
    GetVendorResponseSerializer,
    ProductCreateResponseSerializer,
    ProductUpdateResponseSerializer,
    ProductDeleteResponseSerializer,
    SearchProductsResponseSerializer,
    SearchSpecificServiceResponseSerializer,
    ServiceApplicationCreateResponseSerializer,
    MySubmittedApplicationsResponseSerializer,
    ReviewSubmitResponseSerializer,
    ProductReviewListResponseSerializer,
    UserReviewStatusResponseSerializer,
    ProductReviewCreateResponseSerializer,
    ProductReviewUpdateResponseSerializer,
    ProductReviewDeleteResponseSerializer,
    UserReviewListResponseSerializer,
    BothVideosResponseSerializer,
)
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.renderers import JSONRenderer
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from decimal import Decimal, InvalidOperation
import requests
import json
import uuid
import logging
logger = logging.getLogger(__name__)
from rest_framework import generics
from django.utils import timezone
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.http import HttpResponse
from weasyprint import HTML
from io import BytesIO
from django.utils.timezone import now
from . paginations import CustomPagination
from django.db import transaction
from rest_framework import generics, status
from django.db.models import Avg, Count, Q, Max, Prefetch, OuterRef, Subquery
from .models import Product, VendorReview, Vendor
from user.models import Vendor
from django.utils.html import strip_tags
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.core.paginator import Paginator
from .models import ServiceApplication


class SpecificVendorProductsView(APIView):
    """
    Get all products for a specific vendor with pagination.

    Request:  SpecificVendorProductsQuerySerializer  (query params)
    Response: SpecificVendorProductsResponseSerializer
    """
    # what the view reads from the request
    request_serializer_class  = SpecificVendorProductsQuerySerializer
    # what the view returns in the response
    serializer_class           = SpecificVendorProductsResponseSerializer

    def get(self, request, id):
        try:
            vendor = get_object_or_404(Vendor, id=id)
            products = Product.objects.filter(vendor=vendor.user)

            page = int(request.query_params.get("page", 1))
            page_size = int(request.query_params.get("page_size", 20))
            paginator = Paginator(products, page_size)

            try:
                paginated_products = paginator.page(page)
            except Exception:
                return Response(
                    {"error": "Invalid page number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            business_data = {
                "business_name": vendor.business_name,
                "shop_image": request.build_absolute_uri(vendor.shop_image.url) if vendor.shop_image else None,
                "business_category": vendor.business_category,
                "business_description": vendor.business_description,
                "rating": vendor.rating
            }

            serializer = ProductSerializer(paginated_products, many=True, context={'request': request})
            product_data = serializer.data

            if vendor.business_category and vendor.business_category.lower() == "food":
                for product in product_data:
                    product.pop("in_stock", None)

            return Response(
                {
                    "vendor_details": business_data,
                    "products": product_data,
                    "pagination": {
                        "current_page": paginated_products.number,
                        "total_pages": paginator.num_pages,
                        "total_products": paginator.count,
                        "has_next": paginated_products.has_next(),
                        "has_previous": paginated_products.has_previous(),
                        "page_size": page_size,
                    }
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VendorsByOtherView(APIView):
    """
    Get vendors filtered by business category (and optionally specific_category).
    Only vendors with approved KYC are returned.

    Request:  VendorsByCategoryQuerySerializer  (query params)
    Response: VendorSerializer[]
    """
    request_serializer_class = VendorsByCategoryQuerySerializer
    serializer_class          = VendorSerializer

    def get(self, request):
        category = request.query_params.get("business_category", None)
        specific_category = request.query_params.get("specific_category", None)

        if not category:
            return Response(
                {"error": "The category name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            filters = {"business_category__iexact": category}
            if specific_category:
                filters["specific_category__iexact"] = specific_category

            vendors = Vendor.objects.filter(**filters)
            vendors = self._apply_kyc_filtering(vendors)

            if not vendors.exists():
                return Response(
                    {"error": "No vendor found for this category"},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = VendorSerializer(vendors, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _apply_kyc_filtering(self, queryset):
        queryset = queryset.filter(user__kyc__verification_status='approved')
        print(f"After KYC filtering (approved vendors only): {queryset.count()}")
        return queryset


class VendorsByOtherandSchoolView(APIView):
    """
    Get vendors filtered by school/institution (and optionally category).
    Authenticated users: institution derived from their account.
    Unauthenticated users: must pass 'school' query param.
    Only vendors with approved KYC are returned.

    Request:  VendorsBySchoolAndCategoryQuerySerializer  (query params)
    Response: VendorSerializer[]
    """
    request_serializer_class = VendorsBySchoolAndCategoryQuerySerializer
    serializer_class          = VendorSerializer

    def get(self, request):
        try:
            category = request.query_params.get("business_category", None)
            specific_category = request.query_params.get("specific_category", None)
            school_name = request.query_params.get("school", None)

            if request.user.is_authenticated:
                user_institution = getattr(request.user, 'institution', None)

                if not user_institution:
                    return Response(
                        {"error": "Authenticated user must have an institution"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                users_in_school = User.objects.filter(institution__iexact=user_institution)

                if not users_in_school.exists():
                    return Response(
                        {"error": "No users found for your institution"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                vendors = Vendor.objects.filter(user__in=users_in_school)
                vendors = self._apply_kyc_filtering(vendors)

                if category:
                    vendors = vendors.filter(business_category__iexact=category)
                if specific_category:
                    vendors = vendors.filter(specific_category__iexact=specific_category)

                if not vendors.exists():
                    return Response(
                        {"error": "No vendors found matching the criteria in your institution"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                serializer = VendorSerializer(vendors, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            else:
                if not school_name:
                    return Response(
                        {"error": "The school name is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                users_in_school = User.objects.filter(institution__iexact=school_name)

                if not users_in_school.exists():
                    return Response(
                        {"error": "No users found for this school"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                vendors = Vendor.objects.filter(user__in=users_in_school)
                vendors = self._apply_kyc_filtering(vendors)

                if category:
                    vendors = vendors.filter(business_category__iexact=category)
                if specific_category:
                    vendors = vendors.filter(specific_category__iexact=specific_category)

                if not vendors.exists():
                    return Response(
                        {"error": "No vendor found matching the criteria"},
                        status=status.HTTP_404_NOT_FOUND
                    )

                serializer = VendorSerializer(vendors, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _apply_kyc_filtering(self, queryset):
        queryset = queryset.filter(user__kyc__verification_status='approved')
        print(f"After KYC filtering (approved vendors only): {queryset.count()}")
        return queryset


class ProductView(APIView):
    """
    Get a single product by ID with all related data (images, sizes, colors).

    Request:  No body or query params needed — product ID is in the URL
    Response: ProductSerializer
    """
    serializer_class = ProductSerializer

    def get(self, request, id):
        try:
            product = (
                Product.objects
                .select_related('vendor__vendor_profile')
                .prefetch_related('additional_images', 'sizes', 'colors')
                .get(id=id)
            )
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class GetVendorView(APIView):
    """
    Get the authenticated vendor's info before creating a product.
    Use business_category in the response to decide which fields to show in the form.

    Request:  No body or query params needed
    Response: GetVendorResponseSerializer
    """
    permission_classes    = [IsAuthenticated]
    serializer_class      = GetVendorResponseSerializer

    def get(self, request, *args, **kwargs):
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
    """
    GET  — List all products belonging to the authenticated vendor.
    POST — Create a new product (multipart/form-data).

    GET Request:  No params needed
    GET Response: ProductSerializer[]

    POST Request:  ProductCreateBodySerializer  (multipart/form-data)
    POST Response: ProductCreateResponseSerializer
    """
    permission_classes           = [IsAuthenticated]
    request_serializer_class     = ProductCreateBodySerializer    # POST
    serializer_class             = ProductCreateResponseSerializer # POST response
                                                                   # GET response is ProductSerializer[]

    def get(self, request, *args, **kwargs):
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
        try:
            user = request.user
            if user.user_type == "vendor":
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
    """
    GET    — Retrieve a specific product (vendor must own it).
    PUT    — Update a product (multipart/form-data).
    DELETE — Delete a product.

    GET Response:    ProductSerializer
    PUT Request:     ProductCreateBodySerializer  (multipart/form-data)
    PUT Response:    ProductUpdateResponseSerializer
    DELETE Response: ProductDeleteResponseSerializer
    """
    permission_classes           = [IsAuthenticated]
    parser_classes               = [MultiPartParser, FormParser]
    request_serializer_class     = ProductCreateBodySerializer       # PUT
    serializer_class             = ProductUpdateResponseSerializer    # PUT response

    def get_object(self, pk, request):
        product = get_object_or_404(Product, pk=pk)
        user = request.user
        vendor = Vendor.objects.get(user=user)
        if product.vendor != vendor.user:
            return None
        return product

    def get(self, request, pk, *args, **kwargs):
        product = self.get_object(pk, request)
        if not product:
            return Response(
                {"error": "Product not found or you don't have permission to view it"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    def put(self, request, pk, *args, **kwargs):
        product = self.get_object(pk, request)
        if not product:
            return Response(
                {"error": "Product not found or you don't have permission to update it"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ProductCreateSerializer(
            product, data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Product updated successfully", "data": serializer.data})
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, *args, **kwargs):
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
    """
    Get details of a single service vendor by ID.

    Request:  No params needed — pk is in the URL
    Response: VendorSerializer
    """
    serializer_class = VendorSerializer

    def get(self, request, pk):
        service = get_object_or_404(Vendor, pk=pk, business_category='others')
        serializer = VendorSerializer(service)
        return Response(serializer.data)


class ServiceApplicationAPIView(APIView):
    """
    Submit a service application.
    Authentication optional — if authenticated, application is linked to the user account.

    Request:  ServiceApplicationCreateBodySerializer  (JSON body)
    Response: ServiceApplicationCreateResponseSerializer
    """
    request_serializer_class = ServiceApplicationCreateBodySerializer
    serializer_class          = ServiceApplicationCreateResponseSerializer

    def post(self, request):
        service_id = request.data.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        service = get_object_or_404(Vendor, pk=service_id, business_category='others')

        application_data = {
            'service': service.id,
            'name': request.data.get('name'),
            'email': request.data.get('email'),
            'phone': request.data.get('phone'),
            'description': request.data.get('description'),
            'preferred_date': request.data.get('preferredDate'),
            'additional_details': request.data.get('additionalDetails'),
        }

        if request.user.is_authenticated:
            application_data['user'] = request.user.id

        serializer = ServiceApplicationSerializer(data=application_data)

        if serializer.is_valid():
            application = serializer.save()
            send_user_notification_email(application_data['email'], application, service)
            send_vendor_notification_email(service.user.email, application, service)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserServiceApplicationsAPIView(APIView):
    """
    Get all service applications submitted by the authenticated user.

    Request:  No params needed
    Response: ServiceApplicationSerializer[]
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ServiceApplicationSerializer

    def get(self, request):
        applications = ServiceApplication.objects.filter(user=request.user)
        serializer = ServiceApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class VendorServiceApplicationsAPIView(APIView):
    """
    Get all service applications for the authenticated vendor's services.

    Request:  No params needed
    Response: ServiceApplicationSerializer[]
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ServiceApplicationSerializer

    def get(self, request):
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
    Update the status of a service application.
    Only the vendor who owns the service can update.

    Request:  ApplicationStatusUpdateBodySerializer  (JSON body)
    Response: ServiceApplicationSerializer  (updated application object)
    """
    permission_classes       = [IsAuthenticated]
    request_serializer_class = ApplicationStatusUpdateBodySerializer
    serializer_class         = ServiceApplicationSerializer

    def put(self, request, pk):
        application = get_object_or_404(ServiceApplication, pk=pk)

        try:
            vendor = Vendor.objects.get(user=request.user)
            if application.service != vendor:
                return Response(
                    {'error': 'You do not have permission to update this application'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Vendor.DoesNotExist:
            return Response({'error': 'User is not a vendor'},
                            status=status.HTTP_403_FORBIDDEN)

        application.status = request.data.get('status', application.status)
        application.vendor_response = request.data.get('vendor_response', application.vendor_response)

        if application.status == 'completed' and not application.completion_date:
            application.completion_date = timezone.now()

        application.save()
        serializer = ServiceApplicationSerializer(application)
        return Response(serializer.data)


class SearchServicesAPIView(APIView):
    """
    Search for service vendors by keyword.

    Request:  SearchServicesQuerySerializer  (query params)
    Response: VendorDetailSerializer[]
    """
    request_serializer_class = SearchServicesQuerySerializer
    serializer_class          = VendorDetailSerializer

    def get(self, request):
        keyword = request.query_params.get('keyword', '')

        if not keyword:
            return Response({'error': 'Keyword parameter is required'},
                            status=status.HTTP_400_BAD_REQUEST)

        services = Vendor.objects.filter(
            Q(business_category='others') &
            (Q(business_name__icontains=keyword) |
             Q(specific_category__icontains=keyword))
        )

        serializer = VendorDetailSerializer(services, many=True)
        return Response(serializer.data)


def send_user_notification_email(email, application, service):
    subject = f"Your application for {service.business_name} has been received"
    context = {
        'application': application,
        'service': service,
        'user_name': application.name,
        'service_name': service.business_name,
        'preferred_date': application.preferred_date,
        'description': application.description,
    }
    html_message = render_to_string('email/service_application.html', context)
    plain_message = strip_tags(html_message)
    send_mail(subject, plain_message, settings.EMAIL_HOST_USER, [email],
              html_message=html_message, fail_silently=False)


def send_vendor_notification_email(email, application, service):
    subject = "New service application received"
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
    html_message = render_to_string('email/service_notification.html', context)
    plain_message = strip_tags(html_message)
    send_mail(subject, plain_message, settings.EMAIL_HOST_USER, [email],
              html_message=html_message, fail_silently=False)


class SearchProductsView(APIView):
    """
    Search products by name, description, or keyword.
    Falls back to vendor business name search if no products match.

    Request:  SearchProductsQuerySerializer  (query params)
    Response: SearchProductsResponseSerializer
    """
    request_serializer_class = SearchProductsQuerySerializer
    serializer_class          = SearchProductsResponseSerializer

    def get(self, request):
        product_name = request.query_params.get('product_name')
        state = request.query_params.get('state')
        school = request.query_params.get('institution')

        try:
            products_query = Product.objects.all()
            print(f"\nSearch parameters - Product: {product_name}, State: {state}, School: {school}")

            if product_name:
                products_query = products_query.filter(
                    Q(name__icontains=product_name) |
                    Q(description__icontains=product_name) |
                    Q(keyword__icontains=product_name)
                )

                if not products_query.exists():
                    print(f"No products found, checking vendor business names for: {product_name}")
                    matching_vendors = Vendor.objects.filter(business_name__icontains=product_name)

                    if matching_vendors.exists():
                        vendor_users = [vendor.user for vendor in matching_vendors]
                        products_query = Product.objects.filter(vendor__in=vendor_users)

            if state:
                products_query = products_query.filter(vendor__state__iexact=state)

            if school:
                products_query = products_query.filter(vendor__institution__iexact=school)

            products = products_query.select_related('vendor').all()

            if not products.exists():
                return Response({
                    "status": "not_found",
                    "message": "No products found matching your criteria",
                    "search_type": "vendor" if product_name and not products_query.filter(
                        Q(name__icontains=product_name) |
                        Q(description__icontains=product_name) |
                        Q(keyword__icontains=product_name)
                    ).exists() else "product"
                }, status=status.HTTP_404_NOT_FOUND)

            serializer = ProductSerializer(products, many=True, context={'request': request})

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
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SearchSpecificServiceView(APIView):
    """
    Search for service vendors by specific_category, state, or institution.

    Request:  SearchSpecificServiceQuerySerializer  (query params)
    Response: SearchSpecificServiceResponseSerializer
    """
    request_serializer_class = SearchSpecificServiceQuerySerializer
    serializer_class          = SearchSpecificServiceResponseSerializer

    def get(self, request):
        specific_category = request.query_params.get('specific_category')
        state = request.query_params.get('state')
        school = request.query_params.get('institution')

        try:
            vendors_query = Vendor.objects.filter(business_category='others')

            if specific_category and specific_category != 'all':
                vendors_query = vendors_query.filter(specific_category__iexact=specific_category)

            if state:
                vendors_query = vendors_query.filter(user__state__iexact=state)

            if school:
                vendors_query = vendors_query.filter(user__institution__iexact=school)

            vendors = vendors_query.select_related('user').all()

            if not vendors.exists():
                return Response({
                    "status": "not_found",
                    "message": "No service providers found matching your criteria",
                    "search_params": {"specific_category": specific_category, "state": state, "school": school}
                }, status=status.HTTP_404_NOT_FOUND)

            serializer = VendorSerializer(vendors, many=True)

            return Response({
                "status": "success",
                "count": vendors.count(),
                "services": serializer.data,
                "search_params": {"specific_category": specific_category, "state": state, "school": school}
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}",
                "search_params": {"specific_category": specific_category, "state": state, "school": school}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class AllProductsView(APIView):
    """
    Get all products with filtering, sorting, and pagination.
    Authenticated users see their institution's products by default.
    Anonymous users must pass 'school' param.
    Only approved KYC vendors are included.

    Request:  AllProductsQuerySerializer  (query params)
    Response: Paginated product list with metadata
    """
    pagination_class         = CustomPagination
    request_serializer_class = AllProductsQuerySerializer
    serializer_class         = ProductSerializer

    def get(self, request):
        try:
            filters = self._parse_request_params(request)

            queryset = Product.objects.select_related(
                'vendor', 'vendor__vendor_profile'
            ).prefetch_related(
                'additional_images', 'sizes', 'colors'
            ).filter(
                vendor__kyc__verification_status='approved'
            )

            queryset = self._apply_school_filter(queryset, request, filters)
            queryset = self._apply_common_filters(queryset, filters)
            queryset = self._apply_sorting(queryset, filters['sort'])

            return self._paginate_and_serialize(queryset, request, filters)

        except Exception as e:
            return self._handle_error(e)

    def _apply_school_filter(self, queryset, request, filters):
        user = request.user
        if user.is_authenticated:
            if filters['view_other_products']:
                if filters['school']:
                    queryset = queryset.filter(vendor__institution__iexact=filters['school'])
            else:
                queryset = queryset.filter(vendor__institution__iexact=user.institution)
        else:
            if filters['school']:
                queryset = queryset.filter(vendor__institution__iexact=filters['school'])
        return queryset

    def _apply_common_filters(self, queryset, filters):
        if filters['category']:
            queryset = queryset.filter(vendor__vendor_profile__business_category__iexact=filters['category'])
        queryset = queryset.filter(price__gte=filters['min_price'], price__lte=filters['max_price'])
        if filters['search']:
            queryset = queryset.filter(
                Q(name__icontains=filters['search']) |
                Q(description__icontains=filters['search'])
            )
        if filters['state']:
            queryset = queryset.filter(vendor__state__iexact=filters['state'])
        if filters['vendor']:
            queryset = queryset.filter(vendor__vendor_profile__business_name__iexact=filters['vendor'])
        return queryset

    def _apply_sorting(self, queryset, sort_option):
        if sort_option == 'price_low':
            return queryset.order_by('price')
        elif sort_option == 'price_high':
            return queryset.order_by('-price')
        elif sort_option == 'rating':
            return queryset.order_by('-vendor__rating')
        return queryset.order_by('-created_at')

    def _parse_request_params(self, request):
        params = request.query_params

        min_price_raw = params.get('minPrice', '').strip()
        max_price_raw = params.get('maxPrice', '').strip()

        try:
            min_price = Decimal(min_price_raw) if min_price_raw else Decimal('0')
        except (ValueError, TypeError, InvalidOperation):
            min_price = Decimal('0')

        try:
            max_price = Decimal(max_price_raw) if max_price_raw else Decimal('999999999')
        except (ValueError, TypeError, InvalidOperation):
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
        total_products = queryset.count()
        paginator = self.pagination_class()
        paginated_products = paginator.paginate_queryset(queryset, request)
        serializer = ProductSerializer(paginated_products, many=True, context={'request': request})
        response = paginator.get_paginated_response(serializer.data)
        response.data.update({
            'user_institution': request.user.institution if request.user.is_authenticated else None,
            'view_other_products': filters['view_other_products'],
            'total_products': total_products
        })
        if request.user.is_authenticated:
            response.data['user_institution_product_count'] = queryset.filter(
                vendor__institution__iexact=request.user.institution
            ).count()
        else:
            response.data['user_institution_product_count'] = None
        return response

    def _handle_error(self, error):
        print(f"Error in AllProductsView: {str(error)}")
        return Response(
            {'error': 'An error occurred while processing your request.', 'detail': str(error)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



class CreateVendorReviewView(APIView):
    """
    Create a vendor review for a completed order.

    Request:  VendorReviewCreateBodySerializer  (JSON body)
    Response: VendorReviewSerializer
    """
    permission_classes       = [IsAuthenticated]
    request_serializer_class = VendorReviewCreateBodySerializer
    serializer_class         = VendorReviewSerializer

    def post(self, request):
        try:
            serializer = VendorReviewSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                order_id = serializer.validated_data['order'].id
                vendor_id = serializer.validated_data['vendor'].id

                order = get_object_or_404(Order, id=order_id, user=request.user)

                if VendorReview.objects.filter(order=order, vendor_id=vendor_id).exists():
                    return Response(
                        {'error': 'You have already reviewed this vendor for this order'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if order.order_status.upper() != 'COMPLETED':
                    return Response(
                        {'error': 'You can only review completed orders'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                review = serializer.save()
                update_vendor_rating(vendor_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreatePickerReviewView(APIView):
    """
    Create a picker review for a completed order.

    Request:  PickerReviewCreateBodySerializer  (JSON body)
    Response: PickerReviewSerializer
    """
    permission_classes       = [IsAuthenticated]
    request_serializer_class = PickerReviewCreateBodySerializer
    serializer_class         = PickerReviewSerializer

    def post(self, request):
        try:
            serializer = PickerReviewSerializer(data=request.data, context={'request': request})

            if serializer.is_valid():
                order_id = serializer.validated_data['order'].id
                picker_id = serializer.validated_data['picker'].id

                order = get_object_or_404(Order, id=order_id, user=request.user)

                if PickerReview.objects.filter(order=order, picker_id=picker_id).exists():
                    return Response(
                        {'error': 'You have already reviewed this picker for this order'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if order.order_status.upper() != 'COMPLETED':
                    return Response(
                        {'error': 'You can only review completed orders'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                review = serializer.save()
                update_picker_rating(picker_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubmitReviewsView(APIView):
    """
    Submit both a vendor review and a picker review atomically in one request.

    Request:  SubmitReviewsBodySerializer  (JSON body)
    Response: ReviewSubmitResponseSerializer
    """
    permission_classes       = [IsAuthenticated]
    request_serializer_class = SubmitReviewsBodySerializer
    serializer_class         = ReviewSubmitResponseSerializer

    def post(self, request):
        try:
            serializer = ReviewSubmissionSerializer(data=request.data)

            if serializer.is_valid():
                data = serializer.validated_data
                order_id = data['order_id']

                order = get_object_or_404(Order, id=order_id, user=request.user)

                if order.order_status.upper() != 'COMPLETED':
                    return Response(
                        {'error': 'You can only review completed orders'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if (VendorReview.objects.filter(order=order, vendor_id=data['vendor_id']).exists() or
                        PickerReview.objects.filter(order=order, picker_id=data['picker_id']).exists()):
                    return Response(
                        {'error': 'You have already reviewed this order'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                with transaction.atomic():
                    vendor_review = VendorReview.objects.create(
                        order=order, vendor_id=data['vendor_id'], reviewer=request.user,
                        rating=data['vendor_rating'], comment=data.get('vendor_comment', '')
                    )
                    picker_review = PickerReview.objects.create(
                        order=order, picker_id=data['picker_id'], reviewer=request.user,
                        rating=data['picker_rating'], comment=data.get('picker_comment', '')
                    )
                    order.reviewed = True
                    order.save()
                    update_vendor_rating(data['vendor_id'])
                    update_picker_rating(data['picker_id'])

                return Response({
                    'message': 'Reviews submitted successfully',
                    'vendor_review': VendorReviewSerializer(vendor_review).data,
                    'picker_review': PickerReviewSerializer(picker_review).data
                }, status=status.HTTP_201_CREATED)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def update_vendor_rating(vendor_id):
    try:
        vendor = Vendor.objects.get(id=vendor_id)
        reviews = VendorReview.objects.filter(vendor=vendor)
        if reviews.exists():
            avg_rating = sum(r.rating for r in reviews) / reviews.count()
            vendor.rating = round(avg_rating, 2)
            vendor.total_ratings = reviews.count()
            vendor.save()
    except Vendor.DoesNotExist:
        pass


def update_picker_rating(picker_id):
    try:
        picker_user = User.objects.get(id=picker_id)
        reviews = PickerReview.objects.filter(picker=picker_user)
        if reviews.exists():
            avg_rating = sum(r.rating for r in reviews) / reviews.count()
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
    Get all reviews and stats for a specific product.

    Request:  No params needed — product_id is in the URL
    Response: ProductReviewListResponseSerializer
    """
    serializer_class = ProductReviewListResponseSerializer

    def get(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            reviews = ProductReview.objects.filter(product=product).select_related('reviewer', 'order')

            review_stats = reviews.aggregate(total_reviews=Count('id'), average_rating=Avg('rating'))
            rating_breakdown = {i: reviews.filter(rating=i).count() for i in range(1, 6)}

            serialized_reviews = [
                {
                    'id': r.id,
                    'rating': r.rating,
                    'comment': r.comment,
                    'reviewer_name': r.reviewer_name,
                    'created_at': r.created_at.strftime('%B %d, %Y'),
                    'order_number': r.order.order_number if r.order else None,
                }
                for r in reviews
            ]

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
            return Response({'error': 'Failed to fetch reviews'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserReviewStatusView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = UserReviewStatusResponseSerializer

    def get(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            user = request.user

            has_bought = OrderItem.objects.filter(
                product=product,
                order__user=user,
                order__order_status__in=['DELIVERED', 'COMPLETED']
            ).exists()

            existing_review = ProductReview.objects.filter(product=product, reviewer=user).first()
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
            return Response({'error': 'Failed to check review status'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductReviewCreateView(APIView):
    permission_classes       = [IsAuthenticated]
    request_serializer_class = ProductReviewCreateBodySerializer
    serializer_class         = ProductReviewCreateResponseSerializer

    def post(self, request, product_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            user = request.user

            rating = request.data.get('rating')
            comment = request.data.get('comment', '').strip()

            if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be an integer between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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

            if ProductReview.objects.filter(product=product, reviewer=user).exists():
                return Response(
                    {'error': 'You have already reviewed this product'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            review = ProductReview.objects.create(
                product=product, reviewer=user, order=order_item.order,
                rating=rating, comment=comment if comment else None
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
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating product review: {str(e)}")
            return Response({'error': 'Failed to create review'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductReviewDetailView(APIView):
    permission_classes       = [IsAuthenticated]
    request_serializer_class = ProductReviewUpdateBodySerializer
    serializer_class         = ProductReviewUpdateResponseSerializer

    def put(self, request, product_id, review_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            review = get_object_or_404(ProductReview, id=review_id, product=product, reviewer=request.user)

            rating = request.data.get('rating')
            comment = request.data.get('comment', '').strip()

            if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
                return Response(
                    {'error': 'Rating must be an integer between 1 and 5'},
                    status=status.HTTP_400_BAD_REQUEST
                )

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
            return Response({'error': 'Failed to update review'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, product_id, review_id):
        try:
            product = get_object_or_404(Product, id=product_id)
            review = get_object_or_404(ProductReview, id=review_id, product=product, reviewer=request.user)
            review.delete()
            return Response({'message': 'Review deleted successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error deleting product review: {str(e)}")
            return Response({'error': 'Failed to delete review'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserReviewListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = UserReviewListResponseSerializer

    def get(self, request):
        try:
            reviews = ProductReview.objects.filter(reviewer=request.user).select_related('product', 'order')

            serialized_reviews = [
                {
                    'id': r.id,
                    'product_name': r.product.name,
                    'product_id': r.product.id,
                    'rating': r.rating,
                    'comment': r.comment,
                    'created_at': r.created_at.strftime('%B %d, %Y'),
                    'order_number': r.order.order_number if r.order else None,
                }
                for r in reviews
            ]

            return Response({'reviews': serialized_reviews}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching user reviews: {str(e)}")
            return Response({'error': 'Failed to fetch user reviews'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetBothVideosView(APIView):
    serializer_class = BothVideosResponseSerializer

    def get(self, request):
        try:
            register_video = RegisterVideo.objects.first()
            product_video  = AddProductVideo.objects.first()

            register_data = RegisterVideoSerializer(register_video).data if register_video else None
            product_data  = AddProductVideoSerializer(product_video).data if product_video else None

            return Response({
                'success': True,
                'register_video': register_data,
                'product_video': product_data
            })

        except Exception as e:
            return Response({'success': False, 'error': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MySubmittedApplicationsAPIView(APIView):
    permission_classes       = [IsAuthenticated]
    request_serializer_class = MySubmittedApplicationsQuerySerializer
    serializer_class         = MySubmittedApplicationsResponseSerializer

    def get(self, request):
        user = request.user

        applications = ServiceApplication.objects.filter(
            user=user
        ).select_related('service', 'service__user')

        status_filter = request.query_params.get('status')
        if status_filter:
            applications = applications.filter(status=status_filter)

        if not applications.exists():
            return Response(
                {'message': 'You have not submitted any applications', 'applications': []},
                status=status.HTTP_200_OK
            )

        serializer = ServiceApplicationSerializer(applications, many=True)

        return Response({
            'message': f'You have {applications.count()} submitted application(s)',
            'applications': serializer.data
        }, status=status.HTTP_200_OK)