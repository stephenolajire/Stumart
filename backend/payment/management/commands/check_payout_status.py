from django.core.management.base import BaseCommand
from django.utils import timezone
from payment.models import WithdrawalRequest
from payment.views import PaystackTransferService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Check status of processing automated payouts'
    
    def handle(self, *args, **options):
        # Get processing automated payouts
        processing_payouts = WithdrawalRequest.objects.filter(
            is_automated=True,
            status='processing'
        ).select_related('user', 'related_order')
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nChecking {processing_payouts.count()} processing automated payouts\n"
            )
        )
        
        paystack = PaystackTransferService()
        completed_count = 0
        failed_count = 0
        still_processing_count = 0
        
        for payout in processing_payouts:
            try:
                self.stdout.write(f"\nChecking: {payout.user.email} - {payout.paystack_reference}")
                
                # Verify transfer status
                verification_result = paystack.verify_transfer(payout.paystack_reference)
                
                if verification_result['success']:
                    paystack_status = verification_result['status']
                    
                    if paystack_status == 'success':
                        payout.status = 'completed'
                        payout.completed_at = timezone.now()
                        payout.save()
                        completed_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"✓ Completed - ₦{verification_result['amount']}"
                            )
                        )
                    
                    elif paystack_status == 'failed':
                        payout.status = 'failed'
                        payout.failure_reason = verification_result.get('reason', 'Transfer failed')
                        payout.save()
                        failed_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"✗ Failed - {payout.failure_reason}"
                            )
                        )
                    
                    else:
                        still_processing_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"⏳ Still processing - Status: {paystack_status}"
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.ERROR(
                            f"✗ Verification failed: {verification_result['message']}"
                        )
                    )
            
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Error checking payout: {str(e)}"
                    )
                )
                logger.error(f"Error checking payout {payout.id}: {str(e)}", exc_info=True)
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Completed: {completed_count}"
            )
        )
        self.stdout.write(
            self.style.ERROR(
                f"✗ Failed: {failed_count}"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"⏳ Still processing: {still_processing_count}"
            )
        )
        self.stdout.write("="*50 + "\n")