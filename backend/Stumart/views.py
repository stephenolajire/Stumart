from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from User.models import Vendor, User
from .serializers import ProductSerializer
from django.shortcuts import get_list_or_404
from User.serializers import VendorSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError
from django.db import transaction
import logging

# Set up logger
logger = logging.getLogger(__name__)

class ProductsView(APIView):
    def get(self, request, id):
        try:
            vendor = get_object_or_404(Vendor, id=id)
            products = Product.objects.filter(vendor=vendor)
            serializer = ProductSerializer(products, many=True)

            business_name = vendor.business_name
            shop_image = str(vendor.shop_image) if vendor.shop_image else None  # ✅ Convert to URL
            business_category = vendor.business_category
            rating = vendor.rating
            data = serializer.data  # Convert to a mutable format
            
            # Remove 'in_stock' if business category is 'food'
            if isinstance(business_category, str) and business_category.lower() == "food":
                for product in data:
                    product.pop("in_stock", None)

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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
            
            # Get vendors linked to those users
            vendors = Vendor.objects.filter(user__in=users).distinct()
            
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
        

class VendorsByOtherandSchoolView(APIView):
    def get(self, request):
        category = request.query_params.get("business_category", None)
        specific_category = request.query_params.get("specific_category", None)
        school_name = request.query_params.get("school", None)

        if not school_name:
            return Response(
                {"error": "The school name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # First, filter users by school
            users_in_school = User.objects.filter(institution__iexact=school_name)

            if not users_in_school.exists():
                return Response(
                    {"error": "No users found for this school"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get vendors belonging to these users
            vendors = Vendor.objects.filter(owner__in=users_in_school)

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
        

class ProductView(APIView):
    def get(self, request, id):
        product = Product.objects.get(id=id)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=200)


class ProductCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def post(self, request, format=None):
        """
        Create a new product for the vendor associated with the authenticated user.
        The vendor is determined by the authenticated user making the request.
        """
        try:
            # Get the vendor associated with the authenticated user
            vendor = Vendor.objects.get(user=request.user)
        except Vendor.DoesNotExist:
            return Response(
                {"message": "You must be registered as a vendor to add products."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Log request data for debugging
        logger.debug(f"Request data: {request.data}")
        logger.debug(f"Request FILES: {request.FILES}")
        
        # Create serializer with request data
        serializer = ProductSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Use transaction to ensure atomicity
                with transaction.atomic():
                    # Save the product with the vendor
                    product = serializer.save(vendor=vendor)
                    
                    # Get a fresh copy of the product to ensure all data is current
                    product.refresh_from_db()
                    
                    # Return the refreshed data using the serializer
                    serialized_data = ProductSerializer(product).data
                    
                    return Response(
                        {
                            "message": "Product added successfully.", 
                            "data": serialized_data,
                            "image_url": serialized_data.get('image')  # Include image URL in response
                        },
                        status=status.HTTP_201_CREATED
                    )
            except ValidationError as e:
                return Response(
                    {"message": "Failed to add product.", "errors": e.message_dict},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"Error creating product: {str(e)}")
                return Response(
                    {"message": "An unexpected error occurred.", "errors": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(
                {"message": "Failed to add product.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get(self, request, format=None):
        """
        Get all products for the vendor associated with the authenticated user.
        """
        try:
            # Get the vendor associated with the authenticated user
            vendor = Vendor.objects.get(user=request.user)
        except Vendor.DoesNotExist:
            return Response(
                {"message": "You must be registered as a vendor to view your products."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all products for this vendor
        products = Product.objects.filter(vendor=vendor).order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        
        return Response(
            {"message": "Products retrieved successfully.", "data": serializer.data},
            status=status.HTTP_200_OK
        )

