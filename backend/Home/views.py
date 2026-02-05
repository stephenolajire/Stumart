from collections import OrderedDict
from django.shortcuts import render
from rest_framework.views import APIView
from Stumart.paginations import CustomPagination
from Stumart.models import Product
from Stumart.serializers import ProductSerializer
from rest_framework.response import Response
from rest_framework import status
from User.models import Vendor
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from decimal import Decimal
import logging
from django.db.models import Q, Prefetch, Count
from django.core.cache import cache
from User.serializers import VendorSerializer
import random


from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


class VendorsByCategoryView(APIView):
    # Get all vendors in a specific category with pagination and filtering.
    
    # Query Parameters:
    # - category (required): Business category to filter by
    # - school: Filter by institution
    # - state: Filter by state
    # - search: Search by business name or description
    # - sort: Sort order (newest, rating_high, rating_low, name_asc, name_desc, random)
    # - verified_only: Show only verified vendors (true/false)
    pagination_class = CustomPagination
    permission_classes = [AllowAny]

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
            sort_by = request.query_params.get('sort', 'random').strip()  # Changed default to 'random'
            verified_only = request.query_params.get('verified_only', 'false').strip().lower() == 'true'

            # Build optimized queryset
            queryset = Vendor.objects.select_related(
                'user',
                'user__kyc'
            ).only(
                # Vendor fields
                'id', 'business_name', 'business_category', 
                'specific_category', 'business_description', 
                'shop_image', 'rating', 'total_ratings', 
                'is_verified', 'user_id',
                # User fields
                'user__id', 'user__email', 'user__institution',
                'user__phone_number', 'user__state',
                # KYC field
                'user__kyc__verification_status'
            )

            # Apply KYC filtering - only approved vendors
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
                    # If authenticated and no school specified, show vendors from user's institution
                    queryset = queryset.filter(user__institution__iexact=request.user.institution)
            else:
                # If not authenticated, apply state and school filters
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
                queryset = queryset.order_by('?')  # Database-level random ordering
            else:
                # Default to random if no valid sort specified
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
    pagination_class = CustomPagination
    permission_classes = [AllowAny]

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

            # Build optimized queryset with select_related for ForeignKeys
            queryset = Product.objects.select_related(
                'vendor',
                'vendor__vendor_profile',
                'vendor__kyc'
            ).only(
                # Product fields
                'id', 'name', 'description', 'price', 'promotion_price', 
                'created_at', 'vendor_id', 'image', 'in_stock', 
                'gender', 'delivery_day', 'keyword',
                # Vendor fields
                'vendor__id', 'vendor__institution', 'vendor__state',
                # Vendor profile fields
                'vendor__vendor_profile__business_name',
                'vendor__vendor_profile__business_category',
                'vendor__vendor_profile__specific_category',
                # KYC fields
                'vendor__kyc__verification_status'
            )

            # Apply KYC filtering
            queryset = queryset.filter(vendor__kyc__verification_status='approved')
            
            # Apply category filtering
            category_filter = Q(vendor__vendor_profile__business_category__iexact=category)
            category_filter |= Q(vendor__vendor_profile__specific_category__iexact=category)
            queryset = queryset.filter(category_filter)

            # Apply gender filtering for fashion products
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

            # Apply sorting with database indexes
            if sort_by == 'price_low':
                queryset = queryset.order_by('price', '-created_at')
            elif sort_by == 'price_high':
                queryset = queryset.order_by('-price', '-created_at')
            elif sort_by == 'popular':
                # You can add a popularity field or order by sales
                queryset = queryset.order_by('-in_stock', '-created_at')
            else:  # newest (default)
                queryset = queryset.order_by('-created_at')

            # Get unique vendors efficiently
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
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Try to get from cache first (5 minutes cache)
            cache_key = 'category_last_five_products'
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response({
                    'status': 'success',
                    'data': cached_data,
                    'cached': True
                }, status=status.HTTP_200_OK)

            # Get all unique business categories efficiently
            categories = (
                User.objects
                .filter(vendor_profile__isnull=False)
                .exclude(vendor_profile__business_category__in=['', 'Others', 'others'])
                .values_list('vendor_profile__business_category', flat=True)
                .distinct()
            )

            # Convert to list and sort with Food first
            categories_list = list(categories)
            
            # Custom sorting: Food first, then alphabetically
            def sort_categories(category):
                # Return 0 for Food (comes first), 1 for everything else
                if category.lower() == 'food':
                    return (0, category.lower())
                else:
                    return (1, category.lower())
            
            categories_list.sort(key=sort_categories)

            # Use OrderedDict to maintain insertion order
            from collections import OrderedDict
            response_data = OrderedDict()

            for category in categories_list:
                # Fixed query - added kyc fields to only()
                products = (
                    Product.objects
                    .select_related('vendor', 'vendor__vendor_profile', 'vendor__kyc')
                    .filter(
                        vendor__kyc__verification_status='approved',
                        vendor__vendor_profile__business_category__iexact=category
                    )
                    .only(
                        # Product fields
                        'id', 'name', 'description', 'price', 'promotion_price',
                        'created_at', 'image', 'in_stock', 'vendor_id',
                        'gender', 'delivery_day',
                        # Vendor fields
                        'vendor__id',
                        # Vendor profile fields
                        'vendor__vendor_profile__business_name',
                        'vendor__vendor_profile__business_category',
                        # KYC fields
                        'vendor__kyc__verification_status'
                    )
                    .order_by('-created_at')[:6]
                )

                # Only add category if it has products
                if products:
                    serializer = ProductSerializer(products, many=True)
                    
                    # Get total count efficiently
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
    serializer_class = VendorSerializer
    
    def get(self, request):
        school_name = request.query_params.get("school", None)

        try:
            # Determine cache key and filter conditions based on school parameter
            if school_name:
                cache_key = f'vendors_by_school_{school_name.lower().replace(" ", "_")}'
                school_filter = Q(user__institution__iexact=school_name)
                response_school = school_name
            else:
                cache_key = 'vendors_all_schools'
                school_filter = Q()  # Empty Q object means no filtering
                response_school = 'All Schools'
            
            # Try to get from cache first
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response({
                    'status': 'success',
                    'data': cached_data,
                    'school': response_school,
                    'cached': True
                }, status=status.HTTP_200_OK)

            # Get all unique business categories (excluding 'others')
            # Apply school filter if school_name was provided
            categories = (
                Vendor.objects
                .filter(
                    school_filter,
                    user__kyc__verification_status='approved'
                )
                .exclude(business_category__in=['others', 'Others'])
                .values_list('business_category', flat=True)
                .distinct()
            )

            categories_list = list(categories)
            
            # Custom sorting: Food first, then alphabetically
            def sort_categories(category):
                if category.lower() == 'food':
                    return (0, category.lower())
                else:
                    return (1, category.lower())
            
            categories_list.sort(key=sort_categories)

            # Use OrderedDict to maintain insertion order
            response_data = OrderedDict()

            for category in categories_list:
                # Get all approved vendors in this category
                # Apply school filter if school_name was provided
                vendors = (
                    Vendor.objects
                    .select_related('user', 'user__kyc')
                    .filter(
                        school_filter,
                        user__kyc__verification_status='approved',
                        business_category__iexact=category
                    )
                    .only(
                        # Vendor fields
                        'id', 'business_name', 'business_category', 
                        'business_description', 'shop_image', 'rating',
                        'total_ratings', 'is_verified', 'user_id',
                        # User fields
                        'user__id', 'user__email', 'user__institution',
                        'user__phone_number', 'user__state',
                        # KYC fields
                        'user__kyc__verification_status'
                    )
                )

                # Convert to list for random selection
                vendors_list = list(vendors)
                
                # Only add category if it has vendors
                if vendors_list:
                    # Get total count before random selection
                    total_count = len(vendors_list)
                    
                    selected_vendors = random.sample(vendors_list, min(5, len(vendors_list)))
                    serializer = VendorSerializer(selected_vendors, many=True)
                    
                    response_data[category] = {
                        'category_name': category,
                        'vendors': serializer.data,
                        'total_vendors': total_count,
                        'returned_count': len(selected_vendors)
                    }

            if not response_data:
                error_message = (
                    f"No vendors found for {school_name}" 
                    if school_name 
                    else "No vendors found"
                )
                return Response(
                    {"error": error_message},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Cache the result for 5 minutes
            cache.set(cache_key, response_data, 300)

            return Response({
                'status': 'success',
                'data': response_data,
                'school': response_school,
                'cached': False
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in VendorsBySchoolView: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )