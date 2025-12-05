"""
Management command to register transfer recipients
Place this file in: User/management/commands/register_recipients.py
"""

from django.core.management.base import BaseCommand
from User.paystack_register import register_existing_recipients
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Register all vendors and pickers as Paystack transfer recipients'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without making actual API calls',
        )
        parser.add_argument(
            '--vendors-only',
            action='store_true',
            help='Only process vendors',
        )
        parser.add_argument(
            '--pickers-only',
            action='store_true',
            help='Only process pickers',
        )
        parser.add_argument(
            '--no-skip-verification',
            action='store_true',
            help='Verify accounts before creating recipients (uses API calls)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting recipient registration...'))
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No API calls will be made'))
            # Add dry run logic here if needed
            return
        
        try:
            skip_verification = not options['no_skip_verification']
            
            if skip_verification:
                self.stdout.write(self.style.WARNING('Running in SKIP VERIFICATION mode (recommended for bulk operations)'))
            else:
                self.stdout.write(self.style.WARNING('Running with VERIFICATION enabled'))
            
            results = register_existing_recipients(skip_verification=skip_verification)
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*50))
            self.stdout.write(self.style.SUCCESS('REGISTRATION COMPLETE'))
            self.stdout.write(self.style.SUCCESS('='*50))
            
            # Display results
            self.stdout.write(self.style.SUCCESS(f"\nVendors:"))
            self.stdout.write(f"  ✓ Success: {results['vendors']['success']}")
            self.stdout.write(f"  ✗ Failed: {results['vendors']['failed']}")
            self.stdout.write(f"  ⊘ Skipped: {results['vendors']['skipped']}")
            
            self.stdout.write(self.style.SUCCESS(f"\nPickers:"))
            self.stdout.write(f"  ✓ Success: {results['pickers']['success']}")
            self.stdout.write(f"  ✗ Failed: {results['pickers']['failed']}")
            self.stdout.write(f"  ⊘ Skipped: {results['pickers']['skipped']}")
            
            self.stdout.write(self.style.SUCCESS(f"\nStudent Pickers:"))
            self.stdout.write(f"  ✓ Success: {results['student_pickers']['success']}")
            self.stdout.write(f"  ✗ Failed: {results['student_pickers']['failed']}")
            self.stdout.write(f"  ⊘ Skipped: {results['student_pickers']['skipped']}")
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*50))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            logger.exception("Error registering recipients")
            raise