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
            
            # Calculate subtotal
            sub_total = sum(item.product.price * item.quantity for item in cart_items if hasattr(item.product, 'price'))
            
            # Get unique vendors from cart items
            unique_vendors = set(item.product.vendor for item in cart_items if hasattr(item.product, 'vendor'))
            num_vendors = len(unique_vendors)
            
            # Calculate shipping fee (300 per vendor) - convert to Decimal
            shipping_fee = Decimal(300) * num_vendors
            
            # Calculate tax (5% of subtotal) - convert to Decimal
            tax = sub_total * Decimal('0.05')
            
            # Calculate total
            total = sub_total + shipping_fee + tax
            
            # Format response in the exact structure expected by frontend 
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
            cart_items = CartItem.objects.filter(id__in=data.get('cart_items', []))
            
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
                    'order_number': order.order_number
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
                for vendor_id, amount in vendor_totals.items():
                    try:
                        vendor = Vendor.objects.get(id=vendor_id)
                        wallet, created = Wallet.objects.get_or_create(
                            vendor=vendor,
                            defaults={'balance': 0}
                        )
                        wallet.balance += amount
                        wallet.save()
                        logger.info(f"Updated wallet for vendor {vendor_id}, new balance: {wallet.balance}")
                    except Vendor.DoesNotExist:
                        logger.error(f"Vendor with ID {vendor_id} not found when processing payment")
                        continue

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
    def get(self, request):  # changed from 'requests' to 'request'
        """Get all orders for the authenticated user"""
        try:
            user = request.user
            
            # Get all orders for the user
            orders = Order.objects.filter(user=user).order_by('-created_at')
            
            order_data = []
            for order in orders:
                order_items = OrderItem.objects.filter(order=order)
                
                items_data = []
                for item in order_items:
                    image_url = None
                    if item.product.image:
                        image_url = request.build_absolute_uri(item.product.image.url)

                    product_data = {
                        'id': item.product.id,
                        'name': item.product.name,
                        'image': image_url
                    }
                    
                    items_data.append({
                        'id': item.id,
                        'product': product_data,
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'size': item.size,
                        'color': item.color,
                        'vendor': item.vendor.business_name if item.vendor else None
                    })

                order_data.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'subtotal': float(order.subtotal),
                    'shipping_fee': float(order.shipping_fee),
                    'tax': float(order.tax),
                    'total': float(order.total),
                    'order_status': order.order_status,
                    'created_at': order.created_at,
                    'order_items': items_data,
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
            return Response({'error': str(e)}, status=400)

    