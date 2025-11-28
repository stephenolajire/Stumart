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

from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


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

            response_data = {}

            for category in categories:
                # Fixed query - added kyc fields to only() or removed from select_related
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
                        # KYC fields - THIS IS THE FIX
                        'vendor__kyc__verification_status'
                    )
                    .order_by('-created_at')[:5]
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