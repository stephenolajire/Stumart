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
from decimal import Decimal, InvalidOperation
import logging
from django.db.models import Q, Prefetch, Count
from django.core.cache import cache
from user.serializers import VendorSerializer
import random
from django.conf import settings
from drf_spectacular.utils import extend_schema
from collections import OrderedDict, defaultdict
import contextlib

from .serializers import (
    CategoryLastFiveRequestSerializer,
    CategoryLastFiveResponseSerializer,
    VendorsBySchoolResponseSerializer,
    VendorCardSerializer,
    HeroProductSerializer,
    ProductCardSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


class VendorsByCategoryView(APIView):
    pagination_class = CustomPagination
    permission_classes = [AllowAny]

    SORT_MAP = {
        'rating_high': ('-rating', '-total_ratings'),
        'rating_low':  ('rating',),
        'name_asc':    ('business_name',),
        'name_desc':   ('-business_name',),
    }

    def get(self, request):
        try:
            category = request.query_params.get('category', '').strip()
            if not category:
                return Response(
                    {'error': 'Category parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            p            = request.query_params
            school       = p.get('school', '').strip()
            state        = p.get('state', '').strip()
            search       = p.get('search', '').strip()
            sort_by      = p.get('sort', 'random').strip()
            verified_only = p.get('verified_only', 'false').lower() == 'true'

            queryset = Vendor.objects.select_related('user').only(
                'id', 'business_name', 'business_category',
                'specific_category', 'shop_image', 'rating',
                'is_verified', 'user_id',
                'user__id', 'user__institution', 'user__state',
            ).filter(user__kyc__verification_status='approved')

            # Category
            queryset = queryset.filter(
                Q(business_category__iexact=category) |
                Q(specific_category__iexact=category)
            )

            # Verified only
            if verified_only:
                queryset = queryset.filter(is_verified=True)

            # Location
            if request.user.is_authenticated:
                if not school:
                    queryset = queryset.filter(
                        user__institution__iexact=request.user.institution
                    )
            else:
                if state:
                    queryset = queryset.filter(user__state__iexact=state)
                if school:
                    queryset = queryset.filter(user__institution__iexact=school)

            # Search
            if search:
                queryset = queryset.filter(
                    Q(business_name__icontains=search) |
                    Q(business_category__icontains=search) |
                    Q(specific_category__icontains=search)
                )

            # Sort
            sort_fields = self.SORT_MAP.get(sort_by, ('?',))
            queryset = queryset.order_by(*sort_fields)

            total_count = queryset.count()

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            response = paginator.get_paginated_response(
                VendorCardSerializer(page, many=True).data
            )
            response.data.update({
                'category':       category,
                'user_institution': getattr(request.user, 'institution', None),
                'total_vendors':  total_count,
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

    SORT_MAP = {
        'price_low':  ('price', '-created_at'),
        'price_high': ('-price', '-created_at'),
        'popular':    ('-in_stock', '-created_at'),
    }

    def get(self, request):
        try:
            category = request.query_params.get('category', '').strip()
            if not category:
                return Response(
                    {'error': 'Category parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            p         = request.query_params
            vendor_id = p.get('vendor', '').strip()
            search    = p.get('search', '').strip()
            sort_by   = p.get('sort', 'newest').strip()
            gender    = p.get('gender', '').strip()
            state     = p.get('state', '').strip()
            school    = p.get('school', '').strip()

            queryset = Product.objects.select_related(
                'vendor',
                'vendor__vendor_profile',
            ).only(
                'id', 'name', 'price', 'promotion_price',
                'created_at', 'vendor_id', 'image', 'in_stock', 'gender',
                'vendor__id', 'vendor__institution',
                'vendor__vendor_profile__business_name',
                'vendor__vendor_profile__business_category',
                'vendor__vendor_profile__specific_category',
            ).filter(vendor__kyc__verification_status='approved')

            # Category
            queryset = queryset.filter(
                Q(vendor__vendor_profile__business_category__iexact=category) |
                Q(vendor__vendor_profile__specific_category__iexact=category)
            )

            # Gender
            if gender in ['men', 'women', 'unisex', 'kids']:
                queryset = queryset.filter(gender=gender)

            # Location — auth uses institution, guest uses state/school
            if request.user.is_authenticated:
                if not vendor_id:
                    institution = (getattr(request.user, 'institution', None) or '').strip()
                    if institution:
                        queryset = queryset.filter(
                            vendor__institution__iexact=institution
                        )
            else:
                if state:
                    queryset = queryset.filter(vendor__state__iexact=state)
                if school:
                    queryset = queryset.filter(vendor__institution__iexact=school)

            # Vendor
            if vendor_id:
                try:
                    queryset = queryset.filter(vendor_id=int(vendor_id))
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Invalid vendor ID'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Search
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(description__icontains=search) |
                    Q(vendor__vendor_profile__business_name__icontains=search)
                )

            # Price
            with contextlib.suppress(ValueError, TypeError, InvalidOperation):
                if min_price := p.get('minPrice', '').strip():
                    queryset = queryset.filter(price__gte=Decimal(min_price))
            with contextlib.suppress(ValueError, TypeError, InvalidOperation):
                if max_price := p.get('maxPrice', '').strip():
                    queryset = queryset.filter(price__lte=Decimal(max_price))

            # Sort
            queryset = queryset.order_by(
                *self.SORT_MAP.get(sort_by, ('-created_at',))
            )

            # Vendors dropdown
            vendors_list = [
                {
                    'id': v['id'],
                    'name': v['vendor_profile__business_name'] or f"Vendor {v['id']}"
                }
                for v in User.objects
                .filter(
                    id__in=queryset.values('vendor_id').distinct(),
                    vendor_profile__isnull=False
                )
                .values('id', 'vendor_profile__business_name')
            ]

            paginator = self.pagination_class()
            page = paginator.paginate_queryset(queryset, request)
            response = paginator.get_paginated_response(
                ProductCardSerializer(page, many=True).data
            )
            response.data.update({
                'category':         category,
                'user_institution': getattr(request.user, 'institution', None),
                'total_products':   queryset.count(),
                'vendors':          vendors_list,
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
    serializer_class = VendorsBySchoolResponseSerializer
    permission_classes = [AllowAny]

    def get(self, request):
        school_name = (
            (getattr(request.user, 'institution', None) or '').strip()
            if request.user.is_authenticated
            else None
        ) or None  # converts empty string to None

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
                .select_related('user')
                .filter(
                    school_filter,
                    user_id__in=vendor_user_ids_with_products,
                    user__kyc__verification_status='approved'
                )
                .exclude(business_category__in=['others', 'Others'])
                .only(
                    'id', 'business_name', 'business_category',
                    'shop_image', 'rating', 'user_id',
                    'user__id', 'user__institution',
                )
            )

            vendors_list = list(all_vendors)

            if not vendors_list:
                return Response(
                    {"error": f"No vendors found for {school_name}" if school_name else "No vendors found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            vendors_by_category = defaultdict(list)
            for vendor in vendors_list:
                vendors_by_category[vendor.business_category].append(vendor)

            categories_list = sorted(
                vendors_by_category.keys(),
                key=lambda c: (0 if c.lower() == 'food' else 1, c.lower())
            )

            response_data = OrderedDict()
            for category in categories_list:
                category_vendors = vendors_by_category[category]
                total_count = len(category_vendors)
                selected_vendors = (
                    random.sample(category_vendors, 5)
                    if total_count > 5
                    else category_vendors
                )
                response_data[category] = {
                    'category_name': category,
                    'vendors': VendorCardSerializer(selected_vendors, many=True).data,
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
            return Response(
                {
                    "error": "An unexpected error occurred. Please try again later.",
                    "message": str(e) if (request.user.is_authenticated and request.user.is_staff) else None
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
    
class HeroProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            queryset = Product.objects.select_related(
                'vendor',
                'vendor__vendor_profile',
            ).only(
                'id', 'name', 'description', 'price', 'image',
                'vendor_id',
                'vendor__id', 'vendor__institution',
                'vendor__vendor_profile__business_name',
                'vendor__vendor_profile__business_category',
                'vendor__vendor_profile__rating',
            ).filter(
                vendor__kyc__verification_status='approved',
                vendor__vendor_profile__business_category__iexact='food',
            )

            # Auth-based institution filter
            if request.user.is_authenticated:
                institution = (getattr(request.user, 'institution', None) or '').strip()
                if institution:
                    queryset = queryset.filter(vendor__institution__iexact=institution)

            queryset = queryset.order_by('-created_at')[:10]

            return Response({
                'status': 'success',
                'results': HeroProductSerializer(queryset, many=True).data,
            })

        except Exception as e:
            logger.error(f"Error in HeroProductsView: {str(e)}", exc_info=True)
            return Response({'error': 'Failed to load hero products'}, status=500)