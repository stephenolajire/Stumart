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
                
                # Check if current vendor has food items
                has_food_items = vendor_order_items.filter(
                    vendor__business_category='food'
                ).exists()
                
                # If vendor has food items, create separate order for immediate delivery
                if has_food_items:
                    food_response = self.handle_food_items_separation(
                        order, vendor_order_items, current_vendor
                    )
                    
                    # Continue with regular flow for non-food items
                    remaining_response = self.handle_remaining_items(
                        order, current_vendor, order_id
                    )
                    
                    # Send notifications after transaction commits
                    if food_response.get('food_order_created'):
                        food_order = food_response.get('food_order')
                        if food_order:
                            transaction.on_commit(lambda: self.send_food_order_notification(order, food_order, current_vendor))
                            transaction.on_commit(lambda: self.notify_pickers(food_order, current_vendor, is_food_order=True))
                    
                    # Handle remaining order notifications
                    if remaining_response.get('all_packed'):
                        transaction.on_commit(lambda: self.send_customer_notification(order, all_packed=True))
                        transaction.on_commit(lambda: self.notify_pickers(order, current_vendor))
                    else:
                        transaction.on_commit(lambda: self.send_customer_notification(
                            order, 
                            all_packed=False, 
                            packed_vendor=current_vendor,
                            packed_vendors=remaining_response.get('packed_vendors_obj', []),
                            unpacked_vendors=remaining_response.get('unpacked_vendors_obj', [])
                        ))
                    
                    # Combine responses (only JSON serializable data)
                    combined_response = {
                        'message': f'{current_vendor.business_name} has packed their items.',
                        'order_id': order_id,
                        'vendor_packed': current_vendor.business_name,
                        'food_order_created': food_response.get('food_order_created', False),
                        'food_order_id': food_response.get('food_order_id'),
                        'food_order_number': food_response.get('food_order_number'),
                        'remaining_order_status': {
                            'all_packed': remaining_response.get('all_packed', False),
                            'message': remaining_response.get('message', ''),
                            'packed_vendors': remaining_response.get('packed_vendors', []),
                            'unpacked_vendors': remaining_response.get('unpacked_vendors', [])
                        }
                    }
                    
                    return Response(combined_response, status=status.HTTP_200_OK)
                
                else:
                    # No food items, handle normally
                    return self.handle_regular_packing(order, current_vendor, order_id)

        except Exception as e:
            logger.error(f"Error in PackOrderView: {str(e)}", exc_info=True)
            return Response({
                'error': f'An error occurred while processing your request. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def handle_food_items_separation(self, original_order, vendor_order_items, current_vendor):
        """Handle separation of food items into a new order for immediate delivery"""
        try:
            # Get food items from this vendor
            food_items = vendor_order_items.filter(
                vendor__business_category='food'
            )
            
            if not food_items.exists():
                return {'food_order_created': False}
            
            # Calculate food order totals
            food_subtotal = sum(item.price * item.quantity for item in food_items)
            
            # Get distinct food vendors count (should be 1 in this case, but keeping it flexible)
            distinct_food_vendors = food_items.values('vendor').distinct().count()
            food_shipping_fee = Decimal('300.00') * distinct_food_vendors
            
            # For simplicity, assume same tax rate as original order
           
            food_tax = food_subtotal * Decimal('0.030')
            food_total = food_subtotal + food_shipping_fee + food_tax
            
            # Generate unique order number for food order (keep within 20 char limit)
            timestamp = timezone.now().strftime('%m%d%H%M')  # MMDDHHMM format (8 chars)
            # Take first 7 chars of original order number to ensure total stays under 20
            original_short = str(original_order.order_number)[:7]
            food_order_number = f"F{original_short}{timestamp}"  # F + 7 + 8 = 16 chars max
            
            # Create new order for food items
            food_order = Order.objects.create(
                order_number=food_order_number,
                user=original_order.user,
                first_name=original_order.first_name,
                last_name=original_order.last_name,
                email=original_order.email,
                phone=original_order.phone,
                address=original_order.address,
                room_number=original_order.room_number,
                subtotal=food_subtotal,
                shipping_fee=food_shipping_fee,
                tax=food_tax,
                total=food_total,
                order_status='PAID',
                packed=True,  # Food is already packed
                confirm=False,
                reviewed=False
            )
            
            # Create new order items for the food order
            food_order_items = []
            for food_item in food_items:
                food_order_items.append(OrderItem(
                    order=food_order,
                    product=food_item.product,
                    quantity=food_item.quantity,
                    price=food_item.price,
                    vendor=food_item.vendor,
                    size=food_item.size,
                    color=food_item.color,
                    is_packed=True,
                    packed_at=timezone.now()
                ))
            
            # Bulk create the new order items
            OrderItem.objects.bulk_create(food_order_items)
            
            # Remove food items from original order
            food_items.delete()
            
            # Update original order totals
            self.recalculate_original_order(original_order, food_shipping_fee)
            
            return {
                'food_order_created': True,
                'food_order_id': food_order.id,
                'food_order_number': food_order_number,
                'food_order': food_order  # Keep this for internal use in notifications
            }
            
        except Exception as e:
            logger.error(f"Error handling food items separation: {str(e)}", exc_info=True)
            raise  # Re-raise to rollback transaction

    def recalculate_original_order(self, original_order, food_shipping_fee_to_subtract):
        """Recalculate original order totals after removing food items"""
        try:
            # Get remaining order items
            remaining_items = OrderItem.objects.filter(order=original_order)
            
            if remaining_items.exists():
                # Recalculate subtotal
                new_subtotal = sum(item.price * item.quantity for item in remaining_items)
                
                # Recalculate shipping fee (subtract food shipping fee)
                new_shipping_fee = max(
                    Decimal('0.00'), 
                    original_order.shipping_fee - food_shipping_fee_to_subtract
                )
                
                # Recalculate tax (proportional to new subtotal)
                if original_order.subtotal > 0:
                    tax_rate = original_order.tax / original_order.subtotal
                    new_tax = new_subtotal * tax_rate
                else:
                    new_tax = Decimal('0.00')
                
                # Update original order
                original_order.subtotal = new_subtotal
                original_order.shipping_fee = new_shipping_fee
                original_order.tax = new_tax
                original_order.total = new_subtotal + new_shipping_fee + new_tax
                original_order.save()
                
            else:
                # No remaining items, mark original order as completed
                original_order.order_status = 'COMPLETED'
                original_order.save()
                
        except Exception as e:
            logger.error(f"Error recalculating original order: {str(e)}", exc_info=True)
            raise  # Re-raise to rollback transaction

    def handle_remaining_items(self, order, current_vendor, order_id):
        """Handle the remaining non-food items in the original order"""
        # Check if all remaining vendors have packed their items
        all_order_items = OrderItem.objects.filter(order_id=order_id)
        unpacked_items = all_order_items.filter(is_packed=False)
        
        all_vendors_packed = not unpacked_items.exists()
        
        if all_vendors_packed:
            order.packed = True
            order.save()
            
            return {
                'all_packed': True,
                'message': 'All remaining vendors have packed their items. Order is ready for delivery.'
            }
        else:
            # Not all vendors have packed yet
            packed_vendors = self.get_packed_vendors(order_id)
            unpacked_vendors = self.get_unpacked_vendors(order_id)
            
            return {
                'all_packed': False,
                'message': 'Waiting for other vendors to pack remaining items.',
                'packed_vendors': [v.business_name for v in packed_vendors],
                'unpacked_vendors': [v.business_name for v in unpacked_vendors],
                'packed_vendors_obj': packed_vendors,  # Keep for internal use
                'unpacked_vendors_obj': unpacked_vendors  # Keep for internal use
            }

    def handle_regular_packing(self, order, current_vendor, order_id):
        """Handle regular packing flow for non-food vendors"""
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

    def send_food_order_notification(self, original_order, food_order, food_vendor):
        """Send notification about food order separation"""
        try:
            subject = f"Food Order #{food_order.order_number} - Out for Delivery"
            message = (
                f"Hello {original_order.first_name},\n\n"
                f"Your food items from {food_vendor.business_name} have been packed and "
                f"are now being delivered separately for freshness.\n\n"
                f"Food Order Details:\n"
                f"• Order Number: {food_order.order_number}\n"
                f"• Vendor: {food_vendor.business_name}\n"
                f"• Total: ₦{food_order.total}\n\n"
                f"Your remaining items from other vendors will be delivered separately "
                f"once they are all ready.\n\n"
                f"Original Order: #{original_order.order_number}\n"
                f"Remaining Total: ₦{original_order.total}\n\n"
                f"Thank you for your patronage!"
            )

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[original_order.email],
                fail_silently=True
            )
        except Exception as e:
            logger.error(f"Failed to send food order notification: {str(e)}", exc_info=True)

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

    def notify_pickers(self, order, vendor, is_food_order=False):
        """Notify all pickers in the same institution as the vendor"""
        try:
            # Get the vendor's institution
            vendor_institution = vendor.user.institution
            logger.info(f"Vendor institution: {vendor_institution}")
            
            if not vendor_institution:
                logger.warning(f"Vendor {vendor.business_name} has no institution set")
                return
            
            # Find ALL pickers from the same institution (both regular and student pickers)
            all_pickers = User.objects.filter(
                user_type__in=['picker', 'student_picker'],  # Both types
                institution=vendor_institution,
                is_active=True
            )
            
            logger.info(f"Found {all_pickers.count()} total pickers in institution {vendor_institution}")
            
            if not all_pickers.exists():
                logger.warning(f"No pickers found in institution {vendor_institution}")
                return
            
            # Get all picker emails
            picker_emails = [picker.email for picker in all_pickers]
            
            logger.info(f"Picker emails to notify: {picker_emails}")
            
            # Get all vendors involved in this order
            order_vendors = Vendor.objects.filter(
                orderitem__order=order
            ).distinct()
            
            vendor_names = [v.business_name for v in order_vendors]
            
            # Build email content
            urgency_text = "🍽️ URGENT - FOOD DELIVERY" if is_food_order else "New Delivery Opportunity"
            subject = f"{urgency_text} - Order #{order.order_number}"
            
            urgency_message = (
                "⚡ This is a FOOD ORDER that needs immediate delivery to maintain freshness!\n\n"
                if is_food_order else ""
            )
            
            message = (
                f"Hello,\n\n"
                f"{urgency_message}"
                f"A {'food' if is_food_order else 'new'} order is ready for pickup at {vendor_institution}.\n\n"
                f"Order Details:\n"
                f"• Order Number: {order.order_number}\n"
                f"• Order Type: {'🍽️ FOOD ORDER' if is_food_order else '📦 Regular Order'}\n"
                f"• Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}\n"
                f"• Vendors: {', '.join(vendor_names)}\n"
                f"• Delivery Address: {order.address}\n"
                f"• Room Number: {order.room_number or 'Not specified'}\n"
                # f"• Total Amount: ₦{order.total}\n\n"
                f"{'⏰ Please respond quickly as food orders are time-sensitive!' if is_food_order else ''}\n"
                f"Please log in to your dashboard to accept this delivery. "
                f"This opportunity is available on a first-come, first-served basis.\n\n"
                f"Best regards,\n"
                f"Stumart Team"
            )
            
            # Send email to all pickers
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=picker_emails,
                    fail_silently=False  # Set to False to see actual errors
                )
                logger.info(f"Successfully sent email to {len(picker_emails)} pickers")
                
            except Exception as email_error:
                logger.error(f"Failed to send email: {str(email_error)}", exc_info=True)
                
        except Exception as e:
            logger.error(f"Failed to notify pickers for order {order.id}: {str(e)}", exc_info=True)