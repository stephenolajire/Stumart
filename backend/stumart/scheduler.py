# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def check_payout_status():
    """Check payout status every 30 minutes"""
    try:
        logger.info("Running payout status check...")
        call_command('check_payout_status')
        logger.info("Payout status check completed")
    except Exception as e:
        logger.error(f"Error in payout status check: {str(e)}")

def retry_failed_payouts():
    """Retry failed payouts every 4 hours"""
    try:
        logger.info("Running payout retry...")
        call_command('retry_failed_payouts')
        logger.info("Payout retry completed")
    except Exception as e:
        logger.error(f"Error in payout retry: {str(e)}")

def retry_pending_disbursements():
    """Retry disbursements for COMPLETED orders without payment transfers"""
    try:
        logger.info("Running pending disbursements retry...")
        call_command('retry_pending_disbursements')
        logger.info("Pending disbursements retry completed")
    except Exception as e:
        logger.error(f"Error in pending disbursements retry: {str(e)}")

def start():
    """Start the scheduler"""
    scheduler = BackgroundScheduler()
    
    # Check payout status every 30 minutes
    scheduler.add_job(check_payout_status, 'interval', minutes=30, id='check_payout_status')
    
    # Retry failed payouts every 1 hour
    scheduler.add_job(retry_failed_payouts, 'interval', hours=1, id='retry_failed_payouts')
    
    # Retry pending disbursements every 5 minutes (catch COMPLETED orders that weren't disbursed)
    scheduler.add_job(retry_pending_disbursements, 'interval', minutes=5, id='retry_pending_disbursements')
    
    scheduler.start()
    logger.info("Scheduler started - Automated payouts active")