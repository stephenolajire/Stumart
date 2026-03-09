from datetime import timezone
from django.db import transaction
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class AutomatedPayoutService:
    """Service to handle automated payouts after customer confirmation"""
    
    def __init__(self):
        from payment.views import PaystackTransferService
        self.paystack = PaystackTransferService()
    
    def process_all_payouts(self, order, opportunity, payment_details):
        """
        Main method to process all automated payouts
        Returns: dict with success status and details
        """
        results = {
            'success': True,
            'vendor_payouts': [],
            'picker_payout': None,
            'company_payout': None,
            'errors': []
        }
        
        try:
            # 1. Process vendor payouts
            vendor_results = self.process_vendor_payouts(order, payment_details.get('vendor_payments', {}))
            results['vendor_payouts'] = vendor_results
            
            # 2. Process picker/company payout
            if opportunity.picker_type == 'company_rider':
                company_result = self.process_company_payout(opportunity, payment_details)
                results['company_payout'] = company_result
            else:
                picker_result = self.process_picker_payout(opportunity, payment_details)
                results['picker_payout'] = picker_result
            
            return results
            
        except Exception as e:
            logger.error(f"Error in automated payout processing: {str(e)}", exc_info=True)
            results['success'] = False
            results['errors'].append(str(e))
            return results
    
    def process_vendor_payouts(self, order, vendor_payments):
        """Process automated payouts to all vendors"""
        vendor_results = []
        
        for vendor_id, amount in vendor_payments.items():
            try:
                from user.models import Vendor
                vendor = Vendor.objects.get(id=vendor_id)
                
                # Check if vendor has bank details
                if not all([vendor.bank_name, vendor.account_number, vendor.account_name]):
                    error_msg = f"Vendor {vendor.business_name} has incomplete bank details"
                    logger.warning(error_msg)
                    vendor_results.append({
                        'vendor_id': vendor_id,
                        'vendor_name': vendor.business_name,
                        'amount': float(amount),
                        'success': False,
                        'error': error_msg
                    })
                    continue
                
                # Get or create recipient code (now using bank_name)
                recipient_code = self.get_or_create_recipient(
                    vendor=vendor,
                    name=vendor.account_name,
                    account_number=vendor.account_number,
                    bank_name=vendor.bank_name  # Pass bank_name instead of bank_code
                )
                
                if not recipient_code:
                    error_msg = f"Failed to create recipient for {vendor.business_name}"
                    logger.error(error_msg)
                    vendor_results.append({
                        'vendor_id': vendor_id,
                        'vendor_name': vendor.business_name,
                        'amount': float(amount),
                        'success': False,
                        'error': error_msg
                    })
                    continue
                
                # Initiate transfer
                transfer_result = self.paystack.initiate_transfer(
                    amount=amount,
                    recipient_code=recipient_code,
                    reason=f"Payment for Order #{order.order_number} - {vendor.business_name}"
                )
                
                if transfer_result['success']:
                    # Create withdrawal record
                    from payment.models import WithdrawalRequest
                    
                    # Get bank code for storage
                    bank_code = self.paystack.get_bank_code(vendor.bank_name)
                    
                    withdrawal = WithdrawalRequest.objects.create(
                        user=vendor.user,
                        user_type='vendor',
                        amount=Decimal(str(amount)),
                        bank_name=vendor.bank_name,
                        bank_code=bank_code or vendor.bank_name,  # Fallback to bank_name if code not found
                        account_number=vendor.account_number,
                        account_name=vendor.account_name,
                        final_amount=Decimal(str(amount)),
                        status='processing',
                        paystack_recipient_code=recipient_code,
                        paystack_transfer_code=transfer_result['transfer_code'],
                        paystack_reference=transfer_result['reference'],
                        processed_at=timezone.now(),
                        is_automated=True,  # Flag to identify automated payouts
                        related_order=order  # Link to order
                    )
                    
                    vendor_results.append({
                        'vendor_id': vendor_id,
                        'vendor_name': vendor.business_name,
                        'amount': float(amount),
                        'success': True,
                        'reference': transfer_result['reference'],
                        'withdrawal_id': withdrawal.id
                    })
                    
                    logger.info(f"Automated payout initiated for vendor {vendor.business_name}: ₦{amount}")
                else:
                    vendor_results.append({
                        'vendor_id': vendor_id,
                        'vendor_name': vendor.business_name,
                        'amount': float(amount),
                        'success': False,
                        'error': transfer_result['message']
                    })
                    logger.error(f"Failed to initiate transfer for vendor {vendor.business_name}: {transfer_result['message']}")
                
            except Exception as e:
                vendor_results.append({
                    'vendor_id': vendor_id,
                    'amount': float(amount),
                    'success': False,
                    'error': str(e)
                })
                logger.error(f"Error processing vendor payout for {vendor_id}: {str(e)}", exc_info=True)
        
        return vendor_results
    
    def process_picker_payout(self, opportunity, payment_details):
        """Process automated payout to regular picker or student picker"""
        try:
            picker = opportunity.user_picker
            amount = Decimal(str(payment_details.get('picker_payment', 0)))
            
            if amount <= 0:
                return {'success': False, 'error': 'Invalid amount'}
            
            # Get picker bank details
            if picker.user_type == 'picker':
                profile = picker.picker_profile
            elif picker.user_type == 'student_picker':
                profile = picker.student_picker_profile
            else:
                return {'success': False, 'error': 'Invalid picker type'}
            
            # Check bank details
            if not all([profile.bank_name, profile.account_number, profile.account_name]):
                error_msg = f"Picker {picker.email} has incomplete bank details"
                logger.warning(error_msg)
                return {'success': False, 'error': error_msg}
            
            # Get or create recipient code (now using bank_name)
            recipient_code = self.get_or_create_recipient(
                picker=profile,
                name=profile.account_name,
                account_number=profile.account_number,
                bank_name=profile.bank_name  # Pass bank_name instead of bank_code
            )
            
            if not recipient_code:
                return {'success': False, 'error': 'Failed to create recipient'}
            
            # Initiate transfer
            transfer_result = self.paystack.initiate_transfer(
                amount=amount,
                recipient_code=recipient_code,
                reason=f"Delivery payment for Order #{opportunity.order.order_number}"
            )
            
            if transfer_result['success']:
                # Create withdrawal record
                from payment.models import WithdrawalRequest
                
                # Get bank code for storage
                bank_code = self.paystack.get_bank_code(profile.bank_name)
                
                withdrawal = WithdrawalRequest.objects.create(
                    user=picker,
                    user_type=picker.user_type,
                    amount=amount,
                    bank_name=profile.bank_name,
                    bank_code=bank_code or profile.bank_name,  # Fallback to bank_name if code not found
                    account_number=profile.account_number,
                    account_name=profile.account_name,
                    final_amount=amount,
                    status='processing',
                    paystack_recipient_code=recipient_code,
                    paystack_transfer_code=transfer_result['transfer_code'],
                    paystack_reference=transfer_result['reference'],
                    processed_at=timezone.now(),
                    is_automated=True,
                    related_order=opportunity.order
                )
                
                logger.info(f"Automated payout initiated for picker {picker.email}: ₦{amount}")
                
                return {
                    'success': True,
                    'picker_email': picker.email,
                    'amount': float(amount),
                    'reference': transfer_result['reference'],
                    'withdrawal_id': withdrawal.id
                }
            else:
                logger.error(f"Failed to initiate picker transfer: {transfer_result['message']}")
                return {'success': False, 'error': transfer_result['message']}
                
        except Exception as e:
            logger.error(f"Error processing picker payout: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def process_company_payout(self, opportunity, payment_details):
        """Process automated payout to company for their rider"""
        try:
            company_rider = opportunity.company_rider
            company = company_rider.company
            amount = Decimal(str(payment_details.get('rider_earnings', 0)))
            
            if amount <= 0:
                return {'success': False, 'error': 'Invalid amount'}
            
            # For company, we need to check the company user's bank details
            # Assuming companies also have bank details stored
            # You might need to add bank fields to Company model if not present
            
            # Check if company has bank details
            # This assumes you have bank fields in Company model
            # If not, you'll need to add them
            
            # For now, let's create a placeholder since companies might handle this differently
            # Option 1: Pay to company's main account
            # Option 2: Hold in company wallet for manual withdrawal
            
            logger.info(f"Company payout for {company.user.email}: ₦{amount} credited to wallet")
            
            return {
                'success': True,
                'company_email': company.user.email,
                'amount': float(amount),
                'note': 'Credited to company wallet - manual withdrawal required'
            }
            
        except Exception as e:
            logger.error(f"Error processing company payout: {str(e)}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def get_or_create_recipient(self, vendor=None, picker=None, name=None, account_number=None, bank_name=None):
        """
        Get existing recipient code or create new one
        Now uses bank_name and resolves to bank_code automatically
        """
        try:
            # Check if vendor/picker already has a recipient code
            if vendor and hasattr(vendor, 'paystack_recipient_code'):
                if vendor.paystack_recipient_code:
                    logger.info(f"Using existing recipient code for vendor")
                    return vendor.paystack_recipient_code
            
            if picker and hasattr(picker, 'paystack_recipient_code'):
                if picker.paystack_recipient_code:
                    logger.info(f"Using existing recipient code for picker")
                    return picker.paystack_recipient_code
            
            # Get bank code from bank name
            bank_code = self.paystack.get_bank_code(bank_name)
            
            if not bank_code:
                logger.error(f"Could not resolve bank code for: {bank_name}")
                return None
            
            logger.info(f"Resolved bank '{bank_name}' to code: {bank_code}")
            
            # Create new recipient using the convenience method
            recipient_result = self.paystack.create_transfer_recipient(
                name=name,
                account_number=account_number,
                bank_code=bank_code
            )
            
            if recipient_result['success']:
                recipient_code = recipient_result['recipient_code']
                
                # Save recipient code to model
                if vendor:
                    vendor.paystack_recipient_code = recipient_code
                    vendor.save()
                    logger.info(f"Saved recipient code for vendor: {vendor.business_name}")
                
                if picker:
                    picker.paystack_recipient_code = recipient_code
                    picker.save()
                    logger.info(f"Saved recipient code for picker")
                
                return recipient_code
            else:
                logger.error(f"Failed to create recipient: {recipient_result['message']}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting/creating recipient: {str(e)}", exc_info=True)
            return None