from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q, Count
from datetime import timedelta
from stumart.models import Order
from wallet.models import WalletTransactionAccount, DeliveryOpportunity
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Detect COMPLETED orders without disbursements and retry payment processing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Check orders completed in the last N hours (default: 24)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be retried without actually retrying'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Check all COMPLETED orders regardless of age'
        )
    
    def handle(self, *args, **options):
        hours = options['hours']
        dry_run = options['dry_run']
        check_all = options['all']
        
        # Get current time
        now = timezone.now()
        next_run = now + timedelta(minutes=15)
        
        # Calculate cutoff time
        if check_all:
            cutoff_time = timezone.datetime.min
        else:
            cutoff_time = now - timedelta(hours=hours)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n{'='*70}\n"
                f"⏱️  LAST RUN: {now.strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"⏱️  NEXT RUN: {next_run.strftime('%Y-%m-%d %H:%M:%S')} (in ~15 minutes)\n"
                f"{'='*70}\n\n"
            )
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Scanning for COMPLETED orders without disbursements...\n"
            )
        )
        
        # Find COMPLETED orders
        completed_orders = Order.objects.filter(
            order_status='COMPLETED',
            created_at__gte=cutoff_time,
            confirm=True  # Only check orders confirmed by customer
        ).select_related('user').prefetch_related('order_items', 'wallet_transactions')
        
        # Filter orders that don't have vendor_payment, delivery_payment, or rider_earnings transactions
        orders_without_disbursement = []
        
        for order in completed_orders:
            # Check if this order has any disbursement transactions
            has_disbursement = order.wallet_transactions.filter(
                transaction_type__in=['vendor_payment', 'delivery_payment', 'rider_earnings', 'company_earnings']
            ).exists()
            
            if not has_disbursement:
                orders_without_disbursement.append(order)
        
        self.stdout.write(
            self.style.WARNING(
                f"Found {len(orders_without_disbursement)} orders without disbursements\n"
            )
        )
        
        if not orders_without_disbursement:
            self.stdout.write(
                self.style.SUCCESS(
                    "✓ All COMPLETED orders have disbursement records\n"
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n{'='*70}\n"
                    f"✅ Check completed at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"   Next check at: {(timezone.now() + timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"{'='*70}\n"
                )
            )
            return
        
        # Display orders to be processed
        for order in orders_without_disbursement:
            self.stdout.write(
                f"\n📦 Order: {order.order_number} | "
                f"Amount: ₦{order.total} | "
                f"Vendors: {order.order_items.values('vendor').distinct().count()} | "
                f"Completed: {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
            )
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[DRY RUN] Would process {len(orders_without_disbursement)} orders\n"
                )
            )
            return
        
        # Import here to avoid circular imports
        from order.views import CustomerConfirmationView
        
        # Retry disbursement for each order
        success_count = 0
        failed_count = 0
        
        for order in orders_without_disbursement:
            try:
                self.stdout.write(f"\nProcessing disbursement for {order.order_number}...")
                
                # Get the DeliveryOpportunity for this order
                opportunity = DeliveryOpportunity.objects.filter(order=order).first()
                
                if not opportunity:
                    self.stdout.write(
                        self.style.ERROR(
                            f"✗ No delivery opportunity found for order {order.order_number}"
                        )
                    )
                    failed_count += 1
                    continue
                
                # Re-run the automated transfer process
                confirmation_view = CustomerConfirmationView()
                transfer_results = confirmation_view.process_automated_transfers(order, opportunity)
                
                # Check if transfers were successful
                vendor_success = sum(
                    1 for v in transfer_results.get('vendor_transfers', [])
                    if v.get('success')
                )
                picker_success = transfer_results.get('picker_transfer', {}).get('success', False)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Disbursement processed: {vendor_success} vendor transfers, "
                        f"Picker: {'✓' if picker_success else '✗'}"
                    )
                )
                success_count += 1
                
            except Exception as e:
                failed_count += 1
                logger.error(f"Error processing disbursement for order {order.order_number}: {str(e)}", exc_info=True)
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Error processing {order.order_number}: {str(e)}"
                    )
                )
        
        # Summary
        self.stdout.write("\n" + "="*70)
        self.stdout.write(
            self.style.SUCCESS(
                f"✓ Successfully processed: {success_count}"
            )
        )
        self.stdout.write(
            self.style.ERROR(
                f"✗ Failed: {failed_count}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Check completed at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                f"   Next check at: {(timezone.now() + timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
        )
        self.stdout.write("="*70 + "\n")