# notifications_utils.py
import requests
import logging
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class TermiiNotificationService:
    """Service class for sending notifications via Termii API"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'TERMII_API_KEY', '')
        self.sender_id = getattr(settings, 'TERMII_SENDER_ID', 'Stumart')
        self.base_url = "https://api.ng.termii.com/api"
        
        if not self.api_key:
            logger.warning("TERMII_API_KEY not configured in settings")
    
    def send_sms(self, phone_number, message):
        """
        Send SMS via Termii
        
        Args:
            phone_number: Recipient phone number (e.g., "2348012345678")
            message: Message text to send
        
        Returns:
            dict: Response from Termii API
        """
        if not self.api_key:
            logger.error("Cannot send SMS: TERMII_API_KEY not configured")
            return {"status": "error", "message": "API key not configured"}
        
        # Ensure phone number is in correct format (remove + if present)
        phone_number = phone_number.replace('+', '').strip()
        
        # Ensure phone number starts with country code
        if not phone_number.startswith('234'):
            if phone_number.startswith('0'):
                phone_number = '234' + phone_number[1:]
        
        url = f"{self.base_url}/sms/send"
        
        payload = {
            "to": phone_number,
            "from": self.sender_id,
            "sms": message,
            "type": "plain",
            "channel": "generic",
            "api_key": self.api_key,
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response_data = response.json()
            
            if response.status_code == 200:
                logger.info(f"SMS sent successfully to {phone_number}")
                return {"status": "success", "data": response_data}
            else:
                logger.error(f"Failed to send SMS to {phone_number}: {response_data}")
                return {"status": "error", "message": response_data}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def send_whatsapp(self, phone_number, message):
        """
        Send WhatsApp message via Termii (if you have WhatsApp enabled)
        Note: This requires WhatsApp Business API setup with Termii
        
        Args:
            phone_number: Recipient phone number
            message: Message text to send
        """
        # WhatsApp messaging through Termii requires special setup
        # For now, fallback to SMS
        logger.info(f"WhatsApp not configured, sending SMS instead to {phone_number}")
        return self.send_sms(phone_number, message)


def format_currency(amount):
    """Format amount as Naira currency"""
    if isinstance(amount, (int, float, Decimal)):
        return f"₦{amount:,.2f}"
    return f"₦{amount}"


def send_order_notifications(order, order_items):
    """
    Send SMS/WhatsApp notifications to admin, vendor, and customer
    
    Args:
        order: Order object
        order_items: QuerySet of OrderItem objects
    """
    termii = TermiiNotificationService()
    
    # 1. Send notification to ADMINS
    send_admin_sms_notification(order, order_items, termii)
    
    # 2. Send notification to VENDORS
    send_vendor_sms_notifications(order, order_items, termii)
    
    # 3. Send notification to CUSTOMER
    send_customer_sms_notification(order, termii)


def send_admin_sms_notification(order, order_items, termii):
    """Send SMS notification to all admins"""
    try:
        # Get admin phone numbers from settings
        admin_phones = getattr(settings, 'ADMIN_PHONE_NUMBERS', [])
        
        if not admin_phones:
            logger.warning("No admin phone numbers configured in settings")
            return
        
        # Calculate total items
        total_items = sum(item.quantity for item in order_items)
        
        # Compose admin message
        message = (
            f"🎉 NEW ORDER #{order.order_number}\n"
            f"Customer: {order.first_name} {order.last_name}\n"
            f"Items: {total_items}\n"
            f"Total: {format_currency(order.total)}\n"
            f"Status: {order.order_status}\n"
            f"Check dashboard for details."
        )
        
        # Send to each admin
        for admin_phone in admin_phones:
            try:
                result = termii.send_sms(admin_phone, message)
                if result.get('status') == 'success':
                    logger.info(f"Admin SMS sent to {admin_phone} for order {order.order_number}")
                else:
                    logger.error(f"Failed to send admin SMS to {admin_phone}")
            except Exception as e:
                logger.error(f"Error sending admin SMS to {admin_phone}: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error in send_admin_sms_notification: {str(e)}", exc_info=True)


def send_vendor_sms_notifications(order, order_items, termii):
    """Send SMS notification to each vendor with items in the order"""
    try:
        # Group items by vendor
        vendor_items = {}
        
        for item in order_items:
            if hasattr(item, 'vendor') and item.vendor:
                vendor_id = item.vendor.id
                if vendor_id not in vendor_items:
                    vendor_items[vendor_id] = {
                        'vendor': item.vendor,
                        'items': [],
                        'total': Decimal('0.00')
                    }
                
                vendor_items[vendor_id]['items'].append(item)
                item_total = (item.price or Decimal('0.00')) * item.quantity
                vendor_items[vendor_id]['total'] += item_total
        
        # Send notification to each vendor
        for vendor_data in vendor_items.values():
            try:
                vendor = vendor_data['vendor']
                items = vendor_data['items']
                vendor_total = vendor_data['total']
                
                # Get vendor phone number
                vendor_phone = vendor.user.phone_number
                
                if not vendor_phone:
                    logger.warning(f"No phone number for vendor {vendor.id}")
                    continue
                
                # Compose vendor message
                item_count = sum(item.quantity for item in items)
                
                message = (
                    f"🛍️ NEW ORDER for {vendor.business_name}!\n"
                    f"Order: #{order.order_number}\n"
                    f"Items: {item_count}\n"
                    f"Amount: {format_currency(vendor_total)}\n"
                    f"Customer: {order.first_name}\n"
                    f"Login to pack items."
                )
                
                result = termii.send_sms(vendor_phone, message)
                
                if result.get('status') == 'success':
                    logger.info(f"Vendor SMS sent to {vendor.business_name} for order {order.order_number}")
                else:
                    logger.error(f"Failed to send vendor SMS to {vendor.business_name}")
                    
            except Exception as e:
                logger.error(f"Error sending vendor SMS: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"Error in send_vendor_sms_notifications: {str(e)}", exc_info=True)


def send_customer_sms_notification(order, termii):
    """Send SMS notification to customer"""
    try:
        customer_phone = order.phone
        
        if not customer_phone:
            logger.warning(f"No phone number for order {order.order_number}")
            return
        
        # Compose customer message
        message = (
            f"✅ ORDER CONFIRMED!\n"
            f"Thank you {order.first_name}!\n"
            f"Order: #{order.order_number}\n"
            f"Total: {format_currency(order.total)}\n"
            f"We'll notify you when ready for delivery.\n"
            f"- Stumart Team"
        )
        
        result = termii.send_sms(customer_phone, message)
        
        if result.get('status') == 'success':
            logger.info(f"Customer SMS sent to {customer_phone} for order {order.order_number}")
        else:
            logger.error(f"Failed to send customer SMS to {customer_phone}")
            
    except Exception as e:
        logger.error(f"Error in send_customer_sms_notification: {str(e)}", exc_info=True)


# Additional helper functions for other notifications

def send_order_packed_notification(order):
    """Notify customer when order is packed and ready"""
    termii = TermiiNotificationService()
    
    message = (
        f"📦 ORDER READY!\n"
        f"Order #{order.order_number} is packed.\n"
        f"A picker will deliver soon.\n"
        f"Total: {format_currency(order.total)}\n"
        f"- Stumart Team"
    )
    
    termii.send_sms(order.phone, message)


def send_order_picked_notification(order, picker_name):
    """Notify customer when picker accepts the order"""
    termii = TermiiNotificationService()
    
    message = (
        f"🚴 OUT FOR DELIVERY!\n"
        f"Order #{order.order_number}\n"
        f"Picker: {picker_name}\n"
        f"Arriving soon at {order.address}\n"
        f"- Stumart Team"
    )
    
    termii.send_sms(order.phone, message)


def send_order_delivered_notification(order):
    """Notify customer and admin when order is delivered"""
    termii = TermiiNotificationService()
    
    # Customer notification
    customer_message = (
        f"✅ DELIVERED!\n"
        f"Order #{order.order_number} delivered.\n"
        f"Thank you for shopping with Stumart!\n"
        f"Please rate your experience."
    )
    termii.send_sms(order.phone, customer_message)
    
    # Admin notification
    admin_phones = getattr(settings, 'ADMIN_PHONE_NUMBERS', [])
    admin_message = (
        f"✅ Order #{order.order_number} delivered\n"
        f"Customer: {order.first_name} {order.last_name}\n"
        f"Amount: {format_currency(order.total)}"
    )
    
    for admin_phone in admin_phones:
        termii.send_sms(admin_phone, admin_message)