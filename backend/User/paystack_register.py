"""
Paystack Transfers Utility
Handles transfer recipient creation and payout management
"""

import requests
import logging
from django.conf import settings
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class PaystackTransferService:
    """Service class for handling Paystack transfers"""
    
    BASE_URL = "https://api.paystack.co"
    
    # Bank name mappings for common variations
    BANK_MAPPINGS = {
        'moniepoint': 'Moniepoint MFB',
        'moniepoint microfinance bank': 'Moniepoint MFB',
        'bank of agriculture': 'BOA',
    }
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    def create_transfer_recipient(
        self, 
        account_name: str, 
        account_number: str, 
        bank_code: str,
        currency: str = "NGN",
        skip_verification: bool = False
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Create a transfer recipient on Paystack
        
        Args:
            account_name: Name on the bank account
            account_number: Bank account number
            bank_code: Paystack bank code
            currency: Currency (default: NGN)
            skip_verification: Skip account verification (for bulk operations)
        
        Returns:
            Tuple of (success, recipient_code, error_message)
        """
        url = f"{self.BASE_URL}/transferrecipient"
        
        payload = {
            "type": "nuban",
            "name": account_name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": currency
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            data = response.json()
            
            if response.status_code == 201 and data.get("status"):
                recipient_code = data["data"]["recipient_code"]
                logger.info(f"Created recipient: {recipient_code} for {account_name}")
                return True, recipient_code, None
            else:
                error_msg = data.get("message", "Unknown error")
                logger.error(f"Failed to create recipient for {account_name}: {error_msg}")
                return False, None, error_msg
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(f"Exception creating recipient for {account_name}: {error_msg}")
            return False, None, error_msg
    
    def get_bank_code(self, bank_name: str) -> Optional[str]:
        """
        Get Paystack bank code from bank name
        
        Args:
            bank_name: Name of the bank
        
        Returns:
            Bank code or None if not found
        """
        url = f"{self.BASE_URL}/bank"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get("status"):
                banks = data["data"]
                
                # Normalize bank name for comparison
                bank_name_lower = bank_name.lower().strip()
                
                # Check for mapped bank names first
                for key, mapped_name in self.BANK_MAPPINGS.items():
                    if key in bank_name_lower:
                        bank_name_lower = mapped_name.lower()
                        break
                
                for bank in banks:
                    bank_name_api = bank["name"].lower()
                    # Check for exact or partial match
                    if bank_name_lower in bank_name_api or bank_name_api in bank_name_lower:
                        logger.info(f"Matched '{bank_name}' to '{bank['name']}' (code: {bank['code']})")
                        return bank["code"]
                
                logger.warning(f"Bank not found: {bank_name}")
                return None
            else:
                logger.error(f"Failed to fetch banks: {data.get('message')}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Exception fetching banks: {str(e)}")
            return None
    
    def verify_account_number(
        self, 
        account_number: str, 
        bank_code: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Verify bank account details
        
        Args:
            account_number: Bank account number
            bank_code: Paystack bank code
        
        Returns:
            Tuple of (success, account_name, error_message)
        """
        url = f"{self.BASE_URL}/bank/resolve"
        params = {
            "account_number": account_number,
            "bank_code": bank_code
        }
        
        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get("status"):
                account_name = data["data"]["account_name"]
                logger.info(f"Verified account: {account_number} - {account_name}")
                return True, account_name, None
            else:
                error_msg = data.get("message", "Account verification failed")
                logger.error(f"Failed to verify account {account_number}: {error_msg}")
                return False, None, error_msg
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(f"Exception verifying account {account_number}: {error_msg}")
            return False, None, error_msg
    
    def initiate_transfer(
        self,
        amount: int,  # Amount in kobo
        recipient_code: str,
        reason: str = "Payout",
        reference: Optional[str] = None
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        
        url = f"{self.BASE_URL}/transfer"
        
        payload = {
            "source": "balance",
            "amount": amount,
            "recipient": recipient_code,
            "reason": reason
        }
        
        if reference:
            payload["reference"] = reference
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get("status"):
                transfer_data = data["data"]
                logger.info(f"Transfer initiated: {transfer_data.get('transfer_code')}")
                return True, transfer_data, None
            else:
                error_msg = data.get("message", "Transfer failed")
                logger.error(f"Failed to initiate transfer: {error_msg}")
                return False, None, error_msg
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(f"Exception initiating transfer: {error_msg}")
            return False, None, error_msg
    
    def verify_transfer(self, reference: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        
        url = f"{self.BASE_URL}/transfer/verify/{reference}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get("status"):
                return True, data["data"], None
            else:
                error_msg = data.get("message", "Verification failed")
                return False, None, error_msg
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            return False, None, error_msg


def register_existing_recipients(skip_verification: bool = True):
    """
    Register all existing vendors and pickers as Paystack transfer recipients
    
    Args:
        skip_verification: Skip account verification (recommended for bulk operations)
    """
    from User.models import Vendor, Picker, StudentPicker
    
    service = PaystackTransferService()
    results = {
        'vendors': {'success': 0, 'failed': 0, 'skipped': 0, 'errors': []},
        'pickers': {'success': 0, 'failed': 0, 'skipped': 0, 'errors': []},
        'student_pickers': {'success': 0, 'failed': 0, 'skipped': 0, 'errors': []}
    }
    
    # Process Vendors
    logger.info("Starting vendor registration...")
    vendors = Vendor.objects.all()
    
    for vendor in vendors:
        # Skip if already has recipient code
        if vendor.paystack_recipient_code:
            results['vendors']['skipped'] += 1
            logger.info(f"Skipped vendor {vendor.business_name} - already has recipient code")
            continue
        
        # Get bank code
        bank_code = service.get_bank_code(vendor.bank_name)
        if not bank_code:
            error_msg = f"Bank code not found: {vendor.bank_name}"
            logger.error(f"Vendor {vendor.business_name}: {error_msg}")
            results['vendors']['failed'] += 1
            results['vendors']['errors'].append({
                'name': vendor.business_name,
                'error': error_msg
            })
            continue
        
        # Create recipient directly without verification
        success, recipient_code, error = service.create_transfer_recipient(
            account_name=vendor.account_name,
            account_number=vendor.account_number,
            bank_code=bank_code,
            skip_verification=skip_verification
        )
        
        if success:
            vendor.paystack_recipient_code = recipient_code
            vendor.save()
            results['vendors']['success'] += 1
            logger.info(f"✓ Registered vendor: {vendor.business_name}")
        else:
            results['vendors']['failed'] += 1
            results['vendors']['errors'].append({
                'name': vendor.business_name,
                'error': error
            })
            logger.error(f"✗ Failed vendor {vendor.business_name}: {error}")
    
    # Process Pickers
    logger.info("Starting picker registration...")
    pickers = Picker.objects.all()
    
    for picker in pickers:
        if hasattr(picker, 'paystack_recipient_code') and picker.paystack_recipient_code:
            results['pickers']['skipped'] += 1
            continue
        
        bank_code = service.get_bank_code(picker.bank_name)
        if not bank_code:
            error_msg = f"Bank code not found: {picker.bank_name}"
            results['pickers']['failed'] += 1
            results['pickers']['errors'].append({
                'name': picker.user.email,
                'error': error_msg
            })
            continue
        
        success, recipient_code, error = service.create_transfer_recipient(
            account_name=picker.account_name,
            account_number=picker.account_number,
            bank_code=bank_code,
            skip_verification=skip_verification
        )
        
        if success:
            picker.paystack_recipient_code = recipient_code
            picker.save()
            results['pickers']['success'] += 1
            logger.info(f"✓ Registered picker: {picker.user.email}")
        else:
            results['pickers']['failed'] += 1
            results['pickers']['errors'].append({
                'name': picker.user.email,
                'error': error
            })
    
    # Process Student Pickers
    logger.info("Starting student picker registration...")
    student_pickers = StudentPicker.objects.all()
    
    for student_picker in student_pickers:
        if hasattr(student_picker, 'paystack_recipient_code') and student_picker.paystack_recipient_code:
            results['student_pickers']['skipped'] += 1
            continue
        
        bank_code = service.get_bank_code(student_picker.bank_name)
        if not bank_code:
            error_msg = f"Bank code not found: {student_picker.bank_name}"
            results['student_pickers']['failed'] += 1
            results['student_pickers']['errors'].append({
                'name': student_picker.user.email,
                'error': error_msg
            })
            continue
        
        success, recipient_code, error = service.create_transfer_recipient(
            account_name=student_picker.account_name,
            account_number=student_picker.account_number,
            bank_code=bank_code,
            skip_verification=skip_verification
        )
        
        if success:
            student_picker.paystack_recipient_code = recipient_code
            student_picker.save()
            results['student_pickers']['success'] += 1
            logger.info(f"✓ Registered student picker: {student_picker.user.email}")
        else:
            results['student_pickers']['failed'] += 1
            results['student_pickers']['errors'].append({
                'name': student_picker.user.email,
                'error': error
            })
    
    # Log summary
    logger.info("=" * 50)
    logger.info("REGISTRATION SUMMARY")
    logger.info("=" * 50)
    logger.info(f"Vendors - Success: {results['vendors']['success']}, "
                f"Failed: {results['vendors']['failed']}, "
                f"Skipped: {results['vendors']['skipped']}")
    logger.info(f"Pickers - Success: {results['pickers']['success']}, "
                f"Failed: {results['pickers']['failed']}, "
                f"Skipped: {results['pickers']['skipped']}")
    logger.info(f"Student Pickers - Success: {results['student_pickers']['success']}, "
                f"Failed: {results['student_pickers']['failed']}, "
                f"Skipped: {results['student_pickers']['skipped']}")
    
    # Log errors
    if results['vendors']['errors']:
        logger.info("\nVendor Errors:")
        for err in results['vendors']['errors'][:10]:  # Show first 10
            logger.info(f"  - {err['name']}: {err['error']}")
    
    logger.info("=" * 50)
    
    return results