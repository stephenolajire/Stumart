from django.shortcuts import render
from rest_framework.views import APIView
from Stumart.paginations import CustomPagination
from Stumart.models import Product
from Stumart.serializers import ProductSerializer
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from User.models import Vendor
from django.shortcuts import get_list_or_404
from User.serializers import VendorSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
from django.db import transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Q, Max, Prefetch, OuterRef, Subquery
from django.shortcuts import get_object_or_404
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

            print(f"ProductCategoryView - Category: {category}")
            print(f"Filters - Vendor: {vendor_id}, State: {state}, School: {school}")
            print(f"Search: {search}, MinPrice: {min_price}, MaxPrice: {max_price}, Sort: {sort_by}")
            print(f"User authenticated: {request.user.is_authenticated}")

            # Start with all products
            queryset = Product.objects.select_related('vendor', 'vendor__vendor_profile', 'vendor__kyc')

            # Apply KYC filtering first
            queryset = queryset.filter(vendor__kyc__verification_status='approved')
            
            # Apply category filtering
            category_filter = Q(vendor__vendor_profile__business_category__iexact=category)
            category_filter |= Q(vendor__vendor_profile__specific_category__iexact=category)
            queryset = queryset.filter(category_filter)

            # Apply school filtering based on authentication
            if request.user.is_authenticated:
                # For authenticated users, show products from their school by default
                # But allow vendor filtering to override school restriction
                if not vendor_id:
                    queryset = queryset.filter(vendor__institution__iexact=request.user.institution)
                    print(f"Filtered by user's institution: {request.user.institution}")
                else:
                    # If vendor is specified, don't restrict by user's school
                    print("Vendor specified - not restricting by user's school")
            else:
                # For anonymous users, apply state and school filters if provided
                if state:
                    queryset = queryset.filter(vendor__state__iexact=state)
                    print(f"Filtered by state: {state}")
                
                if school:
                    queryset = queryset.filter(vendor__institution__iexact=school)
                    print(f"Filtered by school: {school}")

            # Apply vendor filtering
            if vendor_id:
                try:
                    vendor_id_int = int(vendor_id)
                    queryset = queryset.filter(vendor__id=vendor_id_int)
                    print(f"Filtered by vendor ID: {vendor_id_int}")
                except (ValueError, TypeError):
                    print(f"Invalid vendor ID: {vendor_id}")
                    return Response(
                        {'error': 'Invalid vendor ID'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Apply search filtering
            if search:
                search_filter = Q(name__icontains=search) | Q(description__icontains=search)
                search_filter |= Q(vendor__vendor_profile__business_name__icontains=search)
                queryset = queryset.filter(search_filter)
                print(f"Applied search filter: {search}")

            # Apply price filtering
            if min_price:
                try:
                    min_price_decimal = Decimal(min_price)
                    queryset = queryset.filter(price__gte=min_price_decimal)
                    print(f"Applied min price filter: {min_price_decimal}")
                except (ValueError, TypeError):
                    print(f"Invalid min price: {min_price}")

            if max_price:
                try:
                    max_price_decimal = Decimal(max_price)
                    queryset = queryset.filter(price__lte=max_price_decimal)
                    print(f"Applied max price filter: {max_price_decimal}")
                except (ValueError, TypeError):
                    print(f"Invalid max price: {max_price}")

            # Apply sorting
            if sort_by == 'price_low':
                queryset = queryset.order_by('price', '-created_at')
            elif sort_by == 'price_high':
                queryset = queryset.order_by('-price', '-created_at')
            else:  # Default to newest
                queryset = queryset.order_by('-created_at')

            print(f"Final queryset count: {queryset.count()}")

            # Get unique vendors from the filtered queryset for frontend dropdown
            vendor_subquery = queryset.values_list('vendor__id', flat=True).distinct()
            unique_vendors = User.objects.filter(
                id__in=vendor_subquery,
                vendor_profile__isnull=False
            ).select_related('vendor_profile').values('id', 'vendor_profile__business_name').distinct()
            
            # Format vendors for frontend
            vendors_list = []
            for vendor in unique_vendors:
                vendors_list.append({
                    'id': vendor['id'],
                    'name': vendor['vendor_profile__business_name'] or f"Vendor {vendor['id']}"
                })

            # Pagination
            paginator = self.pagination_class()
            paginated_products = paginator.paginate_queryset(queryset, request)
            
            # Serialization
            serializer = ProductSerializer(paginated_products, many=True)
            response = paginator.get_paginated_response(serializer.data)
            
            # Add metadata to response
            response.data['category'] = category
            response.data['user_institution'] = request.user.institution if request.user.is_authenticated else None
            response.data['total_products'] = queryset.count()
            response.data['vendors'] = vendors_list
            response.data['applied_filters'] = {
                'vendor': vendor_id,
                'state': state,
                'school': school,
                'search': search,
                'minPrice': min_price,
                'maxPrice': max_price,
                'sort': sort_by,
            }
            
            return response

        except Exception as e:
            print(f"Error in ProductCategoryView: {str(e)}")
            logger.error(f"Error in ProductCategoryView: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'An error occurred while filtering products by category.',
                    'detail': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class CategoryLastFiveView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Get all unique business categories excluding 'Others'
            categories = (User.objects
                .filter(vendor_profile__isnull=False)
                .exclude(vendor_profile__business_category__in=['', 'Others', 'others'])
                .values_list('vendor_profile__business_category', flat=True)
                .distinct()
            )

            response_data = {}

            for category in categories:
                # Get last 5 products for each category
                products = (Product.objects
                    .select_related('vendor', 'vendor__vendor_profile')
                    .filter(
                        vendor__kyc__verification_status='approved',
                        vendor__vendor_profile__business_category__iexact=category
                    )
                    .order_by('-created_at')[:5]
                )

                # Only add category if it has products
                if products.exists():
                    serializer = ProductSerializer(products, many=True)
                    response_data[category] = {
                        'category_name': category,
                        'products': serializer.data,
                        'total_products': Product.objects.filter(
                            vendor__vendor_profile__business_category__iexact=category
                        ).count()
                    }

            return Response({
                'status': 'success',
                'data': response_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in CategoryLastFiveView: {str(e)}", exc_info=True)
            return Response({
                'status': 'error',
                'message': 'Failed to fetch category products',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)