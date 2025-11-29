
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from payment.models import WithdrawalRequest
from payment.views import PaystackTransferService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Retry failed automated payouts'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Retry failed payouts from the last N hours (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be retried without actually retrying'
        )
    
    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        # Get failed automated payouts
        failed_payouts = WithdrawalRequest.objects.filter(
            is_automated=True,
            status='failed',
            created_at__gte=cutoff_time
        ).select_related('user', 'related_order')
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nFound {failed_payouts.count()} failed automated payouts from the last {hours} hours\n"
            )
        )
        
        if dry_run:
            for payout in failed_payouts:
                self.stdout.write(
                    f"Would retry: {payout.user.email} - ₦{payout.amount} - "
                    f"Order #{payout.related_order.order_number if payout.related_order else 'N/A'}"
                )
            return
        
        # Retry failed payouts
        paystack = PaystackTransferService()
        success_count = 0
        still_failed_count = 0
        
        for payout in failed_payouts:
            try:
                self.stdout.write(f"\nRetrying payout for {payout.user.email}...")
                
                # Re-initiate transfer
                transfer_result = paystack.initiate_transfer(
                    amount=payout.amount,
                    recipient_code=payout.paystack_recipient_code,
                    reason=f"Retry: {payout.notes or 'Automated payout'}"
                )
                
                if transfer_result['success']:
                    payout.status = 'processing'
                    payout.paystack_transfer_code = transfer_result['transfer_code']
                    payout.paystack_reference = transfer_result['reference']
                    payout.processed_at = timezone.now()
                    payout.notes = (payout.notes or '') + f"\n[Retried at {timezone.now()}]"
                    payout.save()
                    
                    success_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ Successfully retried - New reference: {transfer_result['reference']}"
                        )
                    )
                else:
                    still_failed_count += 1
                    payout.failure_reason = transfer_result['message']
                    payout.notes = (payout.notes or '') + f"\n[Retry failed at {timezone.now()}: {transfer_result['message']}]"
                    payout.save()
                    
                    self.stdout.write(
                        self.style.ERROR(
                            f"✗ Retry failed: {transfer_result['message']}"
                        )
                    )
            
            except Exception as e:
                still_failed_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Error retrying payout: {str(e)}"
                    )
                )
                logger.error(f"Error retrying payout {payout.id}: {str(e)}", exc_info=True)
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Successfully retried: {success_count}"
            )
        )
        self.stdout.write(
            self.style.ERROR(
                f"✗ Still failed: {still_failed_count}"
            )
        )
        self.stdout.write("="*50 + "\n")