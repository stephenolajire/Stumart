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
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404
from .models import Product, VendorReview, Vendor
from .serializers import VendorReviewSerializer
from User.models import Vendor
from django.template.loader import render_to_string
from django.utils.html import strip_tags

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
                
                # Get vendors belonging to these users
                vendors = Vendor.objects.filter(user__in=users_in_school)
                
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
                
                # Get vendors belonging to these users
                vendors = Vendor.objects.filter(user__in=users_in_school)
                
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
    

class AddToCartView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        product_id = data.get("product_id")
        quantity = data.get("quantity", 1)
        size = data.get("size")
        color = data.get("color")
        cart_code = data.get("cart_code")

        if not product_id:
            return Response({"error": "Product is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not cart_code:
            return Response({"error": "Cart code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the product belongs to a fashion business
        try:
            vendor_profile = Vendor.objects.get(user=product.vendor)
            is_fashion = vendor_profile.business_category == 'fashion'
        except Vendor.DoesNotExist:
            is_fashion = False

        if is_fashion:
            if product.colors and not color:
                return Response({"error": "Color is required for this fashion product."}, status=status.HTTP_400_BAD_REQUEST)
            if product.sizes and not size:
                return Response({"error": "Size is required for this fashion product."}, status=status.HTTP_400_BAD_REQUEST)

        # Always use cart_code (no user)
        cart, _ = Cart.objects.get_or_create(cart_code=cart_code)

        # Create cart item
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            quantity=quantity,
            size=size if is_fashion else None,
            color=color if is_fashion else None
        )

        return Response(CartItemSerializer(cart_item).data, status=status.HTTP_201_CREATED)



# Update Cart Item Quantity
class UpdateCartItemView(APIView):
    permission_classes = [AllowAny]
    
    def put(self, request, item_id, *args, **kwargs):
        try:
            cart_item = CartItem.objects.get(id=item_id)
            
            # Security check: verify ownership
            user = request.user
            cart_code = request.query_params.get('cart_code')
            
            if not cart_code or cart_item.cart.cart_code != cart_code:
                return Response(
                    {"error": "Invalid cart code."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update quantity
            quantity = request.data.get('quantity')
            if quantity is not None and int(quantity) > 0:
                cart_item.quantity = int(quantity)
                cart_item.save()
                
                serializer = CartItemSerializer(cart_item)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Invalid quantity."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Remove Cart Item
class RemoveCartItemView(APIView):
    permission_classes = [AllowAny]
    
    def delete(self, request, item_id, *args, **kwargs):
        try:
            cart_item = CartItem.objects.get(id=item_id)
            
            # Security check: verify ownership
            cart_code = request.query_params.get('cart_code')
        
            if not cart_code or cart_item.cart.cart_code != cart_code:
                return Response(
                    {"error": "Invalid cart code."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Delete the cart item
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
                
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Clear Cart
class ClearCartView(APIView):
    permission_classes = [AllowAny]
    
    def delete(self, request, *args, **kwargs):
        try:
            cart_code = request.query_params.get('cart_code')
            
            if not cart_code:
                return Response(
                    {"error": "Cart code is required for user."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart = Cart.objects.get(cart_code=cart_code)
            
            # Delete all cart items
            CartItem.objects.filter(cart=cart).delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Cart.DoesNotExist:
            return Response(
                {"error": "Cart not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CartItemsView(APIView): 
    permission_classes = [AllowAny] 
     
    def get(self, request, *args, **kwargs): 
        try: 
            from decimal import Decimal
            
            cart_code = request.query_params.get('cart_code') 
             
            # Get the appropriate cart 
            cart = Cart.objects.filter(cart_code=cart_code).first() 
            
            if not cart:
                return Response(
                    {"error": "Cart not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
             
            # Get all cart items for the cart
            cart_items = CartItem.objects.filter(cart=cart).select_related('product', 'product__vendor') 
             
            # Serialize the cart items 
            cart_item_serializer = CartItemSerializer(cart_items, many=True) 
            
            # Calculate subtotal considering promotion prices
            sub_total = Decimal('0.00')
            for item in cart_items:
                if hasattr(item.product, 'promotion_price') and item.product.promotion_price and item.product.promotion_price > Decimal('0.00'):
                    # Use promotion price if it exists and is greater than 0
                    sub_total += item.product.promotion_price * item.quantity
                else:
                    # Use regular price if no valid promotion price
                    sub_total += item.product.price * item.quantity
            
            # Get unique vendors from cart items
            unique_vendors = set(item.product.vendor for item in cart_items if hasattr(item.product, 'vendor'))
            num_vendors = len(unique_vendors)
            
            # Calculate shipping fee (300 per vendor)
            shipping_fee = Decimal('300') * num_vendors
            
            # Calculate tax (3% of subtotal)
            tax = sub_total * Decimal('0.030')  # 3% tax
            
            # Calculate total
            total = sub_total + shipping_fee + tax
            
            # Format response data
            response_data = { 
                "items": cart_item_serializer.data, 
                "sub_total": sub_total,
                "shipping_fee": shipping_fee,
                "tax": tax,
                "total": total,
                "count": cart_items.count(),
            } 
             
            return Response(response_data, status=status.HTTP_200_OK) 
                 
        except Exception as e: 
            import traceback 
            error_trace = traceback.format_exc() 
            print(f"Error in CartView: {str(e)}") 
            print(error_trace) 
            return Response( 
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateOrderView(APIView):
    permission_classes = [AllowAny]  # Or IsAuthenticated if you require login
    
    def post(self, request, *args, **kwargs):
        try:
            data = request.data
            user = request.user if request.user.is_authenticated else None
            
            # Create order with user information
            order = Order.objects.create(
                user=user,
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                room_number=data.get('room_number'),
                subtotal=Decimal(data.get('subtotal')),
                shipping_fee=Decimal(data.get('shipping_fee')),
                tax=Decimal(data.get('tax')),
                total=Decimal(data.get('total')),
                order_status='PENDING',
                order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}"
            )
            
            # Get cart items
            cart_items = CartItem.objects.filter(id__in=(data.get('cart_items', [])))
            
            # Create order items for each cart item
            for cart_item in cart_items:
                user_vendor = cart_item.product.vendor  # this is a User instance

                # Try to get the related Vendor instance
                vendor_instance = Vendor.objects.filter(user=user_vendor).first()

                if not vendor_instance:
                    return Response(
                        {"error": f"No vendor profile found for {user_vendor.email}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    vendor=vendor_instance,
                    color=cart_item.color if hasattr(cart_item, 'color') else None,
                    size=cart_item.size if hasattr(cart_item, 'size') else None
                )
            return Response({
                'order_id': order.id,
                'order_number': order.order_number,
                'message': 'Order created successfully. Proceed to payment.'
            }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in CreateOrderView: {str(e)}")
            print(error_trace)
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaystackPaymentInitializeView(APIView):
    permission_classes = [IsAuthenticated]  # Or IsAuthenticated if you require login
    
    def post(self, request, *args, **kwargs):
        try:
            data = request.data
            order_id = data.get('order_id')
            email = data.get('email')
            amount = data.get('amount')  # amount in kobo (multiply by 100)
            callback_url = data.get('callback_url')
            
            # Get the order
            order = Order.objects.get(id=order_id)
            
            # Initialize Paystack payment
            url = "https://api.paystack.co/transaction/initialize"
            
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "email": email,
                "amount": amount,
                "callback_url": callback_url,
                "reference": f"ORD-{order.order_number}-{uuid.uuid4().hex[:8]}"
            }
            
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response_data = response.json()
            
            if response_data.get('status'):
                # Create transaction record
                transaction = Transaction.objects.create(
                    order=order,
                    transaction_id=response_data['data']['reference'],
                    amount=order.total,
                    status='PENDING'
                )
                
                return Response({
                    'status': 'success',
                    'authorization_url': response_data['data']['authorization_url'],
                    'reference': response_data['data']['reference']
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'failed',
                    'message': response_data.get('message', 'Payment initialization failed')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in PaystackPaymentInitializeView: {str(e)}")
            print(error_trace)
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaystackPaymentVerifyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            reference = request.query_params.get('reference')
            cart_code = request.query_params.get('cart_code')  # Get cart_code from query params
            
            # Check if reference is valid
            if not reference:
                return Response({
                    'status': 'failed',
                    'message': 'Reference parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get transaction first to check if already processed
            transaction = Transaction.objects.filter(transaction_id=reference).first()
            
            if not transaction:
                return Response({
                    'status': 'failed',
                    'message': 'Transaction not found'
                }, status=status.HTTP_404_NOT_FOUND)
                
            # Idempotency check - if transaction is already completed, don't process again
            if transaction.status == 'COMPLETED':
                return Response({
                    'status': 'success',
                    'message': 'Payment already verified',
                    # 'order_number': order.order_number
                }, status=status.HTTP_200_OK)
            
            # Only verify with Paystack if transaction hasn't been completed
            url = f"https://api.paystack.co/transaction/verify/{reference}"
            headers = {
                "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
                "Content-Type": "application/json"
            }

            response = requests.get(url, headers=headers)
            response_data = response.json()

            if not response_data.get('status'):
                return Response({
                    'status': 'failed',
                    'message': response_data.get('message', 'Payment verification failed')
                }, status=status.HTTP_400_BAD_REQUEST)

            if response_data['data']['status'] != 'success':
                transaction.status = 'FAILED'
                transaction.save()
                return Response({
                    'status': 'failed',
                    'message': 'Payment failed or was canceled'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Payment was successful - use transaction to prevent race conditions
            from django.db import transaction as db_transaction
            
            with db_transaction.atomic():
                # Lock the transaction record for update
                transaction_obj = Transaction.objects.select_for_update().get(id=transaction.id)
                
                # Double-check transaction status after lock
                if transaction_obj.status == 'COMPLETED':
                    return Response({
                        'status': 'success',
                        'message': 'Payment already verified',
                        'order_number': order.order_number
                    }, status=status.HTTP_200_OK)
                
                transaction_obj.status = 'COMPLETED'
                transaction_obj.payment_method = 'PAYSTACK'
                transaction_obj.save()

                order = transaction_obj.order
                
                # Check if order is already paid
                if order.order_status != 'PAID':
                    order.order_status = 'PAID'
                    order.save()

                order_items = OrderItem.objects.filter(order=order)
                vendor_totals = {}
                vendors_to_notify = set()
                notified_vendors = set()

                # First, collect all the vendors to avoid the join error
                for item in order_items:
                    if hasattr(item, 'vendor') and item.vendor is not None:
                        vendors_to_notify.add(item.vendor)
                        
                        # Add to vendor wallet totals
                        item_total = item.price * item.quantity
                        if item.vendor.id in vendor_totals:
                            vendor_totals[item.vendor.id] += item_total
                        else:
                            vendor_totals[item.vendor.id] = item_total

                # Process product stock updates with improved error handling
                for item in order_items:
                    product = item.product
                    
                    # Update main product stock
                    product.in_stock = max(product.in_stock - item.quantity, 0)
                    product.save()

                    # Update size stock if applicable
                    if hasattr(item, 'size') and item.size:
                        try:
                            size_obj = ProductSize.objects.get(product=product, size=item.size)
                            size_obj.quantity = max(size_obj.quantity - item.quantity, 0)
                            size_obj.save()
                            logger.info(f"Updated size inventory for product {product.id}, size {item.size}, new quantity: {size_obj.quantity}")
                            
                            # Check if out of stock notification is needed
                            if size_obj.quantity == 0 and hasattr(item, 'vendor') and item.vendor is not None:
                                if item.vendor not in notified_vendors:
                                    notified_vendors.add(item.vendor)
                        except ProductSize.DoesNotExist:
                            logger.warning(f"Size {item.size} not found for product {product.id}")
                    
                    # Update color stock if applicable
                    if hasattr(item, 'color') and item.color:
                        try:
                            color_obj = ProductColor.objects.get(product=product, color=item.color)
                            color_obj.quantity = max(color_obj.quantity - item.quantity, 0)
                            color_obj.save()
                            logger.info(f"Updated color inventory for product {product.id}, color {item.color}, new quantity: {color_obj.quantity}")
                        except ProductColor.DoesNotExist:
                            logger.warning(f"Color {item.color} not found for product {product.id}")
                
                # Send out of stock notifications
                for vendor in notified_vendors:
                    try:
                        send_mail(
                            subject="Product Out of Stock",
                            message=(
                                f"Dear {vendor.business_name},\n\n"
                                "One or more of your products is now out of stock. "
                                "Please restock to continue receiving orders."
                            ),
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[vendor.user.email]
                        )
                        logger.info(f"Sent out-of-stock notification to vendor {vendor.id}")
                    except Exception as e:
                        logger.error(f"Failed to send out-of-stock email to vendor {vendor.id}: {str(e)}")

                # Update vendor wallets - with better error handling
                # for vendor_id, amount in vendor_totals.items():
                #     try:
                #         vendor = Vendor.objects.get(id=vendor_id)
                #         wallet, created = Wallet.objects.get_or_create(
                #             vendor=vendor,
                #             defaults={'balance': 0}
                #         )
                #         wallet.balance += amount
                #         wallet.save()
                #         logger.info(f"Updated wallet for vendor {vendor_id}, new balance: {wallet.balance}")
                #     except Vendor.DoesNotExist:
                #         logger.error(f"Vendor with ID {vendor_id} not found when processing payment")
                #         continue

                # Send order notifications to all vendors - improved implementation
                for vendor in vendors_to_notify:
                    try:
                        # Filter items for this specific vendor
                        vendor_items = []
                        vendor_total = 0  # Initialize total for this vendor
                        
                        for item in order_items:
                            if hasattr(item, 'vendor') and item.vendor is not None and item.vendor.id == vendor.id:
                                # Ensure price is a valid number
                                item_price = item.price if item.price is not None else 0
                                    
                                # Calculate the total for each item
                                item_subtotal = item_price * item.quantity
                                
                                # Add calculated subtotal as a property to the item for template use
                                item.subtotal = item_subtotal
                                
                                # Add to vendor total
                                vendor_total += item_subtotal
                                
                                vendor_items.append(item)
                        
                        if vendor_items:
                            # Create complete context for template
                            vendor_context = {
                                "order": order,
                                "vendor_items": vendor_items,
                                "vendor": vendor,
                                "current_year": now().year,
                                "total": vendor_total,
                                "dashboard_url": f"{settings.FRONTEND_URL}/vendor/dashboard/orders/{order.order_number}"
                            }
                            
                            # Render HTML email template
                            vendor_html_content = render_to_string("email/ordered.html", vendor_context)
                            
                            # Generate PDF with WeasyPrint
                            pdf_buffer = BytesIO()
                            HTML(string=vendor_html_content).write_pdf(pdf_buffer)
                            pdf_buffer.seek(0)  # Reset buffer position to the beginning

                            # Email buyer receipt
                            email_subject = f"Your Order Receipt - #{order.order_number}"
                            email = EmailMultiAlternatives(
                                subject=email_subject,
                                body="Your order receipt is attached as a PDF.",
                                from_email=settings.DEFAULT_FROM_EMAIL,
                                to=[vendor.user.email],
                            )
                            email.attach_alternative(vendor_html_content, "text/html")
                            email.attach(f"receipt_{order.order_number}.pdf", pdf_buffer.getvalue(), "application/pdf")
                            email.send()
                            
                            logger.info(f"Order notification sent to vendor {vendor.id} for order {order.order_number}")
                    except Exception as e:
                        logger.error(f"Error sending notification to vendor {vendor.id}: {str(e)}", exc_info=True)
                        continue  # Continue with other vendors even if one fails

                # Delete the cart after successful payment
                if cart_code:
                    try:
                        cart = Cart.objects.get(cart_code=cart_code)
                        cart.delete()
                        logger.info(f"Deleted cart {cart_code} after successful payment")
                    except Cart.DoesNotExist:
                        logger.warning(f"Cart with code {cart_code} not found for deletion after payment")
                    except Exception as e:
                        logger.error(f"Error deleting cart {cart_code}: {str(e)}")

                # Prepare receipt PDF for the customer
                try:
                    # Process order items to add total
                    for item in order_items:
                        # Ensure price is a valid number
                        item_price = item.price if item.price is not None else 0
                        
                        # Calculate the total for each item
                        item.total = item_price * item.quantity
                    
                    context = {
                        "order": order,
                        "order_items": order_items,
                        "current_year": now().year,
                    }

                    html_content = render_to_string("email/receipts.html", context)

                    # Generate PDF with WeasyPrint
                    pdf_buffer = BytesIO()
                    HTML(string=html_content).write_pdf(pdf_buffer)
                    pdf_buffer.seek(0)  # Reset buffer position to the beginning

                    # Email buyer receipt
                    email_subject = f"Your Order Receipt - #{order.order_number}"
                    email = EmailMultiAlternatives(
                        subject=email_subject,
                        body="Your order receipt is attached as a PDF.",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[order.email],
                    )
                    email.attach_alternative(html_content, "text/html")
                    email.attach(f"receipt_{order.order_number}.pdf", pdf_buffer.getvalue(), "application/pdf")
                    email.send()
                    
                    logger.info(f"Sent receipt email to customer {order.email} for order {order.order_number}")
                except Exception as e:
                    logger.error(f"Error with receipt generation or sending: {str(e)}", exc_info=True)

            return Response({
                'status': 'success',
                'message': 'Payment verified successfully',
                'order_number': order.order_number
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}", exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class OrderDetailView(APIView):
    def get (request, order_number):
        """Get details for a specific order by order number"""
        try:
            # Try to find the order
            order = get_object_or_404(Order, order_number=order_number)
            
            # Get all order items
            order_items = OrderItem.objects.filter(order=order)
            
            # Try to get the transaction
            try:
                transaction = Transaction.objects.get(order=order)
                transaction_data = {
                    'transaction_id': transaction.transaction_id,
                    'amount': float(transaction.amount),
                    'status': transaction.status,
                    'payment_method': transaction.payment_method,
                    'created_at': transaction.created_at
                }
            except Transaction.DoesNotExist:
                transaction_data = None
            
            # Format the order items
            items_data = []
            for item in order_items:
                product_data = {
                    'id': item.product.id,
                    'name': item.product.name,
                    'image': str(item.product.image) if item.product.image else None
                }
                
                items_data.append({
                    'id': item.id,
                    'product': product_data,
                    'quantity': item.quantity,
                    'price': float(item.price),
                    'size': item.size,
                    'color': item.color,
                    'vendor': item.vendor.user.username if item.vendor else None
                })
            
            # Build the response
            response_data = {
                'id': order.id,
                'order_number': order.order_number,
                'first_name': order.first_name,
                'last_name': order.last_name,
                'email': order.email,
                'phone': order.phone,
                'address': order.address,
                'room_number': order.room_number,
                'subtotal': float(order.subtotal),
                'shipping_fee': float(order.shipping_fee),
                'tax': float(order.tax),
                'total': float(order.total),
                'order_status': order.order_status,
                'created_at': order.created_at,
                'order_items': items_data,
                'transaction': transaction_data
            }
            
            return Response(response_data)
        
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        

class OrderHistoryView(APIView):
    def get(self, request):
        """Get all orders for the authenticated user"""
        try:
            user = request.user
            
            # Get all orders for the user with related data to reduce DB queries
            orders = Order.objects.filter(user=user).select_related('picker').prefetch_related(
                'order_items__product',
                'order_items__vendor',
                'picker__picker_profile',  # Add this to prefetch picker profile
                'picker__student_picker_profile'  # Add this to prefetch student picker profile
            ).order_by('-created_at')
            
            order_data = []
            for order in orders:
                items_data = []
                for item in order.order_items.all():  # Use prefetched data
                    image_url = None
                    if item.product.image:
                        image_url = request.build_absolute_uri(item.product.image.url)
                    
                    product_data = {
                        'id': item.product.id,
                        'name': item.product.name,
                        'image': image_url
                    }
                    
                    # Get picker profile ID based on user type
                    picker_profile_id = None
                    picker_type = None
                    if order.picker:
                        try:
                            if hasattr(order.picker, 'picker_profile'):
                                picker_profile_id = order.picker.picker_profile.id
                                picker_type = 'picker'
                            elif hasattr(order.picker, 'student_picker_profile'):
                                picker_profile_id = order.picker.student_picker_profile.id
                                picker_type = 'student_picker'
                        except Exception as e:
                            print(f"Error getting picker profile: {e}")
                    
                    items_data.append({
                        'id': item.id,
                        'product': product_data,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'size': item.size,
                        'color': item.color,
                        'vendor': item.vendor.business_name if item.vendor else None,
                        'vendor_id': item.vendor.id if item.vendor else None,
                    })
                
                # Also add picker info at order level
                picker_info = None
                if order.picker:
                    picker_profile_id = None
                    picker_type = None
                    picker_name = f"{order.picker.first_name} {order.picker.last_name}"
                    
                    try:
                        if hasattr(order.picker, 'picker_profile'):
                            picker_profile_id = order.picker.picker_profile.id
                            picker_type = 'picker'
                            picker_info = {
                                'user_id': order.picker.id,
                                'profile_id': picker_profile_id,
                                'name': picker_name,
                                'type': picker_type,
                                'fleet_type': order.picker.picker_profile.fleet_type,
                                'rating': float(order.picker.picker_profile.rating)
                            }
                        elif hasattr(order.picker, 'student_picker_profile'):
                            picker_profile_id = order.picker.student_picker_profile.id
                            picker_type = 'student_picker'
                            picker_info = {
                                'user_id': order.picker.id,
                                'profile_id': picker_profile_id,
                                'name': picker_name,
                                'type': picker_type,
                                'hostel_name': order.picker.student_picker_profile.hostel_name,
                                'room_number': order.picker.student_picker_profile.room_number,
                                'rating': float(order.picker.student_picker_profile.rating)
                            }
                    except Exception as e:
                        print(f"Error getting picker info: {e}")
                
                order_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'subtotal': float(order.subtotal),
                    'shipping_fee': float(order.shipping_fee),
                    'tax': float(order.tax),
                    'total': float(order.total),
                    'order_status': order.order_status,
                    'created_at': order.created_at.isoformat(),  # Better date formatting
                    'order_items': items_data,
                    'picker': picker_info,  # Complete picker information
                    'reviewed': order.reviewed,
                    'shipping': {
                        'address': order.address,
                        'room_number': order.room_number,
                        'phone': order.phone,
                        'email': order.email,
                        'first_name': order.first_name,
                        'last_name': order.last_name,
                    }
                })
            
            return Response(order_data, status=200)
        
        except Exception as e:
            import traceback
            print(f"Error in OrderHistoryView: {str(e)}")
            print(traceback.format_exc())  # This will help debug future issues
            return Response({'error': str(e)}, status=400)

class ServiceDetailAPIView(APIView):
    """
    Get detailed information about a specific service
    """
    def get(self, request, pk):
        service = get_object_or_404(Vendor, pk=pk, business_category='others')
        serializer = VendorSerializer(service)
        return Response(serializer.data)       

class ServiceApplicationAPIView(APIView):
    """
    Submit an application for a service
    """
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

class CancelOrderView(APIView):
    """
    API endpoint for canceling an order
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            # Get the order
            order = Order.objects.get(id=order_id)

            # Check if user owns this order
            if order.user != request.user:
                return Response({
                    "status": "error",
                    "message": "You don't have permission to cancel this order"
                }, status=status.HTTP_403_FORBIDDEN)

            # Check if order can be cancelled
            if order.order_status in ['DELIVERED', 'CANCELLED']:
                return Response({
                    "status": "error",
                    "message": f"Order cannot be cancelled because it is {order.order_status}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # If order is assigned to a picker, check if it's in transit
            if order.picker and order.order_status == 'IN_TRANSIT':
                return Response({
                    "status": "error",
                    "message": "Order is already in transit and cannot be cancelled"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update order status
            order.order_status = 'CANCELLED'
            order.save()

            # Restore product inventory
            order_items = OrderItem.objects.filter(order=order)
            for item in order_items:
                product = item.product
                
                # Restore main product stock
                product.in_stock += item.quantity
                product.save()

                # Restore size stock if applicable
                if item.size:
                    try:
                        size_obj = ProductSize.objects.get(product=product, size=item.size)
                        size_obj.quantity += item.quantity
                        size_obj.save()
                    except ProductSize.DoesNotExist:
                        pass

                # Restore color stock if applicable
                if item.color:
                    try:
                        color_obj = ProductColor.objects.get(product=product, color=item.color)
                        color_obj.quantity += item.quantity
                        color_obj.save()
                    except ProductColor.DoesNotExist:
                        pass

            # Send cancellation emails
            try:
                # Email to customer
                send_mail(
                    subject=f"Order #{order.order_number} Cancelled",
                    message=(
                        f"Your order #{order.order_number} has been cancelled.\n\n"
                        f"Order Total: ₦{order.total}\n"
                        "If you have any questions, please contact support."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[order.email],
                    fail_silently=True
                )

                # Email to vendors
                vendors_notified = set()
                for item in order_items:
                    vendor = item.vendor
                    if vendor and vendor.id not in vendors_notified:
                        send_mail(
                            subject=f"Order #{order.order_number} Cancelled",
                            message=(
                                f"Order #{order.order_number} has been cancelled by the customer.\n\n"
                                f"Please note that the inventory has been automatically restored."
                            ),
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[vendor.user.email],
                            fail_silently=True
                        )
                        vendors_notified.add(vendor.id)

            except Exception as e:
                # Log email sending errors but don't affect the response
                logger.error(f"Error sending cancellation emails for order {order.order_number}: {str(e)}")

            return Response({
                "status": "success",
                "message": "Order cancelled successfully",
                "order_number": order.order_number
            }, status=status.HTTP_200_OK)

        except Order.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Order not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"An error occurred: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProductPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

import logging

class AllProductsView(APIView):
    pagination_class = ProductPagination

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
            
            # Apply common filters and return response
            queryset = self._apply_common_filters(queryset, filters)
            queryset = self._apply_sorting(queryset, filters['sort'])
            
            return self._paginate_and_serialize(queryset, request, filters)

        except Exception as e:
            return self._handle_error(e)

    def _handle_authenticated_viewing_own_school(self, request, filters):
        """
        AUTHENTICATED USER + view_other_products = FALSE
        
        User is logged in and wants to see products from their own school only.
        We COMPLETELY IGNORE any 'school' filter parameter because they can only see their own school.
        """
        print(f"Authenticated user viewing own school: {request.user.institution}")
        print("IGNORING any 'school' parameter - user can only see their own institution")
        
        # Start with all products, then filter ONLY by user's institution
        queryset = Product.objects.all()
        queryset = queryset.filter(vendor__institution__iexact=request.user.institution)
        
        print(f"Products from user's institution ({request.user.institution}): {queryset.count()}")
        
        return queryset

    def _handle_authenticated_viewing_other_schools(self, request, filters):
        """
        AUTHENTICATED USER + view_other_products = TRUE
        
        User is logged in but wants to see products from other schools.
        They can optionally filter by a specific school using the 'school' parameter.
        If no school is specified, they see products from ALL schools.
        """
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
        """Apply filters that are common to all user states"""
        
        # Category filter
        if filters['category']:
            queryset = queryset.filter(vendor__business_category__iexact=filters['category'])
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
            response.data['user_institution_product_count'] = Product.objects.filter(
                vendor__institution__iexact=request.user.institution
            ).count()
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


class PackOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get('order_id')
            if not order_id:
                return Response({
                    'error': 'Order ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Find order items belonging to this vendor
            vendor_order_items = OrderItem.objects.filter(
                order_id=order_id,
                vendor__user=request.user
            )

            if not vendor_order_items.exists():
                return Response({
                    'error': 'No order items found or unauthorized'
                }, status=status.HTTP_404_NOT_FOUND)

            # Get the order
            order = Order.objects.get(id=order_id)
            
            # Update packed status for the order
            order.packed = True
            order.save()

            email = order.email
            # Send email to the customer
            send_mail(
                subject=f"Order #{order.order_number} Packed",
                message=(
                    f"Hello {order.first_name},\n\n"
                    f"Your order #{order.order_number} has been packed and is ready for delivery.\n\n"
                    "Thank you for your patronage!"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False
            )

            # Get vendor details from the first order item
            first_item = vendor_order_items.first()
            vendor = first_item.vendor

            # Find and notify eligible pickers
            try:
                # Get the vendor's institution
                vendor_institution = vendor.user.institution
                
                # Find all pickers from the same institution
                regular_pickers = User.objects.filter(
                    user_type='picker',
                    institution=vendor_institution,
                    is_active=True
                )
                student_pickers = User.objects.filter(
                    user_type='student_picker',
                    institution=vendor_institution,
                    is_active=True
                )
                
                # Combine picker emails
                all_pickers_emails = []
                for picker in list(regular_pickers) + list(student_pickers):
                    all_pickers_emails.append(picker.email)
                
                if all_pickers_emails:
                    # Build email content
                    picker_subject = f"New Delivery Opportunity - Order #{order.order_number}"
                    picker_message = (
                        f"Hello,\n\n"
                        f"A new order is ready for pickup from {vendor.business_name} "
                        f"at {vendor_institution}.\n\n"
                        f"Order Number: {order.order_number}\n"
                        f"Order Date: {order.created_at}\n"
                        f"Pickup Location: {vendor.business_name}\n"  # Changed from vendor.address which doesn't exist
                        f"Delivery Location: {order.address}\n\n"
                        f"Please log in to your dashboard to accept this delivery. "
                        f"This opportunity is available on a first-come, first-served basis."
                    )
                    
                    # Send email to all eligible pickers
                    send_mail(
                        subject=picker_subject,
                        message=picker_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=all_pickers_emails,
                        fail_silently=False
                    )
                    
                    logger.info(f"Notified {len(all_pickers_emails)} pickers about order {order.order_number}")

            except Exception as e:
                logger.error(f"Failed to notify pickers for order {order_id}: {str(e)}")
                # Don't return error response here as the main operation succeeded

            return Response({
                'message': 'Order packed successfully and pickers notified',
                'order_id': order_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in PackOrderView: {str(e)}")
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

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

from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Q, Count, Max, Prefetch, OuterRef, Subquery
from django.utils import timezone
from django.core.paginator import Paginator
import json
from .models import Conversation, Message, MessageReadStatus, ServiceApplication
from User.models import Vendor


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
