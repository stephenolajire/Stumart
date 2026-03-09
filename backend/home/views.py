from collections import OrderedDict
from django.shortcuts import render
from rest_framework.views import APIView
from stumart.paginations import CustomPagination
from stumart.models import Product
from stumart.serializers import ProductSerializer
from rest_framework.response import Response
from rest_framework import status
from user.models import Vendor
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from decimal import Decimal
import logging
from django.db.models import Q, Prefetch, Count
from django.core.cache import cache
from user.serializers import VendorSerializer
import random
from django.conf import settings
from drf_spectacular.utils import extend_schema

from .serializers import (
    VendorsByCategoryRequestSerializer,
    VendorsByCategoryResponseSerializer,
    ProductCategoryRequestSerializer,
    ProductCategoryResponseSerializer,
    CategoryLastFiveRequestSerializer,
    CategoryLastFiveResponseSerializer,
    VendorsBySchoolRequestSerializer,
    VendorsBySchoolResponseSerializer,
    ErrorResponseSerializer,
    ErrorResponseDetailSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


class VendorsByCategoryView(APIView):
    """
    Vendors By Category API
    
    Get all vendors in a specific category with pagination and filtering.
    Supports sorting, searching, and institutional/state filtering.
    """
    pagination_class = CustomPagination
    permission_classes = [AllowAny]
    serializer_class = VendorsByCategoryResponseSerializer
    
    @extend_schema(
        request=VendorsByCategoryRequestSerializer,
        responses=VendorsByCategoryResponseSerializer,
        description="Retrieve vendors filtered by category with optional filters"
    )
    def get(self, request):
        try:
            category = request.query_params.get('category', '').strip()
            
            if not category:
                return Response(
                    {'error': 'Category parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get filter parameters
            school = request.query_params.get('school', '').strip()
            state = request.query_params.get('state', '').strip()
            search = request.query_params.get('search', '').strip()
            sort_by = request.query_params.get('sort', 'random').strip()
            verified_only = request.query_params.get('verified_only', 'false').strip().lower() == 'true'

            # Build optimized queryset
            queryset = Vendor.objects.select_related(
                'user',
                'user__kyc'
            ).only(
                'id', 'business_name', 'business_category', 
                'specific_category', 'business_description', 
                'shop_image', 'rating', 'total_ratings', 
                'is_verified', 'user_id',
                'user__id', 'user__email', 'user__institution',
                'user__phone_number', 'user__state',
                'user__kyc__verification_status'
            )

            # Apply KYC filtering
            queryset = queryset.filter(user__kyc__verification_status='approved')
            
            # Apply category filtering
            category_filter = Q(business_category__iexact=category)
            category_filter |= Q(specific_category__iexact=category)
            queryset = queryset.filter(category_filter)

            # Apply verified only filter
            if verified_only:
                queryset = queryset.filter(is_verified=True)

            # Apply school filtering based on authentication
            if request.user.is_authenticated:
                if not school:
                    queryset = queryset.filter(user__institution__iexact=request.user.institution)
            else:
                if state:
                    queryset = queryset.filter(user__state__iexact=state)
                if school:
                    queryset = queryset.filter(user__institution__iexact=school)

            # Apply search filtering
            if search:
                search_filter = (
                    Q(business_name__icontains=search) | 
                    Q(business_description__icontains=search) |
                    Q(business_category__icontains=search) |
                    Q(specific_category__icontains=search)
                )
                queryset = queryset.filter(search_filter)

            # Apply sorting
            if sort_by == 'rating_high':
                queryset = queryset.order_by('-rating', '-total_ratings', '-created_at')
            elif sort_by == 'rating_low':
                queryset = queryset.order_by('rating', '-created_at')
            elif sort_by == 'name_asc':
                queryset = queryset.order_by('business_name')
            elif sort_by == 'name_desc':
                queryset = queryset.order_by('-business_name')
            elif sort_by == 'random':
                queryset = queryset.order_by('?')
            else:
                queryset = queryset.order_by('?')

            # Get total count before pagination
            total_count = queryset.count()

            # Pagination
            paginator = self.pagination_class()
            paginated_vendors = paginator.paginate_queryset(queryset, request)
            
            # Serialization
            serializer = VendorSerializer(paginated_vendors, many=True)
            response = paginator.get_paginated_response(serializer.data)
            
            # Add metadata to response
            response.data.update({
                'category': category,
                'user_institution': request.user.institution if request.user.is_authenticated else None,
                'total_vendors': total_count,
                'applied_filters': {
                    'school': school,
                    'state': state,
                    'search': search,
                    'sort': sort_by,
                    'verified_only': verified_only,
                }
            })
            
            return response

        except Exception as e:
            logger.error(f"Error in VendorsByCategoryView: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'An error occurred while filtering vendors by category.',
                    'detail': str(e) if settings.DEBUG else 'Internal server error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductCategoryView(APIView):
    """
    Product Category API
    
    Get products filtered by category with support for price filtering,
    vendor filtering, and multiple sorting options.
    """
    pagination_class = CustomPagination
    permission_classes = [AllowAny]
    serializer_class = ProductCategoryResponseSerializer
    
    @extend_schema(
        request=ProductCategoryRequestSerializer,
        responses=ProductCategoryResponseSerializer,
        description="Retrieve products filtered by category with optional filters"
    )
    def get(self, request):
        try:
            category = request.query_params.get('category', '').strip()
            
            if not category:
                return Response(
                    {'error': 'Category parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get filter parameters
            vendor_id = request.query_params.get('vendor', '').strip()
            state = request.query_params.get('state', '').strip()
            school = request.query_params.get('school', '').strip()
            search = request.query_params.get('search', '').strip()
            min_price = request.query_params.get('minPrice', '').strip()
            max_price = request.query_params.get('maxPrice', '').strip()
            sort_by = request.query_params.get('sort', 'newest').strip()
            gender = request.query_params.get('gender', '').strip()

            # Build optimized queryset
            queryset = Product.objects.select_related(
                'vendor',
                'vendor__vendor_profile',
                'vendor__kyc'
            ).only(
                'id', 'name', 'description', 'price', 'promotion_price', 
                'created_at', 'vendor_id', 'image', 'in_stock', 
                'gender', 'delivery_day', 'keyword',
                'vendor__id', 'vendor__institution', 'vendor__state',
                'vendor__vendor_profile__business_name',
                'vendor__vendor_profile__business_category',
                'vendor__vendor_profile__specific_category',
                'vendor__kyc__verification_status'
            )

            # Apply KYC filtering
            queryset = queryset.filter(vendor__kyc__verification_status='approved')
            
            # Apply category filtering
            category_filter = Q(vendor__vendor_profile__business_category__iexact=category)
            category_filter |= Q(vendor__vendor_profile__specific_category__iexact=category)
            queryset = queryset.filter(category_filter)

            # Apply gender filtering
            if gender and gender in ['men', 'women', 'unisex', 'kids']:
                queryset = queryset.filter(gender=gender)

            # Apply school filtering based on authentication
            if request.user.is_authenticated:
                if not vendor_id:
                    queryset = queryset.filter(vendor__institution__iexact=request.user.institution)
            else:
                if state:
                    queryset = queryset.filter(vendor__state__iexact=state)
                if school:
                    queryset = queryset.filter(vendor__institution__iexact=school)

            # Apply vendor filtering
            if vendor_id:
                try:
                    vendor_id_int = int(vendor_id)
                    queryset = queryset.filter(vendor__id=vendor_id_int)
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Invalid vendor ID'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Apply search filtering
            if search:
                search_filter = (
                    Q(name__icontains=search) | 
                    Q(description__icontains=search) |
                    Q(keyword__icontains=search) |
                    Q(vendor__vendor_profile__business_name__icontains=search)
                )
                queryset = queryset.filter(search_filter)

            # Apply price filtering
            if min_price:
                try:
                    queryset = queryset.filter(price__gte=Decimal(min_price))
                except (ValueError, TypeError):
                    pass

            if max_price:
                try:
                    queryset = queryset.filter(price__lte=Decimal(max_price))
                except (ValueError, TypeError):
                    pass

            # Apply sorting
            if sort_by == 'price_low':
                queryset = queryset.order_by('price', '-created_at')
            elif sort_by == 'price_high':
                queryset = queryset.order_by('-price', '-created_at')
            elif sort_by == 'popular':
                queryset = queryset.order_by('-in_stock', '-created_at')
            else:
                queryset = queryset.order_by('-created_at')

            # Get unique vendors
            unique_vendors = (
                User.objects
                .filter(
                    id__in=queryset.values_list('vendor_id', flat=True).distinct(),
                    vendor_profile__isnull=False
                )
                .select_related('vendor_profile')
                .only('id', 'vendor_profile__business_name')
                .values('id', 'vendor_profile__business_name')
            )
            
            vendors_list = [
                {
                    'id': vendor['id'],
                    'name': vendor['vendor_profile__business_name'] or f"Vendor {vendor['id']}"
                }
                for vendor in unique_vendors
            ]

            # Pagination
            paginator = self.pagination_class()
            paginated_products = paginator.paginate_queryset(queryset, request)
            
            # Serialization
            serializer = ProductSerializer(paginated_products, many=True)
            response = paginator.get_paginated_response(serializer.data)
            
            # Add metadata to response
            response.data.update({
                'category': category,
                'user_institution': request.user.institution if request.user.is_authenticated else None,
                'total_products': queryset.count(),
                'vendors': vendors_list,
                'applied_filters': {
                    'vendor': vendor_id,
                    'state': state,
                    'school': school,
                    'search': search,
                    'minPrice': min_price,
                    'maxPrice': max_price,
                    'sort': sort_by,
                    'gender': gender,
                }
            })
            
            return response

        except Exception as e:
            logger.error(f"Error in ProductCategoryView: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'An error occurred while filtering products by category.',
                    'detail': str(e) if settings.DEBUG else 'Internal server error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CategoryLastFiveView(APIView):
    """
    Category Last Five Products API
    
    Get the last 5 (or fewer) products for each category.
    Results are cached for 5 minutes for performance.
    """
    permission_classes = [AllowAny]
    serializer_class = CategoryLastFiveResponseSerializer
    
    @extend_schema(
        request=CategoryLastFiveRequestSerializer,
        responses=CategoryLastFiveResponseSerializer,
        description="Retrieve last 5 products for each category"
    )
    def get(self, request):
        try:
            # Try to get from cache (5 minutes)
            cache_key = 'category_last_five_products'
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True
                }, status=status.HTTP_200_OK)

            # Get all unique business categories
            categories = (
                User.objects
                .filter(vendor_profile__isnull=False)
                .exclude(vendor_profile__business_category__in=['', 'Others', 'others'])
                .values_list('vendor_profile__business_category', flat=True)
                .distinct()
            )

            categories_list = list(categories)
            
            # Sort with Food first
            def sort_categories(category):
                if category.lower() == 'food':
                    return (0, category.lower())
                else:
                    return (1, category.lower())
            
            categories_list.sort(key=sort_categories)

            response_data = OrderedDict()

            for category in categories_list:
                products = (
                    Product.objects
                    .select_related('vendor', 'vendor__vendor_profile', 'vendor__kyc')
                    .filter(
                        vendor__kyc__verification_status='approved',
                        vendor__vendor_profile__business_category__iexact=category
                    )
                    .only(
                        'id', 'name', 'description', 'price', 'promotion_price',
                        'created_at', 'image', 'in_stock', 'vendor_id',
                        'gender', 'delivery_day',
                        'vendor__id',
                        'vendor__vendor_profile__business_name',
                        'vendor__vendor_profile__business_category',
                        'vendor__kyc__verification_status'
                    )
                    .order_by('-created_at')[:6]
                )

                if products:
                    serializer = ProductSerializer(products, many=True)
                    
                    total_count = (
                        Product.objects
                        .filter(
                            vendor__vendor_profile__business_category__iexact=category,
                            vendor__kyc__verification_status='approved'
                        )
                        .count()
                    )
                    
                    response_data[category] = {
                        'category_name': category,
                        'products': serializer.data,
                        'total_products': total_count
                    }

            # Cache the result for 5 minutes
            cache.set(cache_key, response_data, 300)

            return Response({
                'status': 'success',
                'data': response_data,
                'cached': False
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in CategoryLastFiveView: {str(e)}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Failed to fetch category products',
                'detail': str(e) if settings.DEBUG else 'Internal server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VendorsBySchoolView(APIView):
    """
    Vendors By School API
    
    Get vendors grouped by category for a specific school/institution.
    Returns up to 5 vendors per category.
    Results are cached for 5 minutes.
    """
    serializer_class = VendorsBySchoolResponseSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        request=VendorsBySchoolRequestSerializer,
        responses=VendorsBySchoolResponseSerializer,
        description="Retrieve vendors by school/institution grouped by category"
    )
    def get(self, request):
        school_name = request.query_params.get("school") or request.query_params.get("institution")

        try:
            if school_name:
                cache_key = f'vendors_by_school_{school_name.lower().replace(" ", "_")}'
                school_filter = Q(user__institution__iexact=school_name)
                response_school = school_name
            else:
                cache_key = 'vendors_all_schools'
                school_filter = Q()
                response_school = 'All Schools'
            
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response({
                    'status': 'success',
                    'data': cached_data,
                    'school': response_school,
                    'cached': True
                }, status=status.HTTP_200_OK)

            from stumart.models import Product
            
            vendor_user_ids_with_products = set(
                Product.objects.values_list('vendor_id', flat=True).distinct()
            )
            
            if not vendor_user_ids_with_products:
                return Response(
                    {"error": "No vendors with products found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            all_vendors = (
                Vendor.objects
                .select_related('user', 'user__kyc')
                .filter(
                    school_filter,
                    user_id__in=vendor_user_ids_with_products,
                    user__kyc__verification_status='approved'
                )
                .exclude(business_category__in=['others', 'Others'])
                .only(
                    'id', 'business_name', 'business_category', 
                    'business_description', 'shop_image', 'rating',
                    'total_ratings', 'is_verified', 'user_id',
                    'user__id', 'user__email', 'user__institution',
                    'user__phone_number', 'user__state',
                    'user__kyc__verification_status'
                )
            )
            
            vendors_list = list(all_vendors)
            
            if not vendors_list:
                error_message = (
                    f"No vendors found for {school_name}" 
                    if school_name 
                    else "No vendors found"
                )
                return Response(
                    {"error": error_message},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            from collections import defaultdict
            vendors_by_category = defaultdict(list)
            
            for vendor in vendors_list:
                category = vendor.business_category
                vendors_by_category[category].append(vendor)
            
            categories_list = list(vendors_by_category.keys())
            
            def sort_categories(category):
                if category.lower() == 'food':
                    return (0, category.lower())
                else:
                    return (1, category.lower())
            
            categories_list.sort(key=sort_categories)

            response_data = OrderedDict()

            for category in categories_list:
                category_vendors = vendors_by_category[category]
                total_count = len(category_vendors)
                
                if total_count > 5:
                    selected_vendors = random.sample(category_vendors, 5)
                else:
                    selected_vendors = category_vendors
                    
                serializer = VendorSerializer(selected_vendors, many=True)
                
                response_data[category] = {
                    'category_name': category,
                    'vendors': serializer.data,
                    'total_vendors': total_count,
                    'returned_count': len(selected_vendors)
                }

            cache.set(cache_key, response_data, 300)

            return Response({
                'status': 'success',
                'data': response_data,
                'school': response_school,
                'cached': False
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(
                f"Error in VendorsBySchoolView: {str(e)}", 
                exc_info=True,
                extra={'school': school_name, 'authenticated': request.user.is_authenticated}
            )
            
            is_staff = request.user.is_authenticated and request.user.is_staff
            
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again later.",
                    "message": str(e) if is_staff else None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class AllVendorNamesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        school = request.query_params.get("school", None)
        
        queryset = Vendor.objects.select_related('user', 'user__kyc').filter(
            user__kyc__verification_status='approved'
        )
        
        if school:
            queryset = queryset.filter(user__institution__iexact=school)

        grouped = {}
        for v in queryset:
            cat = v.business_category
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append({
                'id': v.id,
                'business_name': v.business_name,
            })

        return Response({
            'status': 'success',
            'vendors': grouped,
            'count': queryset.count()
        }, status=status.HTTP_200_OK)