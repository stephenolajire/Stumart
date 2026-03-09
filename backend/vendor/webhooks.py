import hashlib
import hmac
import json
import logging
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.utils import timezone
from .models import Withdrawal

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(View):
    """Handle Paystack webhook events"""
    
    def post(self, request):
        """Process incoming webhook from Paystack"""
        
        # Verify webhook signature
        if not self._verify_webhook_signature(request):
            logger.warning("Invalid webhook signature")
            return HttpResponseBadRequest("Invalid signature")
        
        try:
            payload = json.loads(request.body)
            event_type = payload.get('event')
            
            if event_type == 'transfer.success':
                self._handle_transfer_success(payload['data'])
            elif event_type == 'transfer.failed':
                self._handle_transfer_failed(payload['data'])
            elif event_type == 'transfer.reversed':
                self._handle_transfer_reversed(payload['data'])
            else:
                logger.info(f"Unhandled webhook event: {event_type}")
            
            return HttpResponse("OK")
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON in webhook payload")
            return HttpResponseBadRequest("Invalid JSON")
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}")
            return HttpResponseBadRequest("Processing error")
    
    def _verify_webhook_signature(self, request):
        """Verify that the webhook is from Paystack"""
        
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
        
        if not signature:
            return False
        
        # Compute the expected signature
        expected_signature = hmac.new(
            settings.PAYSTACK_WEBHOOK_SECRET.encode(),
            request.body,
            hashlib.sha512
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature, expected_signature)
    
    def _handle_transfer_success(self, data):
        """Handle successful transfer"""
        
        try:
            transfer_code = data.get('transfer_code')
            reference = data.get('reference')
            
            # Find the withdrawal record
            withdrawal = Withdrawal.objects.get(
                payment_reference=transfer_code
            )
            
            withdrawal.status = "COMPLETED"
            withdrawal.processed_at = timezone.now()
            withdrawal.notes = f"Transfer completed successfully. Reference: {reference}"
            withdrawal.save()
            
            logger.info(f"Transfer completed: {withdrawal.reference}")
            
            # Optional: Send notification to vendor
            # self._notify_vendor(withdrawal, 'success')
            
        except Withdrawal.DoesNotExist:
            logger.error(f"Withdrawal not found for transfer_code: {transfer_code}")
        except Exception as e:
            logger.error(f"Error processing transfer success: {str(e)}")
    
    def _handle_transfer_failed(self, data):
        """Handle failed transfer"""
        
        try:
            transfer_code = data.get('transfer_code')
            failure_reason = data.get('failure_reason', 'Unknown reason')
            
            # Find the withdrawal record
            withdrawal = Withdrawal.objects.get(
                payment_reference=transfer_code
            )
            
            # Refund the amount to wallet
            wallet = withdrawal.vendor.wallet
            wallet.balance += withdrawal.amount
            wallet.save()
            
            withdrawal.status = "FAILED"
            withdrawal.processed_at = timezone.now()
            withdrawal.notes = f"Transfer failed: {failure_reason}"
            withdrawal.save()
            
            logger.warning(f"Transfer failed: {withdrawal.reference} - {failure_reason}")
            
            # Optional: Send notification to vendor
            # self._notify_vendor(withdrawal, 'failed')
            
        except Withdrawal.DoesNotExist:
            logger.error(f"Withdrawal not found for transfer_code: {transfer_code}")
        except Exception as e:
            logger.error(f"Error processing transfer failure: {str(e)}")
    
    def _handle_transfer_reversed(self, data):
        """Handle reversed transfer"""
        
        try:
            transfer_code = data.get('transfer_code')
            
            # Find the withdrawal record
            withdrawal = Withdrawal.objects.get(
                payment_reference=transfer_code
            )
            
            # Refund the amount to wallet
            wallet = withdrawal.vendor.wallet
            wallet.balance += withdrawal.amount
            wallet.save()
            
            withdrawal.status = "REVERSED"
            withdrawal.processed_at = timezone.now()
            withdrawal.notes = "Transfer was reversed"
            withdrawal.save()
            
            logger.info(f"Transfer reversed: {withdrawal.reference}")
            
            # Optional: Send notification to vendor
            # self._notify_vendor(withdrawal, 'reversed')
            
        except Withdrawal.DoesNotExist:
            logger.error(f"Withdrawal not found for transfer_code: {transfer_code}")
        except Exception as e:
            logger.error(f"Error processing transfer reversal: {str(e)}")