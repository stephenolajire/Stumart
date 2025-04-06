from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from User.models import Vendor
from django.shortcuts import get_list_or_404
from User.serializers import VendorSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import*
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.renderers import JSONRenderer

class ProductsView(APIView):
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
                "rating": vendor.rating
            }

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
    def get(self, request, id=None):
        if id:
            try:
                product = Product.objects.get(id=id)
                # Get all related data
                serializer = ProductSerializer(product)
                return Response(serializer.data)
            except Product.DoesNotExist:
                return Response(
                    {"error": "Product not found"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Handle getting all products
            products = Product.objects.all()
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)


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


