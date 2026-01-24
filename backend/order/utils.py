from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.timezone import now
from io import BytesIO
from weasyprint import HTML
import logging
logger = logging.getLogger(__name__)


def send_admin_notifications(order, order_items):  # Remove 'self'
    """Send order notification emails to all admins"""
    try:
        # Get admin emails from settings
        admin_emails = getattr(settings, 'ADMIN_EMAILS', [])
        
        if not admin_emails:
            logger.warning("No admin emails configured in settings")
            return
        
        # Calculate item totals
        for item in order_items:
            item_price = item.price if item.price is not None else 0
            item.total = item_price * item.quantity
        
        # Prepare context for admin template
        context = {
            "order": order,
            "order_items": order_items,
            "current_year": now().year,
        }
        
        # Render HTML template
        html_content = render_to_string("email/admin_order_notification.html", context)
        
        # Generate PDF
        pdf_buffer = BytesIO()
        HTML(string=html_content).write_pdf(pdf_buffer)
        pdf_buffer.seek(0)
        
        # Send email to each admin
        for admin_email in admin_emails:
            try:
                email_subject = f"New Order Received - #{order.order_number}"
                email = EmailMultiAlternatives(
                    subject=email_subject,
                    body=f"A new order #{order.order_number} has been placed. Details are attached.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[admin_email],
                )
                email.attach_alternative(html_content, "text/html")
                email.attach(
                    f"admin_order_{order.order_number}.pdf",
                    pdf_buffer.getvalue(),
                    "application/pdf"
                )
                email.send()
                
                logger.info(f"Admin notification sent to {admin_email} for order {order.order_number}")
                
                # Reset buffer position for next email
                pdf_buffer.seek(0)
                
            except Exception as e:
                logger.error(f"Failed to send admin notification to {admin_email}: {str(e)}")
                continue
        
        logger.info(f"Completed sending admin notifications for order {order.order_number}")
        
    except Exception as e:
        logger.error(f"Error in send_admin_notifications: {str(e)}", exc_info=True)
        raise