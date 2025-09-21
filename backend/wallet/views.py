from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from Stumart.models import *
from Stumart.serializers import *
import uuid
import requests
import json
from django.conf import settings
from django.utils.timezone import now
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from io import BytesIO
from django.http import HttpResponse
from decimal import Decimal
import logging
logger = logging.getLogger(__name__)
from weasyprint import HTML
from django.template import Context, Template
from django.shortcuts import get_object_or_404
from User.models import Vendor
from rest_framework import generics
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from Stumart.paginations import CustomPagination
from django.db import transaction
import string
import random
from datetime import timedelta
from wallet.models import *
from .models import *


# Create your views here.
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
            shipping_fee = Decimal('400') * num_vendors
            
            # Calculate tax (3% of subtotal)
            tax = sub_total * Decimal('0.040')  # 3% tax
            
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
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateOrderView(APIView):
    permission_classes = [AllowAny]  # Or IsAuthenticated if you require login

    def post(self, request, *args, **kwargs):
        try:
            data = request.data
            user = request.user if request.user.is_authenticated else None

            # Get cart items first to validate categories
            cart_items = CartItem.objects.filter(id__in=(data.get('cart_items', [])))
            
            if not cart_items.exists():
                return Response(
                    {"error": "No cart items found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Category validation logic
            category_validation_error = self.validate_cart_categories(cart_items)
            if category_validation_error:
                return Response(
                    {"error": category_validation_error},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Use transaction to ensure data consistency
            with transaction.atomic():
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

    def validate_cart_categories(self, cart_items):
        
        has_food_items = False
        has_non_food_items = False
        
        for cart_item in cart_items:
            # Get the vendor instance for this product
            vendor_instance = Vendor.objects.filter(user=cart_item.product.vendor).first()
            
            if not vendor_instance:
                continue  # Skip if vendor not found (will be handled later)
            
            # Check if this vendor sells food
            if vendor_instance.business_category == 'food':
                has_food_items = True
            else:
                has_non_food_items = True
        
        # If both food and non-food items exist, return error
        if has_food_items and has_non_food_items:
            return "Food items cannot be ordered together with other categories. Please place separate orders."
        
        return None  # No validation errors


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
            
            # Validate that all vendors in the order are from the same institution
            order_items = OrderItem.objects.filter(order=order).select_related('vendor', 'vendor__user')
            
            if not order_items.exists():
                return Response({
                    'status': 'failed',
                    'message': 'No items found in the order'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check that all vendors are from the same institution
            vendor_institutions = set()
            vendors_by_institution = {}
            
            for item in order_items:
                vendor_institution = item.vendor.user.institution
                vendor_institutions.add(vendor_institution)
                
                # Group vendors by institution for detailed error reporting
                if vendor_institution not in vendors_by_institution:
                    vendors_by_institution[vendor_institution] = []
                
                vendors_by_institution[vendor_institution].append({
                    'vendor_name': item.vendor.business_name,
                    'product_name': item.product.name
                })
            
            # Ensure all vendors are from the same institution
            if len(vendor_institutions) > 1:
                return Response({
                    'status': 'failed',
                    'message': 'Cannot process payment. All vendors in your order must be from the same institution for delivery purposes.',
                    'error_details': {
                        'multiple_institutions_found': list(vendor_institutions),
                        'vendors_by_institution': vendors_by_institution,
                        'suggestion': 'Please split your order by institution or remove items from different institutions.'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # If validation passes, proceed with Paystack payment initialization
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
                    'reference': response_data['data']['reference'],
                    'delivery_institution': list(vendor_institutions)[0]  # Single institution for delivery
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'status': 'failed',
                    'message': response_data.get('message', 'Payment initialization failed')
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Order.DoesNotExist:
            return Response({
                'status': 'failed',
                'message': 'Order not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
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
        

class PackOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            order_id = request.data.get('order_id')
            if not order_id:
                return Response({
                    'error': 'Order ID is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # First, check if order exists and user has permission
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return Response({
                    'error': 'Order not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Check if vendor has items in this order
            vendor_order_items = OrderItem.objects.filter(
                order_id=order_id,
                vendor__user=request.user
            )

            if not vendor_order_items.exists():
                return Response({
                    'error': 'No order items found or unauthorized'
                }, status=status.HTTP_404_NOT_FOUND)

            # Now perform the transaction
            with transaction.atomic():
                # Re-fetch with select_for_update inside transaction
                vendor_order_items = OrderItem.objects.filter(
                    order_id=order_id,
                    vendor__user=request.user
                ).select_for_update()

                order = Order.objects.select_for_update().get(id=order_id)
                
                # Mark this vendor's items as packed
                vendor_order_items.update(is_packed=True, packed_at=timezone.now())
                
                # Get current vendor info
                current_vendor = vendor_order_items.first().vendor
                
                # Handle packing completion
                return self.handle_packing_completion(order, current_vendor, order_id)

        except Exception as e:
            logger.error(f"Error in PackOrderView: {str(e)}", exc_info=True)
            return Response({
                'error': f'An error occurred while processing your request. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def handle_packing_completion(self, order, current_vendor, order_id):
        """Handle packing completion and notifications"""
        # Check if all vendors have packed their items
        all_order_items = OrderItem.objects.filter(order_id=order_id)
        unpacked_items = all_order_items.filter(is_packed=False)
        
        all_vendors_packed = not unpacked_items.exists()
        
        if all_vendors_packed:
            order.packed = True
            order.save()
            
            # Schedule notifications after transaction commits
            transaction.on_commit(lambda: self.send_customer_notification(order, all_packed=True))
            transaction.on_commit(lambda: self.notify_pickers(order, current_vendor))
            
            return Response({
                'message': 'All vendors have packed their items. Order is ready for delivery and pickers have been notified.',
                'order_id': order_id,
                'all_packed': True,
                'vendor_packed': current_vendor.business_name
            }, status=status.HTTP_200_OK)
        
        else:
            # Not all vendors have packed yet
            packed_vendors = self.get_packed_vendors(order_id)
            unpacked_vendors = self.get_unpacked_vendors(order_id)
            
            # Schedule notification after transaction commits
            transaction.on_commit(lambda: self.send_customer_notification(
                order, 
                all_packed=False, 
                packed_vendor=current_vendor,
                packed_vendors=packed_vendors,
                unpacked_vendors=unpacked_vendors
            ))
            
            return Response({
                'message': f'{current_vendor.business_name} has packed their items. Waiting for other vendors to pack.',
                'order_id': order_id,
                'all_packed': False,
                'vendor_packed': current_vendor.business_name,
                'packed_vendors': [v.business_name for v in packed_vendors],
                'unpacked_vendors': [v.business_name for v in unpacked_vendors]
            }, status=status.HTTP_200_OK)

    def get_packed_vendors(self, order_id):
        """Get list of vendors who have packed their items"""
        return Vendor.objects.filter(
            orderitem__order_id=order_id,
            orderitem__is_packed=True
        ).distinct()
    
    def get_unpacked_vendors(self, order_id):
        """Get list of vendors who haven't packed their items yet"""
        return Vendor.objects.filter(
            orderitem__order_id=order_id,
            orderitem__is_packed=False
        ).distinct()

    def send_customer_notification(self, order, all_packed=False, packed_vendor=None, 
                                 packed_vendors=None, unpacked_vendors=None):
        """Send email notification to customer about packing status"""
        try:
            if all_packed:
                subject = f"Order #{order.order_number} Ready for Delivery"
                message = (
                    f"Hello {order.first_name},\n\n"
                    f"Great news! Your order #{order.order_number} has been completely packed "
                    f"by all vendors and is now ready for delivery.\n\n"
                    f"Our delivery team has been notified and will contact you soon.\n\n"
                    f"Thank you for your patronage!"
                )
            else:
                packed_names = [v.business_name for v in packed_vendors] if packed_vendors else []
                unpacked_names = [v.business_name for v in unpacked_vendors] if unpacked_vendors else []
                
                subject = f"Order #{order.order_number} Partially Packed"
                message = (
                    f"Hello {order.first_name},\n\n"
                    f"Your order #{order.order_number} is being prepared.\n\n"
                    f"✅ Packed by: {', '.join(packed_names)}\n"
                    f"⏳ Still preparing: {', '.join(unpacked_names)}\n\n"
                    f"We'll notify you once all items are ready for delivery.\n\n"
                    f"Thank you for your patience!"
                )

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                fail_silently=True
            )
        except Exception as e:
            logger.error(f"Failed to send customer notification for order {order.order_number}: {str(e)}", exc_info=True)

    def notify_pickers(self, order, vendor):
        """Notify pickers based on company picker availability"""
        try:
            # Get the vendor's institution
            vendor_institution = vendor.user.institution
            logger.info(f"Vendor institution: {vendor_institution}")
            
            if not vendor_institution:
                logger.warning(f"Vendor {vendor.business_name} has no institution set")
                return
            
            # Check if there are company pickers in the institution
            company_users = User.objects.filter(
                user_type='company',
                institution=vendor_institution,
                is_active=True
            )
            
            logger.info(f"Found {company_users.count()} company users in institution {vendor_institution}")
            
            if company_users.exists():
                # If company users exist, get their active riders and notify them
                company_riders = []
                
                for company_user in company_users:
                    try:
                        company = company_user.company_profile
                        active_riders = company.riders.filter(status='active')
                        company_riders.extend(active_riders)
                    except AttributeError:
                        logger.warning(f"Company user {company_user.email} has no company profile")
                        continue
                
                if company_riders:
                    logger.info(f"Notifying {len(company_riders)} company riders only")
                    self.create_and_notify_company_riders(order, vendor, company_riders)
                    return
                else:
                    logger.info("Company users exist but no active riders found, falling back to regular pickers")
            
            # If no company users or no active riders, notify regular and student pickers
            target_pickers = User.objects.filter(
                user_type__in=['picker', 'student_picker'],
                institution=vendor_institution,
                is_active=True
            )
            
            if not target_pickers.exists():
                logger.warning(f"No pickers found in institution {vendor_institution}")
                return
            
            logger.info(f"Notifying {target_pickers.count()} regular/student pickers")
            self.create_and_notify_regular_pickers(order, vendor, target_pickers)
            
        except Exception as e:
            logger.error(f"Failed to notify pickers for order {order.id}: {str(e)}", exc_info=True)

    def generate_unique_code(self, order_id, picker_identifier):
        """Generate unique code for delivery opportunity"""
        # Create a unique code: DEL_[ORDER_ID]_[RANDOM_6_CHARS]
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"DEL_{order_id}_{random_suffix}"

    def create_and_notify_company_riders(self, order, vendor, company_riders):
        """Create delivery opportunities for company riders and send notifications"""
        try:
            # Set expiration time (24 hours from now)
            expires_at = timezone.now() + timedelta(hours=24)
            
            opportunities = []
            rider_data = []
            
            for rider in company_riders:
                # Generate unique code for each rider
                unique_code = self.generate_unique_code(order.id, f"CR_{rider.id}")
                
                # Ensure code is truly unique
                while DeliveryOpportunity.objects.filter(unique_code=unique_code).exists():
                    unique_code = self.generate_unique_code(order.id, f"CR_{rider.id}")
                
                # Create delivery opportunity
                opportunity = DeliveryOpportunity(
                    order=order,
                    unique_code=unique_code,
                    picker_type='company_rider',
                    company_rider=rider,
                    expires_at=expires_at
                )
                opportunities.append(opportunity)
                
                # Store rider data for email
                rider_data.append({
                    'rider': rider,
                    'unique_code': unique_code,
                    'acceptance_link': f"{settings.FRONTEND_URL}/accept-delivery/{unique_code}"
                })
            
            # Bulk create opportunities
            DeliveryOpportunity.objects.bulk_create(opportunities)
            
            # Send notification emails
            self.send_company_rider_notification_emails(order, vendor, rider_data)
            
            logger.info(f"Created {len(opportunities)} delivery opportunities for company riders")
            
        except Exception as e:
            logger.error(f"Failed to create company rider opportunities: {str(e)}", exc_info=True)

    def create_and_notify_regular_pickers(self, order, vendor, target_pickers):
        """Create delivery opportunities for regular pickers and send notifications"""
        try:
            # Set expiration time (24 hours from now)
            expires_at = timezone.now() + timedelta(hours=24)
            
            opportunities = []
            picker_data = []
            
            for picker in target_pickers:
                # Generate unique code for each picker
                unique_code = self.generate_unique_code(order.id, f"UP_{picker.id}")
                
                # Ensure code is truly unique
                while DeliveryOpportunity.objects.filter(unique_code=unique_code).exists():
                    unique_code = self.generate_unique_code(order.id, f"UP_{picker.id}")
                
                # Create delivery opportunity
                opportunity = DeliveryOpportunity(
                    order=order,
                    unique_code=unique_code,
                    picker_type='regular_picker' if picker.user_type == 'picker' else 'student_picker',
                    user_picker=picker,
                    expires_at=expires_at
                )
                opportunities.append(opportunity)
                
                # Store picker data for email
                picker_data.append({
                    'picker': picker,
                    'unique_code': unique_code,
                    'acceptance_link': f"{settings.FRONTEND_URL}/accept-delivery/{unique_code}"
                })
            
            # Bulk create opportunities
            DeliveryOpportunity.objects.bulk_create(opportunities)
            
            # Send notification emails
            self.send_regular_picker_notification_emails(order, vendor, picker_data)
            
            logger.info(f"Created {len(opportunities)} delivery opportunities for regular pickers")
            
        except Exception as e:
            logger.error(f"Failed to create regular picker opportunities: {str(e)}", exc_info=True)

    def send_company_rider_notification_emails(self, order, vendor, rider_data):
        """Send notification emails to company riders with unique acceptance links"""
        try:
            # Get all vendors involved in this order
            order_vendors = Vendor.objects.filter(
                orderitem__order=order
            ).distinct()
            
            vendor_names = [v.business_name for v in order_vendors]
            
            for data in rider_data:
                rider = data['rider']
                unique_code = data['unique_code']
                acceptance_link = data['acceptance_link']
                
                # Build personalized email content
                subject = f"🚛 URGENT: Delivery Opportunity - Order #{order.order_number}"
                
                message = (
                    f"Hello {rider.name},\n\n"
                    f"A new delivery opportunity is available for immediate pickup!\n\n"
                    f"📦 ORDER DETAILS:\n"
                    f"• Order Number: {order.order_number}\n"
                    f"• Opportunity Code: {unique_code}\n"
                    f"• Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                    f"• Pickup Location: {', '.join(vendor_names)} at {vendor.user.institution}\n"
                    f"• Delivery Address: {order.address}\n"
                    f"• Room Number: {order.room_number or 'Not specified'}\n"
                    f"• Customer: {order.first_name} {order.last_name} ({order.phone})\n"
                    f"• Order Value: ₦{order.total}\n\n"
                    f"🎯 QUICK ACCEPT:\n"
                    f"Click this link to accept the delivery:\n"
                    f"{acceptance_link}\n\n"
                    f"📞 ALTERNATIVE:\n"
                    f"Reply to this email or call with:\n"
                    f"• Your name: {rider.name}\n"
                    f"• Phone: {rider.phone}\n"
                    f"• Code: {unique_code}\n"
                    f"• Expected pickup time\n\n"
                    f"⚠️ This opportunity expires in 24 hours.\n"
                    f"⏰ First acceptance wins!\n\n"
                    f"Company: {rider.company.user.first_name} {rider.company.user.last_name}\n"
                    f"Contact: {rider.company.user.phone_number}\n\n"
                    f"Best regards,\n"
                    f"Stumart Team"
                )
                
                # Send individual email to each rider
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[rider.email],
                    fail_silently=False
                )
                logger.info(f"Sent delivery opportunity email to rider {rider.name} ({unique_code})")
            
        except Exception as e:
            logger.error(f"Failed to send company rider notification emails: {str(e)}", exc_info=True)

    def send_regular_picker_notification_emails(self, order, vendor, picker_data):
        """Send notification emails to regular pickers with unique acceptance links"""
        try:
            # Get all vendors involved in this order
            order_vendors = Vendor.objects.filter(
                orderitem__order=order
            ).distinct()
            
            vendor_names = [v.business_name for v in order_vendors]
            
            for data in picker_data:
                picker = data['picker']
                unique_code = data['unique_code']
                acceptance_link = data['acceptance_link']
                
                # Build personalized email content
                subject = f"🚴 New Delivery Opportunity - Order #{order.order_number}"
                
                message = (
                    f"Hello {picker.first_name} {picker.last_name},\n\n"
                    f"A new delivery opportunity is available at your institution!\n\n"
                    f"📦 ORDER DETAILS:\n"
                    f"• Order Number: {order.order_number}\n"
                    f"• Opportunity Code: {unique_code}\n"
                    f"• Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                    f"• Pickup Location: {', '.join(vendor_names)} at {vendor.user.institution}\n"
                    f"• Delivery Address: {order.address}\n"
                    f"• Room Number: {order.room_number or 'Not specified'}\n"
                    f"• Customer: {order.first_name} {order.last_name} ({order.phone})\n"
                    f"• Order Value: ₦{order.total}\n\n"
                    f"🎯 QUICK ACCEPT:\n"
                    f"Click this link to accept the delivery:\n"
                    f"{acceptance_link}\n\n"
                    f"📞 ALTERNATIVE:\n"
                    f"Reply to this email with:\n"
                    f"• Your name and contact\n"
                    f"• Code: {unique_code}\n"
                    f"• Expected pickup time\n\n"
                    f"⚠️ This opportunity expires in 24 hours.\n"
                    f"⏰ First acceptance wins!\n\n"
                    f"Best regards,\n"
                    f"Stumart Team"
                )
                
                # Send individual email to each picker
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[picker.email],
                    fail_silently=False
                )
                logger.info(f"Sent delivery opportunity email to picker {picker.first_name} {picker.last_name} ({unique_code})")
            
        except Exception as e:
            logger.error(f"Failed to send regular picker notification emails: {str(e)}", exc_info=True)


from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

import uuid
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class AcceptDeliveryView(APIView):
    permission_classes = [] 
    
    def post(self, request):
        try:
            unique_code = request.data.get('unique_code')
            rider_name = request.data.get('rider_name')
            rider_phone = request.data.get('rider_phone')
            pickup_time = request.data.get('pickup_time', 'ASAP')
            
            # Validate required fields
            if not all([unique_code, rider_name, rider_phone]):
                return Response({
                    'error': 'Missing required fields: unique_code, rider_name, rider_phone'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                try:
                    # Get the delivery opportunity with select_for_update to prevent race conditions
                    opportunity = DeliveryOpportunity.objects.select_for_update().get(
                        unique_code=unique_code
                    )
                except DeliveryOpportunity.DoesNotExist:
                    return Response({
                        'error': 'Invalid delivery code or opportunity not found'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Check if opportunity can still be accepted
                if not opportunity.can_be_accepted():
                    if opportunity.status == 'accepted':
                        return Response({
                            'error': 'This delivery has already been accepted by another rider',
                            'message': 'Sorry, someone else got there first!'
                        }, status=status.HTTP_409_CONFLICT)
                    elif opportunity.is_expired():
                        return Response({
                            'error': 'This delivery opportunity has expired',
                            'message': 'This opportunity is no longer available'
                        }, status=status.HTTP_410_GONE)
                    else:
                        return Response({
                            'error': 'This delivery opportunity is no longer available'
                        }, status=status.HTTP_410_GONE)
                
                # Get the order
                order = opportunity.order
                
                # Generate delivery confirmation code
                delivery_confirmation_code = self.generate_delivery_confirmation_code(order.id)
                
                # Update the opportunity
                opportunity.status = 'accepted'
                opportunity.accepted_at = timezone.now()
                opportunity.accepted_rider_name = rider_name
                opportunity.accepted_rider_phone = rider_phone
                opportunity.pickup_time = pickup_time
                opportunity.delivery_confirmation_code = delivery_confirmation_code
                opportunity.save()
                
                # Update the order based on picker type
                if opportunity.picker_type == 'company_rider':
                    # Company rider acceptance
                    order.company_picker = True
                    order.company_picker_email = opportunity.company_rider.email
                    order.picker = None  # Company riders don't have User accounts
                    order.order_status = 'IN_TRANSIT'
                    
                    logger.info(f"Order {order.order_number} accepted by company rider: {rider_name}")
                    
                else:
                    # Regular or student picker acceptance
                    order.company_picker = False
                    order.company_picker_email = None
                    order.picker = opportunity.user_picker
                    order.order_status = 'IN_TRANSIT'
                    
                    logger.info(f"Order {order.order_number} accepted by user picker: {rider_name}")
                
                order.save()
                
                # Cancel all other pending opportunities for this order
                cancelled_count = self.cancel_other_opportunities(order, opportunity)
                
                # Send notifications after transaction commits
                transaction.on_commit(lambda: self.send_acceptance_notifications(
                    order, opportunity, rider_name, rider_phone, pickup_time, delivery_confirmation_code
                ))
                
                if cancelled_count > 0:
                    transaction.on_commit(lambda: self.notify_other_riders_cancelled(
                        order, opportunity, cancelled_count
                    ))
                
                return Response({
                    'success': True,
                    'message': f'Delivery accepted successfully by {rider_name}',
                    'order_number': order.order_number,
                    'pickup_time': pickup_time,
                    'rider_name': rider_name,
                    'rider_phone': rider_phone,
                    'is_company_rider': opportunity.picker_type == 'company_rider',
                    'other_opportunities_cancelled': cancelled_count,
                    'delivery_confirmation_code': delivery_confirmation_code
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error in AcceptDeliveryView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing your request. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_delivery_confirmation_code(self, order_id):
        """Generate unique delivery confirmation code"""
        # Create a unique code: CONF_[ORDER_ID]_[RANDOM_UUID]
        confirmation_code = f"CONF_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        
        # Ensure code is truly unique
        while DeliveryOpportunity.objects.filter(delivery_confirmation_code=confirmation_code).exists():
            confirmation_code = f"CONF_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        
        return confirmation_code
    
    def generate_delivery_code(self, order_id):
        """Generate unique delivery code"""
        # Create a unique code: DEL_[ORDER_ID]_[RANDOM_UUID]
        delivery_code = f"DEL_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        
        # Ensure code is truly unique
        while DeliveryOpportunity.objects.filter(delivery_code=delivery_code).exists():
            delivery_code = f"DEL_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        
        return delivery_code

        
    def get(self, request, unique_code=None):
        try:
            if not unique_code:
                return Response({
                    'error': 'Unique code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                opportunity = DeliveryOpportunity.objects.get(unique_code=unique_code)
            except DeliveryOpportunity.DoesNotExist:
                return Response({
                    'error': 'Invalid delivery code or opportunity not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            order = opportunity.order
            
            # Get vendor information
            order_vendors = Vendor.objects.filter(
                orderitem__order=order
            ).distinct()
            
            vendor_names = [v.business_name for v in order_vendors]
            
            # Check if opportunity is still available
            can_accept = opportunity.can_be_accepted()
            
            return Response({
                'opportunity_code': opportunity.unique_code,
                'can_accept': can_accept,
                'status': opportunity.status,
                'expires_at': opportunity.expires_at,
                'order': {
                    'order_number': order.order_number,
                    'created_at': order.created_at,
                    'vendors': vendor_names,
                    'pickup_location': order_vendors.first().user.institution if order_vendors.exists() else 'N/A',
                    'delivery_address': order.address,
                    'room_number': order.room_number or 'Not specified',
                    'customer_name': f"{order.first_name} {order.last_name}",
                    'customer_phone': order.phone,
                    'total_amount': float(order.total)
                },
                'picker_info': {
                    'type': opportunity.picker_type,
                    'name': opportunity.company_rider.name if opportunity.company_rider else 
                            f"{opportunity.user_picker.first_name} {opportunity.user_picker.last_name}" if opportunity.user_picker else 'Unknown'
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting delivery opportunity details: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while fetching opportunity details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def cancel_other_opportunities(self, order, accepted_opportunity):
        """Cancel all other pending opportunities for this order"""
        try:
            other_opportunities = DeliveryOpportunity.objects.filter(
                order=order,
                status='pending'
            ).exclude(id=accepted_opportunity.id)
            
            cancelled_count = other_opportunities.count()
            other_opportunities.update(
                status='cancelled',
                accepted_at=timezone.now()  # Use this to track when it was cancelled
            )
            
            logger.info(f"Cancelled {cancelled_count} other opportunities for order {order.order_number}")
            return cancelled_count
            
        except Exception as e:
            logger.error(f"Error cancelling other opportunities: {str(e)}", exc_info=True)
            return 0
    
    def send_acceptance_notifications(self, order, opportunity, rider_name, rider_phone, pickup_time, delivery_confirmation_code):
        """Send notifications about delivery acceptance"""
        try:
            # Notify customer
            self.notify_customer_delivery_accepted(order, rider_name, rider_phone, pickup_time)
            
            # Notify admin/vendor
            self.notify_admin_delivery_accepted(order, opportunity, rider_name, rider_phone, pickup_time)
            
            # Send delivery confirmation link to rider
            self.send_delivery_confirmation_link(order, opportunity, rider_name, rider_phone, delivery_confirmation_code)
            
        except Exception as e:
            logger.error(f"Error sending acceptance notifications: {str(e)}", exc_info=True)
    
    def send_delivery_confirmation_link(self, order, opportunity, rider_name, rider_phone, delivery_confirmation_code):
        """Send delivery confirmation link to the rider"""
        try:
            # Determine recipient email
            rider_email = (
                opportunity.company_rider.email 
                if opportunity.company_rider 
                else opportunity.user_picker.email
            )
            
            # Generate confirmation link
            confirmation_link = f"{settings.FRONTEND_URL}/confirm-delivery/{delivery_confirmation_code}"
            
            subject = f"Delivery Confirmation Link - Order #{order.order_number}"
            
            message = (
                f"Hello {rider_name},\n\n"
                f"Thank you for accepting the delivery for Order #{order.order_number}.\n\n"
                f"📦 ORDER DETAILS:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Customer: {order.first_name} {order.last_name}\n"
                f"• Delivery Address: {order.address}\n"
                f"• Room Number: {order.room_number or 'Not specified'}\n"
                f"• Customer Phone: {order.phone}\n"
                f"• Order Value: ₦{order.total}\n\n"
                f"🚀 IMPORTANT - DELIVERY CONFIRMATION:\n"
                f"Once you have successfully delivered the order to the customer, "
                f"please click the link below to confirm delivery:\n\n"
                f"{confirmation_link}\n\n"
                f"📋 DELIVERY INSTRUCTIONS:\n"
                f"1. Contact the customer when you're on your way\n"
                f"2. Verify the customer's identity before delivery\n"
                f"3. Handle items with care\n"
                f"4. Click the confirmation link ONLY after successful delivery\n"
                f"5. Keep this email for your records\n\n"
                f"⚠️ IMPORTANT: Only confirm delivery after the customer has received their order.\n\n"
                f"Thank you for your service!\n\n"
                f"Best regards,\n"
                f"Stumart Team"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[rider_email],
                fail_silently=False
            )
            
            logger.info(f"Sent delivery confirmation link to {rider_name} at {rider_email} for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to send delivery confirmation link: {str(e)}", exc_info=True)
    
    def notify_customer_delivery_accepted(self, order, rider_name, rider_phone, pickup_time):
        """Notify customer that their delivery has been accepted"""
        try:
            subject = f"Your Order #{order.order_number} is Out for Delivery!"
            
            message = (
                f"Hello {order.first_name},\n\n"
                f"Great news! Your order #{order.order_number} has been accepted for delivery.\n\n"
                f"🚴 DELIVERY DETAILS:\n"
                f"• Rider: {rider_name}\n"
                f"• Contact: {rider_phone}\n"
                f"• Pickup Time: {pickup_time}\n"
                f"• Delivery Address: {order.address}\n"
                f"• Room: {order.room_number or 'Not specified'}\n\n"
                f"Your rider will contact you when they're on the way.\n"
                f"You will receive another email once your order has been delivered.\n\n"
                f"Thank you for choosing Stumart!"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                fail_silently=True
            )
            
            logger.info(f"Sent delivery acceptance notification to customer for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to notify customer: {str(e)}", exc_info=True)
    
    def notify_admin_delivery_accepted(self, order, opportunity, rider_name, rider_phone, pickup_time):
        """Notify admin/system about delivery acceptance"""
        try:
            admin_emails = [settings.DEFAULT_FROM_EMAIL]  # Add your admin emails
            
            picker_type_display = {
                'company_rider': 'Company Rider',
                'regular_picker': 'Regular Picker',
                'student_picker': 'Student Picker'
            }.get(opportunity.picker_type, 'Unknown')
            
            subject = f"Delivery Accepted - Order #{order.order_number}"
            
            message = (
                f"A delivery has been accepted:\n\n"
                f"ORDER INFO:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Customer: {order.first_name} {order.last_name}\n"
                f"• Address: {order.address}\n"
                f"• Total: ₦{order.total}\n\n"
                f"RIDER INFO:\n"
                f"• Type: {picker_type_display}\n"
                f"• Name: {rider_name}\n"
                f"• Phone: {rider_phone}\n"
                f"• Pickup Time: {pickup_time}\n"
                f"• Email: {opportunity.company_rider.email if opportunity.company_rider else opportunity.user_picker.email}\n\n"
                f"Opportunity Code: {opportunity.unique_code}\n"
                f"Delivery Confirmation Code: {opportunity.delivery_confirmation_code}\n"
                f"Accepted At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True
            )
            
            logger.info(f"Sent delivery acceptance notification to admin for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to notify admin: {str(e)}", exc_info=True)
    
    def notify_other_riders_cancelled(self, order, accepted_opportunity, cancelled_count):
        """Notify other riders that the opportunity has been taken"""
        try:
            cancelled_opportunities = DeliveryOpportunity.objects.filter(
                order=order,
                status='cancelled'
            ).exclude(id=accepted_opportunity.id)
            
            for opportunity in cancelled_opportunities:
                try:
                    if opportunity.company_rider:
                        email = opportunity.company_rider.email
                        name = opportunity.company_rider.name
                    else:
                        email = opportunity.user_picker.email
                        name = f"{opportunity.user_picker.first_name} {opportunity.user_picker.last_name}"
                    
                    subject = f"Delivery Opportunity Taken - Order #{order.order_number}"
                    
                    message = (
                        f"Hello {name},\n\n"
                        f"The delivery opportunity for Order #{order.order_number} has been accepted by another rider.\n\n"
                        f"Don't worry - more opportunities are coming your way!\n\n"
                        f"Thank you for your quick response.\n\n"
                        f"Best regards,\n"
                        f"Stumart Team"
                    )
                    
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=True
                    )
                    
                except Exception as email_error:
                    logger.error(f"Failed to notify cancelled rider {opportunity.id}: {str(email_error)}")
                    continue
            
            logger.info(f"Notified {cancelled_count} riders that delivery was taken for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Error notifying cancelled riders: {str(e)}", exc_info=True)


class ConfirmDeliveryView(APIView):
    permission_classes = []
    
    def post(self, request):
        try:
            delivery_confirmation_code = request.data.get('delivery_confirmation_code')
            
            if not delivery_confirmation_code:
                return Response({
                    'error': 'Delivery confirmation code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                try:
                    # Get the delivery opportunity with the confirmation code
                    opportunity = DeliveryOpportunity.objects.select_for_update().get(
                        delivery_confirmation_code=delivery_confirmation_code
                    )
                except DeliveryOpportunity.DoesNotExist:
                    return Response({
                        'error': 'Invalid delivery confirmation code'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Check if opportunity is in accepted state
                if opportunity.status != 'accepted':
                    return Response({
                        'error': 'This delivery opportunity is not in accepted state',
                        'message': f'Current status: {opportunity.status}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                order = opportunity.order
                
                # Check if order is already delivered
                if order.order_status == 'DELIVERED':
                    return Response({
                        'error': 'This order has already been marked as delivered',
                        'message': 'Order is already in delivered status'
                    }, status=status.HTTP_409_CONFLICT)
                
                # Update order status to DELIVERED
                order.order_status = 'DELIVERED'
                order.save()
                
                # Update opportunity status
                customer_confirmation_code = self.generate_customer_confirmation_code(order.id)
                opportunity.status = 'completed'
                opportunity.delivered_at = timezone.now()
                opportunity.customer_confirmation_code = customer_confirmation_code
                opportunity.save()
                
                # Generate customer confirmation code
                
                # Send notifications after transaction commits
                transaction.on_commit(lambda: self.send_delivery_confirmation_notifications(
                    order, opportunity, customer_confirmation_code
                ))
                
                return Response({
                    'success': True,
                    'message': 'Delivery confirmed successfully',
                    'order_number': order.order_number,
                    'delivered_at': opportunity.delivered_at,
                    'customer_confirmation_code': customer_confirmation_code
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error in ConfirmDeliveryView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing your request. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request, delivery_confirmation_code=None):
        """Get delivery details for confirmation"""
        try:
            if not delivery_confirmation_code:
                return Response({
                    'error': 'Delivery confirmation code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                opportunity = DeliveryOpportunity.objects.get(
                    delivery_confirmation_code=delivery_confirmation_code
                )
            except DeliveryOpportunity.DoesNotExist:
                return Response({
                    'error': 'Invalid delivery confirmation code'
                }, status=status.HTTP_404_NOT_FOUND)
            
            order = opportunity.order
            
            return Response({
                'delivery_confirmation_code': delivery_confirmation_code,
                'can_confirm': opportunity.status == 'accepted' and order.order_status != 'DELIVERED',
                'opportunity_status': opportunity.status,
                'order_status': order.order_status,
                'order': {
                    'order_number': order.order_number,
                    'customer_name': f"{order.first_name} {order.last_name}",
                    'customer_phone': order.phone,
                    'delivery_address': order.address,
                    'room_number': order.room_number or 'Not specified',
                    'total_amount': float(order.total),
                    'created_at': order.created_at
                },
                'rider_info': {
                    'name': opportunity.accepted_rider_name,
                    'phone': opportunity.accepted_rider_phone,
                    'pickup_time': opportunity.pickup_time,
                    'accepted_at': opportunity.accepted_at
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting delivery confirmation details: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while fetching confirmation details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_customer_confirmation_code(self, order_id):
        """Generate unique customer confirmation code"""
        customer_confirmation_code = f"CUST_CONF_{order_id}_{str(uuid.uuid4())[:8].upper()}"
        return customer_confirmation_code
    
    def send_delivery_confirmation_notifications(self, order, opportunity, customer_confirmation_code):
        """Send notifications about successful delivery"""
        try:
            # Notify customer about delivery
            self.notify_customer_delivery_completed(order, opportunity, customer_confirmation_code)
            
            # Notify admin about delivery completion
            self.notify_admin_delivery_completed(order, opportunity)
            
        except Exception as e:
            logger.error(f"Error sending delivery confirmation notifications: {str(e)}", exc_info=True)
    
    def notify_customer_delivery_completed(self, order, opportunity, customer_confirmation_code):
        """Notify customer that their order has been delivered"""
        try:
            # Generate customer confirmation link
            customer_confirmation_link = f"{settings.FRONTEND_URL}/confirm-order-received/{customer_confirmation_code}"
            
            subject = f"Order #{order.order_number} Delivered Successfully!"
            
            message = (
                f"Hello {order.first_name},\n\n"
                f"Great news! Your order #{order.order_number} has been delivered successfully.\n\n"
                f"📦 DELIVERY DETAILS:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Delivered To: {order.address}\n"
                f"• Room: {order.room_number or 'Not specified'}\n"
                f"• Delivered By: {opportunity.accepted_rider_name}\n"
                f"• Delivered At: {opportunity.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"• Order Value: ₦{order.total}\n\n"
                f"✅ CONFIRM YOUR ORDER RECEIPT:\n"
                f"Please click the link below to confirm you have received your order:\n\n"
                f"{customer_confirmation_link}\n\n"
                f"This helps us ensure delivery quality and protects both you and our riders.\n\n"
                f"Thank you for choosing Stumart!\n\n"
                f"Best regards,\n"
                f"Stumart Team"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                fail_silently=False
            )
            
            logger.info(f"Sent delivery completion notification to customer for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to notify customer about delivery completion: {str(e)}", exc_info=True)
    
    def notify_admin_delivery_completed(self, order, opportunity):
        """Notify admin about delivery completion"""
        try:
            admin_emails = [settings.DEFAULT_FROM_EMAIL]
            
            subject = f"Delivery Completed - Order #{order.order_number}"
            
            message = (
                f"A delivery has been completed:\n\n"
                f"ORDER INFO:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Customer: {order.first_name} {order.last_name}\n"
                f"• Address: {order.address}\n"
                f"• Total: ₦{order.total}\n\n"
                f"DELIVERY INFO:\n"
                f"• Rider: {opportunity.accepted_rider_name}\n"
                f"• Phone: {opportunity.accepted_rider_phone}\n"
                f"• Delivered At: {opportunity.delivered_at.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"• Confirmation Code: {opportunity.delivery_confirmation_code}\n\n"
                f"Status: Order marked as DELIVERED"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True
            )
            
            logger.info(f"Sent delivery completion notification to admin for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to notify admin about delivery completion: {str(e)}", exc_info=True)


class CustomerConfirmationView(APIView):
    permission_classes = []  # Allow anonymous access for customer confirmation
    
    def post(self, request):
        try:
            customer_confirmation_code = request.data.get('customer_confirmation_code')
            
            if not customer_confirmation_code:
                return Response({
                    'error': 'Customer confirmation code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                try:
                    # Get the delivery opportunity with the customer confirmation code
                    opportunity = DeliveryOpportunity.objects.select_for_update().get(
                        customer_confirmation_code=customer_confirmation_code
                    )
                except DeliveryOpportunity.DoesNotExist:
                    return Response({
                        'error': 'Invalid customer confirmation code'
                    }, status=status.HTTP_404_NOT_FOUND)
                
                # Check if opportunity is in completed state (delivery was confirmed by rider)
                if opportunity.status != 'completed':
                    return Response({
                        'error': 'This delivery has not been confirmed yet by the rider',
                        'message': f'Current status: {opportunity.status}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                order = opportunity.order
                
                # Check if order is already completed
                if order.order_status == 'COMPLETED':
                    return Response({
                        'error': 'This order has already been confirmed by customer',
                        'message': 'Order is already in completed status'
                    }, status=status.HTTP_409_CONFLICT)
                
                # Update order status to COMPLETED
                order.order_status = 'COMPLETED'
                order.confirm = True  # Set customer confirmation flag
                order.save()
                
                # Handle payment distribution based on picker type
                payment_details = self.process_payment_distribution(order, opportunity)
                
                # Send notifications after transaction commits
                transaction.on_commit(lambda: self.send_customer_confirmation_notifications(
                    order, opportunity, payment_details
                ))
                
                return Response({
                    'success': True,
                    'message': 'Order confirmed successfully by customer',
                    'order_number': order.order_number,
                    'confirmed_at': timezone.now(),
                    'payment_details': payment_details
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error in CustomerConfirmationView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing your confirmation. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request, customer_confirmation_code=None):
        """Get order details for customer confirmation"""
        try:
            if not customer_confirmation_code:
                return Response({
                    'error': 'Customer confirmation code is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                opportunity = DeliveryOpportunity.objects.get(
                    customer_confirmation_code=customer_confirmation_code
                )
            except DeliveryOpportunity.DoesNotExist:
                return Response({
                    'error': 'Invalid customer confirmation code'
                }, status=status.HTTP_404_NOT_FOUND)
            
            order = opportunity.order
            
            return Response({
                'customer_confirmation_code': customer_confirmation_code,
                'can_confirm': (opportunity.status == 'completed' and 
                              order.order_status == 'DELIVERED' and 
                              not order.confirm),
                'opportunity_status': opportunity.status,
                'order_status': order.order_status,
                'already_confirmed': order.confirm,
                'delivered_at': opportunity.delivered_at if hasattr(opportunity, 'delivered_at') else None,
                'order': {
                    'order_number': order.order_number,
                    'customer_name': f"{order.first_name} {order.last_name}",
                    'customer_phone': order.phone,
                    'delivery_address': order.address,
                    'room_number': order.room_number or 'Not specified',
                    'total_amount': float(order.total),
                    'shipping_fee': float(order.shipping_fee),
                    'created_at': order.created_at
                },
                'rider_info': {
                    'name': opportunity.accepted_rider_name,
                    'phone': opportunity.accepted_rider_phone,
                    'pickup_time': opportunity.pickup_time,
                    'accepted_at': opportunity.accepted_at
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting customer confirmation details: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while fetching confirmation details'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def process_payment_distribution(self, order, opportunity):
        """Process payment distribution based on picker type"""
        payment_details = {
            'picker_payment': 0,
            'company_earnings': 0,
            'rider_earnings': 0,
            'picker_type': None,
            'vendor_payments': {},
            'stumart_earnings': 0
        }
        
        try:
            shipping_fee = Decimal(str(order.shipping_fee))
            tax_amount = Decimal(str(order.tax))
            company_commission = Decimal('100.00')  # ₦100 commission for company
            
            # Update Stumart wallet with tax and commission
            stumart_earnings = tax_amount
            
            # Handle Company Rider
            if opportunity.picker_type == 'company_rider' and opportunity.company_rider:
                company_rider = opportunity.company_rider
                company = company_rider.company
                
                # Calculate earnings (shipping fee minus company commission)
                rider_earnings = shipping_fee - company_commission
                
                # Update company rider earnings
                company_rider.total_earnings = (company_rider.total_earnings or Decimal('0')) + rider_earnings
                company_rider.completed_deliveries += 1
                company_rider.save()
                
                # Update company wallet
                company_wallet, created = CompanyWallet.objects.get_or_create(
                    company=company,
                    defaults={'balance': Decimal('0')}
                )
                company_wallet.balance += rider_earnings  # Company gets the rider earnings
                company_wallet.save()
                
                # Add commission to Stumart earnings
                stumart_earnings += company_commission
                
                payment_details.update({
                    'picker_type': 'company_rider',
                    'rider_earnings': float(rider_earnings),
                    'company_earnings': float(rider_earnings),
                    'company_commission': float(company_commission)
                })
                
                logger.info(f"Company rider {company_rider.name} earned ₦{rider_earnings}, Company wallet updated")
            
            # Handle Regular Picker or Student Picker
            elif opportunity.user_picker:
                picker = opportunity.user_picker
                
                # Update picker wallet
                if picker.user_type == 'picker':
                    picker_wallet, created = PickerWalletAccount.objects.get_or_create(
                        picker=picker.picker_profile,
                        defaults={'amount': Decimal('0')}
                    )
                    picker_wallet.amount += shipping_fee
                    picker_wallet.save()
                    
                    # Update picker stats
                    picker.picker_profile.total_deliveries += 1
                    picker.picker_profile.save()
                    
                elif picker.user_type == 'student_picker':
                    picker_wallet, created = StudentPickerWalletAccount.objects.get_or_create(
                        student_picker=picker.student_picker_profile,
                        defaults={'amount': Decimal('0')}
                    )
                    picker_wallet.amount += shipping_fee
                    picker_wallet.save()
                    
                    # Update student picker stats
                    picker.student_picker_profile.total_deliveries += 1
                    picker.student_picker_profile.save()
                
                payment_details.update({
                    'picker_type': picker.user_type,
                    'picker_payment': float(shipping_fee)
                })
                
                logger.info(f"Picker {picker.email} earned ₦{shipping_fee}")
            
            # Update Stumart platform wallet
            stumart_wallet = StumartWalletAccount.get_instance()
            if opportunity.picker_type == 'company_rider':
                # For company riders, add both tax and commission
                stumart_wallet.add_tax(tax_amount)
                stumart_wallet.add_commission(company_commission)
                # stumart_wallet.save()
                
                # Create transaction records
                WalletTransactionAccount.objects.create(
                    transaction_type='tax',
                    amount=tax_amount,
                    order=order,
                    stumart_wallet=stumart_wallet,
                    description=f"Tax collected from order #{order.order_number}"
                )
                
                WalletTransactionAccount.objects.create(
                    transaction_type='commission',
                    amount=company_commission,
                    order=order,
                    stumart_wallet=stumart_wallet,
                    description=f"Commission from company rider delivery - order #{order.order_number}"
                )
            else:
                # For regular/student pickers, only add tax
                stumart_wallet.add_tax(tax_amount)
                # stumart_wallet.save()
                
                WalletTransactionAccount.objects.create(
                    transaction_type='tax',
                    amount=tax_amount,
                    order=order,
                    stumart_wallet=stumart_wallet,
                    description=f"Tax collected from order #{order.order_number}"
                )
            
            payment_details['stumart_earnings'] = float(stumart_earnings)
            
            logger.info(f"Stumart platform earned ₦{stumart_earnings} (Tax: ₦{tax_amount}, Commission: ₦{company_commission if opportunity.picker_type == 'company_rider' else 0})")
            
            # Calculate and distribute vendor payments
            vendor_payments = self.calculate_vendor_payments(order)
            payment_details['vendor_payments'] = vendor_payments
            
            return payment_details
            
        except Exception as e:
            logger.error(f"Error processing payment distribution: {str(e)}", exc_info=True)
            raise
    
    def calculate_vendor_payments(self, order):
        """Calculate and distribute payments to vendors"""
        vendor_totals = {}
        
        try:
            # Get all order items
            order_items = order.order_items.all()
            
            for item in order_items:
                vendor_id = item.vendor.id
                item_total = Decimal(str(item.quantity)) * Decimal(str(item.price))
                
                if vendor_id in vendor_totals:
                    vendor_totals[vendor_id] += item_total
                else:
                    vendor_totals[vendor_id] = item_total
            
            # Update vendor wallets
            for vendor_id, amount in vendor_totals.items():
                try:
                    vendor = Vendor.objects.get(id=vendor_id)
                    wallet, created = VendorWallets.objects.get_or_create(
                        vendor=vendor,
                        defaults={'balance': Decimal('0')}
                    )
                    wallet.balance += amount
                    wallet.save()
                    
                    logger.info(f"Updated wallet for vendor {vendor_id}, credited: ₦{amount}")
                    
                    # Send vendor notification email
                    self.notify_vendor_payment(vendor, order, amount, wallet.balance)
                    
                except Vendor.DoesNotExist:
                    logger.error(f"Vendor with ID {vendor_id} not found")
                    continue
                except Exception as e:
                    logger.error(f"Error updating vendor {vendor_id} wallet: {str(e)}")
                    continue
            
            return {str(k): float(v) for k, v in vendor_totals.items()}
            
        except Exception as e:
            logger.error(f"Error calculating vendor payments: {str(e)}")
            return {}
    
    def notify_vendor_payment(self, vendor, order, amount, new_balance):
        """Send payment notification to vendor"""
        try:
            subject = f"Payment Received - Order #{order.order_number}"
            
            message = (
                f"Dear {vendor.business_name},\n\n"
                f"Great news! Payment for Order #{order.order_number} has been processed.\n\n"
                f"💰 PAYMENT DETAILS:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Amount Credited: ₦{amount}\n"
                f"• New Wallet Balance: ₦{new_balance}\n"
                f"• Payment Date: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"The payment has been credited to your wallet and is ready for withdrawal.\n\n"
                f"Thank you for your business!\n\n"
                f"Best regards,\n"
                f"Stumart Team"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[vendor.user.email],
                fail_silently=True
            )
            
            logger.info(f"Payment notification sent to vendor {vendor.id}")
            
        except Exception as e:
            logger.error(f"Failed to send payment notification to vendor {vendor.id}: {str(e)}")
    
    def send_customer_confirmation_notifications(self, order, opportunity, payment_details):
        """Send notifications about customer confirmation"""
        try:
            # Notify customer about successful confirmation
            self.notify_customer_confirmation_success(order, opportunity)
            
            # Notify admin about order completion
            self.notify_admin_order_completed(order, opportunity, payment_details)
            
            # Notify picker about payment
            self.notify_picker_payment(order, opportunity, payment_details)
            
        except Exception as e:
            logger.error(f"Error sending customer confirmation notifications: {str(e)}", exc_info=True)
    
    def notify_customer_confirmation_success(self, order, opportunity):
        """Thank customer for confirming order receipt"""
        try:
            subject = f"Thank You for Confirming Order #{order.order_number}"
            
            message = (
                f"Hello {order.first_name},\n\n"
                f"Thank you for confirming the receipt of your order #{order.order_number}!\n\n"
                f"📦 ORDER SUMMARY:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Total Amount: ₦{order.total}\n"
                f"• Delivered To: {order.address}\n"
                f"• Delivered By: {opportunity.accepted_rider_name}\n"
                f"• Confirmed At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"Your confirmation helps us maintain quality service and ensures our delivery partners are compensated fairly.\n\n"
                f"We hope you enjoyed your order! Please don't hesitate to shop with us again.\n\n"
                f"⭐ RATE YOUR EXPERIENCE:\n"
                f"We'd love to hear about your experience. Consider leaving a review for the vendors and delivery partner.\n\n"
                f"Thank you for choosing Stumart!\n\n"
                f"Best regards,\n"
                f"Stumart Team"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.email],
                fail_silently=True
            )
            
            logger.info(f"Customer confirmation thank you email sent for order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to send customer confirmation email: {str(e)}")
    
    def notify_admin_order_completed(self, order, opportunity, payment_details):
        """Notify admin about order completion"""
        try:
            admin_emails = [settings.DEFAULT_FROM_EMAIL]
            
            subject = f"Order Completed - #{order.order_number}"
            
            message = (
                f"An order has been completed and confirmed by the customer:\n\n"
                f"ORDER INFO:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Customer: {order.first_name} {order.last_name}\n"
                f"• Email: {order.email}\n"
                f"• Phone: {order.phone}\n"
                f"• Address: {order.address}\n"
                f"• Total: ₦{order.total}\n\n"
                f"DELIVERY INFO:\n"
                f"• Rider: {opportunity.accepted_rider_name}\n"
                f"• Phone: {opportunity.accepted_rider_phone}\n"
                f"• Picker Type: {payment_details.get('picker_type', 'Unknown')}\n"
                f"• Delivered At: {getattr(opportunity, 'delivered_at', 'N/A')}\n"
                f"• Confirmed At: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                f"PAYMENT DISTRIBUTION:\n"
                f"• Picker Payment: ₦{payment_details.get('picker_payment', 0)}\n"
                f"• Rider Earnings: ₦{payment_details.get('rider_earnings', 0)}\n"
                f"• Company Earnings: ₦{payment_details.get('company_earnings', 0)}\n"
                f"• Stumart Earnings: ₦{payment_details.get('stumart_earnings', 0)}\n"
                f"• Vendor Payments: {payment_details.get('vendor_payments', {})}\n\n"
                f"Status: Order marked as COMPLETED"
            )
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True
            )
            
            logger.info(f"Admin notification sent for completed order {order.order_number}")
            
        except Exception as e:
            logger.error(f"Failed to send admin notification: {str(e)}")
    
    def notify_picker_payment(self, order, opportunity, payment_details):
        """Notify picker about payment"""
        try:
            if opportunity.picker_type == 'company_rider':
                # For company riders, we might not have direct email access
                # This would be handled by the company's internal system
                logger.info(f"Company rider payment notification handled internally")
                return
            
            if opportunity.user_picker:
                picker_email = opportunity.user_picker.email
                picker_name = f"{opportunity.user_picker.first_name} {opportunity.user_picker.last_name}"
                payment_amount = payment_details.get('picker_payment', 0)
                
                subject = f"Payment Received - Delivery #{order.order_number}"
                
                message = (
                    f"Hello {picker_name},\n\n"
                    f"Congratulations! Payment for your delivery has been processed.\n\n"
                    f"💰 PAYMENT DETAILS:\n"
                    f"• Order Number: {order.order_number}\n"
                    f"• Delivery Fee: ₦{payment_amount}\n"
                    f"• Customer: {order.first_name} {order.last_name}\n"
                    f"• Delivery Address: {order.address}\n"
                    f"• Payment Date: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                    f"The payment has been credited to your wallet.\n\n"
                    f"Thank you for your excellent delivery service!\n\n"
                    f"Best regards,\n"
                    f"Stumart Team"
                )
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[picker_email],
                    fail_silently=True
                )
                
                logger.info(f"Payment notification sent to picker {picker_email}")
                
        except Exception as e:
            logger.error(f"Failed to send picker payment notification: {str(e)}")