from django.shortcuts import render
import requests
import logging
from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
import hashlib
import hmac

logger = logging.getLogger(__name__)
from .models import WithdrawalRequest
from order.models import WalletTransaction
from User.models import User

# Create your views here.
class PaystackTransferService:
    """Service class to handle Paystack transfers"""
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = "https://api.paystack.co"
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def resolve_account(self, account_number, bank_code):
        """Resolve bank account to get account name"""
        url = f"{self.base_url}/bank/resolve"
        params = {
            'account_number': account_number,
            'bank_code': bank_code
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            data = response.json()
            
            if response.status_code == 200 and data.get('status'):
                return {
                    'success': True,
                    'account_name': data['data']['account_name'],
                    'account_number': data['data']['account_number']
                }
            else:
                return {
                    'success': False,
                    'message': data.get('message', 'Account resolution failed')
                }
        except requests.RequestException as e:
            logger.error(f"Account resolution request error: {str(e)}")
            return {
                'success': False,
                'message': 'Network error during account resolution'
            }
        except Exception as e:
            logger.error(f"Account resolution error: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred during account resolution'
            }
    
    def create_transfer_recipient(self, name, account_number, bank_code):
        """Create a transfer recipient on Paystack"""
        url = f"{self.base_url}/transferrecipient"
        data = {
            "type": "nuban",
            "name": name,
            "account_number": account_number,
            "bank_code": bank_code,
            "currency": "NGN"
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            response_data = response.json()
            
            if response.status_code == 201 and response_data.get('status'):
                return {
                    'success': True,
                    'recipient_code': response_data['data']['recipient_code']
                }
            else:
                return {
                    'success': False,
                    'message': response_data.get('message', 'Failed to create recipient')
                }
        except requests.RequestException as e:
            logger.error(f"Create recipient request error: {str(e)}")
            return {
                'success': False,
                'message': 'Network error during recipient creation'
            }
        except Exception as e:
            logger.error(f"Create recipient error: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred during recipient creation'
            }
    
    def initiate_transfer(self, amount, recipient_code, reason=None):
        """Initiate a transfer to a recipient"""
        url = f"{self.base_url}/transfer"
        
        # Convert amount to kobo (multiply by 100)
        amount_in_kobo = int(float(amount) * 100)
        
        data = {
            "source": "balance",
            "amount": amount_in_kobo,
            "recipient": recipient_code,
            "reason": reason or "Withdrawal from StuMart"
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data, timeout=30)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                return {
                    'success': True,
                    'transfer_code': response_data['data']['transfer_code'],
                    'reference': response_data['data']['reference'],
                    'amount': response_data['data']['amount'] / 100,  # Convert back to naira
                    'status': response_data['data']['status']
                }
            else:
                return {
                    'success': False,
                    'message': response_data.get('message', 'Transfer initiation failed')
                }
        except requests.RequestException as e:
            logger.error(f"Transfer initiation request error: {str(e)}")
            return {
                'success': False,
                'message': 'Network error during transfer initiation'
            }
        except Exception as e:
            logger.error(f"Transfer initiation error: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred during transfer initiation'
            }
    
    def verify_transfer(self, reference):
        """Verify transfer status"""
        url = f"{self.base_url}/transfer/verify/{reference}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                return {
                    'success': True,
                    'status': response_data['data']['status'],
                    'amount': response_data['data']['amount'] / 100,
                    'reason': response_data['data'].get('reason', ''),
                    'transferred_at': response_data['data'].get('transferred_at')
                }
            else:
                return {
                    'success': False,
                    'message': response_data.get('message', 'Transfer verification failed')
                }
        except requests.RequestException as e:
            logger.error(f"Transfer verification request error: {str(e)}")
            return {
                'success': False,
                'message': 'Network error during transfer verification'
            }
        except Exception as e:
            logger.error(f"Transfer verification error: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred during transfer verification'
            }
    
    def get_banks(self):
        """Get list of supported banks"""
        url = f"{self.base_url}/bank"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                return {
                    'success': True,
                    'banks': response_data['data']
                }
            else:
                return {
                    'success': False,
                    'message': 'Failed to fetch banks'
                }
        except requests.RequestException as e:
            logger.error(f"Get banks request error: {str(e)}")
            return {
                'success': False,
                'message': 'Network error during bank fetch'
            }
        except Exception as e:
            logger.error(f"Get banks error: {str(e)}")
            return {
                'success': False,
                'message': 'An error occurred during bank fetch'
            }

class BankListView(APIView):
    """Get list of supported banks with comprehensive Nigerian bank codes"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Try to get from Paystack API first
            paystack = PaystackTransferService()
            banks_result = paystack.get_banks()
            
            if banks_result['success']:
                banks = banks_result['banks']
            else:
                # Fallback to comprehensive local bank list
                banks = self.get_comprehensive_bank_list()
            
            # Sort banks alphabetically
            banks_sorted = sorted(banks, key=lambda x: x.get('name', ''))
            
            return Response({
                'success': True,
                'banks': banks_sorted,
                'total_count': len(banks_sorted)
            }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error fetching banks: {str(e)}")
            # Return comprehensive local bank list as fallback
            banks = self.get_comprehensive_bank_list()
            return Response({
                'success': True,
                'banks': banks,
                'total_count': len(banks),
                'note': 'Returned local bank list due to API error'
            }, status=status.HTTP_200_OK)
    
    def get_comprehensive_bank_list(self):
        """Get comprehensive list of Nigerian banks"""
        return [
            # Commercial Banks
            {"name": "Access Bank", "code": "044", "type": "commercial"},
            {"name": "Citibank Nigeria Limited", "code": "023", "type": "commercial"},
            {"name": "Ecobank Nigeria Plc", "code": "050", "type": "commercial"},
            {"name": "Fidelity Bank", "code": "070", "type": "commercial"},
            {"name": "First Bank of Nigeria", "code": "011", "type": "commercial"},
            {"name": "First City Monument Bank", "code": "214", "type": "commercial"},
            {"name": "Guaranty Trust Bank", "code": "058", "type": "commercial"},
            {"name": "Heritage Bank", "code": "030", "type": "commercial"},
            {"name": "Polaris Bank", "code": "076", "type": "commercial"},
            {"name": "Providus Bank", "code": "101", "type": "commercial"},
            {"name": "Stanbic IBTC Bank", "code": "221", "type": "commercial"},
            {"name": "Standard Chartered Bank", "code": "068", "type": "commercial"},
            {"name": "Sterling Bank", "code": "232", "type": "commercial"},
            {"name": "Union Bank of Nigeria", "code": "032", "type": "commercial"},
            {"name": "United Bank for Africa", "code": "033", "type": "commercial"},
            {"name": "Unity Bank", "code": "215", "type": "commercial"},
            {"name": "Wema Bank", "code": "035", "type": "commercial"},
            {"name": "Zenith Bank", "code": "057", "type": "commercial"},
            {"name": "Keystone Bank", "code": "082", "type": "commercial"},
            {"name": "Jaiz Bank", "code": "301", "type": "commercial"},
            {"name": "SunTrust Bank", "code": "100", "type": "commercial"},
            {"name": "Titan Trust Bank", "code": "102", "type": "commercial"},
            
            # Microfinance Banks
            {"name": "LAPO Microfinance Bank", "code": "50563", "type": "microfinance"},
            {"name": "AB Microfinance Bank", "code": "51204", "type": "microfinance"},
            {"name": "Accion Microfinance Bank", "code": "51336", "type": "microfinance"},
            {"name": "Aella Credit", "code": "51310", "type": "microfinance"},
            {"name": "Alekun Microfinance Bank", "code": "50994", "type": "microfinance"},
            {"name": "Amju Unique Microfinance Bank", "code": "50926", "type": "microfinance"},
            {"name": "Bowen Microfinance Bank", "code": "50931", "type": "microfinance"},
            {"name": "Carbon", "code": "565", "type": "microfinance"},
            {"name": "CEMCS Microfinance Bank", "code": "50823", "type": "microfinance"},
            {"name": "Evangel Microfinance Bank", "code": "50957", "type": "microfinance"},
            {"name": "FIMS Microfinance Bank", "code": "51314", "type": "microfinance"},
            {"name": "Fortis Microfinance Bank", "code": "501", "type": "microfinance"},
            {"name": "Hackman Microfinance Bank", "code": "51251", "type": "microfinance"},
            {"name": "Hasal Microfinance Bank", "code": "50383", "type": "microfinance"},
            {"name": "Ibile Microfinance Bank", "code": "51244", "type": "microfinance"},
            {"name": "Imowo Microfinance Bank", "code": "50453", "type": "microfinance"},
            {"name": "Infinity Microfinance Bank", "code": "50457", "type": "microfinance"},
            {"name": "Kredi Money Microfinance Bank", "code": "50200", "type": "microfinance"},
            {"name": "Kuda Bank", "code": "50211", "type": "microfinance"},
            {"name": "Lagos Building Investment Company Plc.", "code": "90052", "type": "microfinance"},
            {"name": "Mayfair Microfinance Bank", "code": "50563", "type": "microfinance"},
            {"name": "Mint Finex Microfinance Bank", "code": "50304", "type": "microfinance"},
            {"name": "NPF Microfinance Bank", "code": "552", "type": "microfinance"},
            {"name": "Opay", "code": "999992", "type": "microfinance"},
            {"name": "PalmPay", "code": "999991", "type": "microfinance"},
            {"name": "Parkway - ReadyCash", "code": "51316", "type": "microfinance"},
            {"name": "Paycom Microfinance Bank", "code": "50474", "type": "microfinance"},
            {"name": "Petra Microfinance Bank", "code": "50746", "type": "microfinance"},
            {"name": "Rahama Microfinance bank", "code": "51085", "type": "microfinance"},
            {"name": "Renmoney Microfinance Bank", "code": "51322", "type": "microfinance"},
            {"name": "Rubies Microfinance Bank", "code": "125", "type": "microfinance"},
            {"name": "Sparkle Microfinance Bank", "code": "51310", "type": "microfinance"},
            {"name": "Trust Microfinance Bank", "code": "51269", "type": "microfinance"},
            {"name": "VFD Microfinance Bank", "code": "566", "type": "microfinance"},
            {"name": "Visa Microfinance Bank", "code": "51355", "type": "microfinance"},
            {"name": "Winco Microfinance Bank", "code": "51297", "type": "microfinance"},
            
            # Digital Banks
            {"name": "Moniepoint Microfinance Bank", "code": "50515", "type": "microfinance"},
            {"name": "Rubies Microfinance Bank", "code": "125", "type": "microfinance"},
            {"name": "GoMoney", "code": "100022", "type": "microfinance"},
            
            # Other Financial Institutions
            {"name": "Nigeria Inter-Bank Settlement System Plc", "code": "999999", "type": "other"},
            {"name": "Coronation Merchant Bank", "code": "559", "type": "merchant"},
            {"name": "FBN Merchant Bank Limited", "code": "90067", "type": "merchant"},
            {"name": "FSDH Merchant Bank Limited", "code": "501", "type": "merchant"},
            {"name": "Greenwich Merchant Bank", "code": "562", "type": "merchant"},
            {"name": "Nova Merchant Bank", "code": "103", "type": "merchant"},
            {"name": "Rand Merchant Bank", "code": "502", "type": "merchant"},
            
            # Payment Service Banks
            {"name": "9mobile", "code": "120001", "type": "payment_service"},
            {"name": "Airtel", "code": "120002", "type": "payment_service"},
            {"name": "MTN", "code": "120003", "type": "payment_service"},
            {"name": "Globacom", "code": "120004", "type": "payment_service"},
        ]

class AccountVerificationView(APIView):
    """Verify bank account details"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            account_number = request.data.get('account_number', '').strip()
            bank_code = request.data.get('bank_code', '').strip()
            
            # Validate inputs
            if not account_number or not bank_code:
                return Response({
                    'error': 'Account number and bank code are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate account number format (should be 10 digits for NUBAN)
            if not account_number.isdigit() or len(account_number) != 10:
                return Response({
                    'error': 'Account number must be 10 digits'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize Paystack service
            paystack = PaystackTransferService()
            
            # Resolve account
            result = paystack.resolve_account(account_number, bank_code)
            
            if result['success']:
                bank_name = self.get_bank_name(bank_code)
                return Response({
                    'success': True,
                    'account_name': result['account_name'],
                    'account_number': result['account_number'],
                    'bank_name': bank_name,
                    'bank_code': bank_code
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Account verification error: {str(e)}")
            return Response({
                'error': 'An error occurred while verifying account'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_bank_name(self, bank_code):
        """Get bank name from bank code"""
        bank_list = BankListView().get_comprehensive_bank_list()
        for bank in bank_list:
            if bank['code'] == bank_code:
                return bank['name']
        return 'Unknown Bank'

class WithdrawalView(APIView):
    """Handle withdrawal requests"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            amount = Decimal(str(request.data.get('amount', 0)))
            bank_code = request.data.get('bank_code', '').strip()
            account_number = request.data.get('account_number', '').strip()
            
            # Validate user type
            if user.user_type not in ['vendor', 'picker', 'student_picker', 'company']:
                return Response({
                    'error': 'Invalid user type for withdrawal'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate required fields
            if not all([amount, bank_code, account_number]):
                return Response({
                    'error': 'Amount, bank code, and account number are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate amount
            if amount <= 0:
                return Response({
                    'error': 'Amount must be greater than zero'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check minimum withdrawal amount
            min_withdrawal = Decimal('100.00')
            if amount < min_withdrawal:
                return Response({
                    'error': f'Minimum withdrawal amount is ₦{min_withdrawal}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check maximum withdrawal amount
            max_withdrawal = Decimal('500000.00')  # 500k limit
            if amount > max_withdrawal:
                return Response({
                    'error': f'Maximum withdrawal amount is ₦{max_withdrawal}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate account number
            if not account_number.isdigit() or len(account_number) != 10:
                return Response({
                    'error': 'Account number must be 10 digits'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check for pending withdrawals
            pending_withdrawal = WithdrawalRequest.objects.filter(
                user=user,
                status__in=['pending', 'processing']
            ).exists()
            
            if pending_withdrawal:
                return Response({
                    'error': 'You have a pending withdrawal. Please wait for it to complete.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user wallet and check balance
            wallet_balance = self.get_user_wallet_balance(user)
            if wallet_balance < amount:
                return Response({
                    'error': f'Insufficient balance. Available: ₦{wallet_balance:.2f}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize Paystack service
            paystack = PaystackTransferService()
            
            # Resolve account
            account_resolution = paystack.resolve_account(account_number, bank_code)
            if not account_resolution['success']:
                return Response({
                    'error': f"Account resolution failed: {account_resolution['message']}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            account_name = account_resolution['account_name']
            
            with transaction.atomic():
                # Create withdrawal request
                withdrawal_request = WithdrawalRequest.objects.create(
                    user=user,
                    user_type=user.user_type,
                    amount=amount,
                    bank_name=self.get_bank_name(bank_code),
                    bank_code=bank_code,
                    account_number=account_number,
                    account_name=account_name,
                    final_amount=amount,
                    status='pending'
                )
                
                # Create or get existing recipient
                recipient_code = self.get_or_create_recipient(
                    user, paystack, account_name, account_number, bank_code
                )
                if not recipient_code:
                    withdrawal_request.status = 'failed'
                    withdrawal_request.failure_reason = 'Failed to create payment recipient'
                    withdrawal_request.save()
                    return Response({
                        'error': 'Failed to create payment recipient'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                withdrawal_request.paystack_recipient_code = recipient_code
                withdrawal_request.save()
                
                # Initiate transfer
                transfer_result = paystack.initiate_transfer(
                    amount=amount,
                    recipient_code=recipient_code,
                    reason=f"Withdrawal from StuMart - {user.user_type}"
                )
                
                if transfer_result['success']:
                    # Update withdrawal request
                    withdrawal_request.paystack_transfer_code = transfer_result['transfer_code']
                    withdrawal_request.paystack_reference = transfer_result['reference']
                    withdrawal_request.status = 'processing'
                    withdrawal_request.processed_at = timezone.now()
                    withdrawal_request.save()
                    
                    # Deduct from user wallet
                    self.deduct_from_wallet(user, amount, withdrawal_request.id)
                    
                    return Response({
                        'success': True,
                        'message': 'Withdrawal request processed successfully',
                        'withdrawal_id': withdrawal_request.id,
                        'reference': transfer_result['reference'],
                        'status': transfer_result['status'],
                        'amount': float(amount),
                        'account_name': account_name,
                        'bank_name': withdrawal_request.bank_name
                    }, status=status.HTTP_200_OK)
                else:
                    withdrawal_request.status = 'failed'
                    withdrawal_request.failure_reason = transfer_result['message']
                    withdrawal_request.save()
                    
                    return Response({
                        'error': f"Transfer failed: {transfer_result['message']}"
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except ValueError:
            return Response({
                'error': 'Invalid amount format'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Withdrawal error: {str(e)}", exc_info=True)
            return Response({
                'error': 'An error occurred while processing withdrawal'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Get withdrawal history for user"""
        try:
            user = request.user
            
            # Get query parameters for pagination
            page = int(request.GET.get('page', 1))
            per_page = int(request.GET.get('per_page', 10))
            status_filter = request.GET.get('status', None)
            
            # Build query
            withdrawals_query = WithdrawalRequest.objects.filter(user=user)
            
            if status_filter:
                withdrawals_query = withdrawals_query.filter(status=status_filter)
            
            # Order by creation date (newest first)
            withdrawals_query = withdrawals_query.order_by('-created_at')
            
            # Calculate pagination
            total_count = withdrawals_query.count()
            start_index = (page - 1) * per_page
            end_index = start_index + per_page
            withdrawals = withdrawals_query[start_index:end_index]
            
            withdrawal_data = []
            for withdrawal in withdrawals:
                withdrawal_data.append({
                    'id': withdrawal.id,
                    'amount': float(withdrawal.amount),
                    'final_amount': float(withdrawal.final_amount),
                    'status': withdrawal.status,
                    'bank_name': withdrawal.bank_name,
                    'bank_code': withdrawal.bank_code,
                    'account_number': withdrawal.account_number[-4:] if withdrawal.account_number else '',
                    'account_name': withdrawal.account_name,
                    'created_at': withdrawal.created_at.isoformat() if withdrawal.created_at else None,
                    'processed_at': withdrawal.processed_at.isoformat() if withdrawal.processed_at else None,
                    'completed_at': withdrawal.completed_at.isoformat() if withdrawal.completed_at else None,
                    'failure_reason': withdrawal.failure_reason,
                    'paystack_reference': withdrawal.paystack_reference
                })
            
            return Response({
                'success': True,
                'withdrawals': withdrawal_data,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total_count': total_count,
                    'total_pages': (total_count + per_page - 1) // per_page
                },
                'wallet_balance': float(self.get_user_wallet_balance(user))
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching withdrawal history: {str(e)}")
            return Response({
                'error': 'Failed to fetch withdrawal history'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_user_wallet_balance(self, user):
        """Get wallet balance based on user type"""
        try:
            if user.user_type == 'vendor':
                wallet = user.vendor_profile.wallet
                return wallet.balance
            elif user.user_type == 'picker':
                wallet = user.picker_profile.wallet
                return wallet.amount
            elif user.user_type == 'student_picker':
                wallet = user.student_picker_profile.wallet
                return wallet.amount
            elif user.user_type == 'company':
                wallet = user.company_profile.wallet
                return wallet.balance
            else:
                return Decimal('0.00')
        except Exception as e:
            logger.error(f"Error getting wallet balance: {str(e)}")
            return Decimal('0.00')
    
    def deduct_from_wallet(self, user, amount, withdrawal_id):
        """Deduct amount from user wallet"""
        try:
            if user.user_type == 'vendor':
                wallet = user.vendor_profile.wallet
                wallet.balance -= amount
                wallet.save()
            elif user.user_type == 'picker':
                wallet = user.picker_profile.wallet
                wallet.amount -= amount
                wallet.save()
            elif user.user_type == 'student_picker':
                wallet = user.student_picker_profile.wallet
                wallet.amount -= amount
                wallet.save()
            elif user.user_type == 'company':
                wallet = user.company_profile.wallet
                wallet.balance -= amount
                wallet.save()
                
            # Create transaction record
            WalletTransaction.objects.create(
                transaction_type='withdrawal',
                amount=-amount,  # Negative for deduction
                user=user,
                description=f"Withdrawal to bank account (Withdrawal ID: {withdrawal_id})",
            )
                
        except Exception as e:
            logger.error(f"Error deducting from wallet: {str(e)}")
            raise
    
    def get_or_create_recipient(self, user, paystack, account_name, account_number, bank_code):
        """Get existing recipient code or create new one"""
        try:
            # Check if user already has a recipient code for this account
            existing_request = WithdrawalRequest.objects.filter(
                user=user,
                account_number=account_number,
                bank_code=bank_code,
                paystack_recipient_code__isnull=False
            ).first()
            
            if existing_request:
                return existing_request.paystack_recipient_code
            
            # Create new recipient
            recipient_result = paystack.create_transfer_recipient(
                name=account_name,
                account_number=account_number,
                bank_code=bank_code
            )
            
            if recipient_result['success']:
                return recipient_result['recipient_code']
            else:
                logger.error(f"Failed to create recipient: {recipient_result['message']}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting/creating recipient: {str(e)}")
            return None
    
    def get_bank_name(self, bank_code):
        """Get bank name from bank code"""
        bank_list = BankListView().get_comprehensive_bank_list()
        for bank in bank_list:
            if bank['code'] == bank_code:
                return bank['name']
        return 'Unknown Bank'

class WithdrawalStatusView(APIView):
    """Check withdrawal status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, withdrawal_id):
        try:
            user = request.user
            
            # Get withdrawal request
            try:
                withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id, user=user)
            except WithdrawalRequest.DoesNotExist:
                return Response({
                    'error': 'Withdrawal request not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # If withdrawal has Paystack reference, verify with Paystack
            if withdrawal.paystack_reference and withdrawal.status == 'processing':
                paystack = PaystackTransferService()
                verification_result = paystack.verify_transfer(withdrawal.paystack_reference)
                
                if verification_result['success']:
                    # Update status based on Paystack response
                    paystack_status = verification_result['status']
                    if paystack_status == 'success' and withdrawal.status != 'completed':
                        withdrawal.status = 'completed'
                        withdrawal.completed_at = timezone.now()
                        withdrawal.save()
                    elif paystack_status == 'failed' and withdrawal.status != 'failed':
                        withdrawal.status = 'failed'
                        withdrawal.failure_reason = 'Transfer failed at Paystack'
                        withdrawal.save()
                        # Refund wallet
                        self.refund_wallet(withdrawal)
            
            return Response({
                'success': True,
                'withdrawal': {
                    'id': withdrawal.id,
                    'amount': float(withdrawal.amount),
                    'final_amount': float(withdrawal.final_amount),
                    'status': withdrawal.status,
                    'bank_name': withdrawal.bank_name,
                    'bank_code': withdrawal.bank_code,
                    'account_number': withdrawal.account_number[-4:] if withdrawal.account_number else '',
                    'account_name': withdrawal.account_name,
                    'created_at': withdrawal.created_at.isoformat() if withdrawal.created_at else None,
                    'processed_at': withdrawal.processed_at.isoformat() if withdrawal.processed_at else None,
                    'completed_at': withdrawal.completed_at.isoformat() if withdrawal.completed_at else None,
                    'failure_reason': withdrawal.failure_reason,
                    'paystack_reference': withdrawal.paystack_reference
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error checking withdrawal status: {str(e)}")
            return Response({
                'error': 'Failed to check withdrawal status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def refund_wallet(self, withdrawal):
        """Refund amount back to user wallet"""
        try:
            user = withdrawal.user
            amount = withdrawal.amount
            
            if user.user_type == 'vendor':
                wallet = user.vendor_profile.wallet
                wallet.balance += amount
                wallet.save()
            elif user.user_type == 'picker':
                wallet = user.picker_profile.wallet
                wallet.amount += amount
                wallet.save()
            elif user.user_type == 'student_picker':
                wallet = user.student_picker_profile.wallet
                wallet.amount += amount
                wallet.save()
            elif user.user_type == 'company':
                wallet = user.company_profile.wallet
                wallet.balance += amount
                wallet.save()
            
            # Create refund transaction record
            WalletTransaction.objects.create(
                transaction_type='refund',
                amount=amount,
                user=user,
                description=f"Refund for failed withdrawal - {withdrawal.paystack_reference}",
            )
            
        except Exception as e:
            logger.error(f"Error refunding wallet: {str(e)}")

class WithdrawalLimitsView(APIView):
    """Get withdrawal limits and user info"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Get wallet balance
            wallet_balance = self.get_user_wallet_balance(user)
            
            # Get daily/monthly withdrawal totals
            today = timezone.now().date()
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            daily_total = WithdrawalRequest.objects.filter(
                user=user,
                status__in=['completed', 'processing'],
                created_at__date=today
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            
            monthly_total = WithdrawalRequest.objects.filter(
                user=user,
                status__in=['completed', 'processing'],
                created_at__gte=current_month
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            
            # Define limits
            limits = {
                'min_withdrawal': Decimal('100.00'),
                'max_withdrawal': Decimal('500000.00'),
                'daily_limit': Decimal('1000000.00'),  # 1M per day
                'monthly_limit': Decimal('10000000.00'),  # 10M per month
            }
            
            # Check if user has pending withdrawals
            has_pending = WithdrawalRequest.objects.filter(
                user=user,
                status__in=['pending', 'processing']
            ).exists()
            
            return Response({
                'success': True,
                'wallet_balance': float(wallet_balance),
                'limits': {
                    'min_withdrawal': float(limits['min_withdrawal']),
                    'max_withdrawal': float(limits['max_withdrawal']),
                    'daily_limit': float(limits['daily_limit']),
                    'monthly_limit': float(limits['monthly_limit']),
                },
                'usage': {
                    'daily_used': float(daily_total),
                    'monthly_used': float(monthly_total),
                    'daily_remaining': float(limits['daily_limit'] - daily_total),
                    'monthly_remaining': float(limits['monthly_limit'] - monthly_total),
                },
                'can_withdraw': not has_pending and wallet_balance >= limits['min_withdrawal'],
                'has_pending_withdrawal': has_pending
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching withdrawal limits: {str(e)}")
            return Response({
                'error': 'Failed to fetch withdrawal limits'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_user_wallet_balance(self, user):
        """Get wallet balance based on user type"""
        try:
            if user.user_type == 'vendor':
                wallet = user.vendor_profile.wallet
                return wallet.balance
            elif user.user_type == 'picker':
                wallet = user.picker_profile.wallet
                return wallet.amount
            elif user.user_type == 'student_picker':
                wallet = user.student_picker_profile.wallet
                return wallet.amount
            elif user.user_type == 'company':
                wallet = user.company_profile.wallet
                return wallet.balance
            else:
                return Decimal('0.00')
        except Exception as e:
            logger.error(f"Error getting wallet balance: {str(e)}")
            return Decimal('0.00')

class WithdrawalStatsView(APIView):
    """Get withdrawal statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Get time filters
            period = request.GET.get('period', '30')  # days
            try:
                days = int(period)
            except ValueError:
                days = 30
            
            start_date = timezone.now() - timezone.timedelta(days=days)
            
            # Get withdrawal stats
            withdrawals = WithdrawalRequest.objects.filter(
                user=user,
                created_at__gte=start_date
            )
            
            total_withdrawals = withdrawals.count()
            successful_withdrawals = withdrawals.filter(status='completed').count()
            failed_withdrawals = withdrawals.filter(status='failed').count()
            pending_withdrawals = withdrawals.filter(status__in=['pending', 'processing']).count()
            
            total_amount = withdrawals.filter(
                status__in=['completed', 'processing']
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            
            successful_amount = withdrawals.filter(
                status='completed'
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
            
            # Get monthly breakdown
            monthly_stats = []
            for i in range(6):  # Last 6 months
                month_start = (timezone.now() - timezone.timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_end = (month_start + timezone.timedelta(days=32)).replace(day=1) - timezone.timedelta(seconds=1)
                
                month_withdrawals = WithdrawalRequest.objects.filter(
                    user=user,
                    created_at__gte=month_start,
                    created_at__lte=month_end,
                    status='completed'
                )
                
                month_total = month_withdrawals.aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
                month_count = month_withdrawals.count()
                
                monthly_stats.append({
                    'month': month_start.strftime('%B %Y'),
                    'total_amount': float(month_total),
                    'total_count': month_count
                })
            
            return Response({
                'success': True,
                'period_days': days,
                'stats': {
                    'total_withdrawals': total_withdrawals,
                    'successful_withdrawals': successful_withdrawals,
                    'failed_withdrawals': failed_withdrawals,
                    'pending_withdrawals': pending_withdrawals,
                    'success_rate': (successful_withdrawals / total_withdrawals * 100) if total_withdrawals > 0 else 0,
                    'total_amount': float(total_amount),
                    'successful_amount': float(successful_amount),
                    'average_withdrawal': float(successful_amount / successful_withdrawals) if successful_withdrawals > 0 else 0
                },
                'monthly_breakdown': monthly_stats[::-1]  # Reverse to show oldest first
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching withdrawal stats: {str(e)}")
            return Response({
                'error': 'Failed to fetch withdrawal statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Webhook to handle transfer status updates
class PaystackWebhookView(APIView):
    """Handle Paystack webhooks for transfer status updates"""
    permission_classes = []
    
    def post(self, request):
        try:
            # Verify webhook signature for security
            signature = request.headers.get('x-paystack-signature', '')
            if not self.verify_signature(request.body, signature):
                logger.warning("Invalid webhook signature received")
                return Response({'status': 'invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
            
            event = request.data.get('event')
            data = request.data.get('data', {})
            
            logger.info(f"Received Paystack webhook: {event}")
            
            if event == 'transfer.success':
                self.handle_transfer_success(data)
            elif event == 'transfer.failed':
                self.handle_transfer_failed(data)
            elif event == 'transfer.reversed':
                self.handle_transfer_reversed(data)
            else:
                logger.info(f"Unhandled webhook event: {event}")
            
            return Response({'status': 'success'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
            return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def verify_signature(self, payload, signature):
        """Verify Paystack webhook signature"""
        try:
            expected_signature = hmac.new(
                settings.PAYSTACK_SECRET_KEY.encode('utf-8'),
                payload,
                hashlib.sha512
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Signature verification error: {str(e)}")
            return False
    
    def handle_transfer_success(self, data):
        """Handle successful transfer"""
        try:
            reference = data.get('reference')
            if not reference:
                logger.error("No reference in transfer success webhook")
                return
            
            withdrawal = WithdrawalRequest.objects.get(paystack_reference=reference)
            withdrawal.status = 'completed'
            withdrawal.completed_at = timezone.now()
            withdrawal.save()
            
            logger.info(f"Transfer completed successfully: {reference}")
            
        except WithdrawalRequest.DoesNotExist:
            logger.error(f"Withdrawal request not found for reference: {reference}")
        except Exception as e:
            logger.error(f"Error handling transfer success: {str(e)}")
    
    def handle_transfer_failed(self, data):
        """Handle failed transfer"""
        try:
            reference = data.get('reference')
            if not reference:
                logger.error("No reference in transfer failed webhook")
                return
                
            withdrawal = WithdrawalRequest.objects.get(paystack_reference=reference)
            withdrawal.status = 'failed'
            withdrawal.failure_reason = data.get('reason', 'Transfer failed')
            withdrawal.save()
            
            # Refund user wallet
            self.refund_wallet(withdrawal)
            
            logger.info(f"Transfer failed: {reference} - {withdrawal.failure_reason}")
            
        except WithdrawalRequest.DoesNotExist:
            logger.error(f"Withdrawal request not found for reference: {reference}")
        except Exception as e:
            logger.error(f"Error handling transfer failure: {str(e)}")
    
    def handle_transfer_reversed(self, data):
        """Handle reversed transfer"""
        try:
            reference = data.get('reference')
            if not reference:
                logger.error("No reference in transfer reversed webhook")
                return
                
            withdrawal = WithdrawalRequest.objects.get(paystack_reference=reference)
            withdrawal.status = 'cancelled'
            withdrawal.failure_reason = 'Transfer was reversed'
            withdrawal.save()
            
            # Refund user wallet
            self.refund_wallet(withdrawal)
            
            logger.info(f"Transfer reversed: {reference}")
            
        except WithdrawalRequest.DoesNotExist:
            logger.error(f"Withdrawal request not found for reference: {reference}")
        except Exception as e:
            logger.error(f"Error handling transfer reversal: {str(e)}")
    
    def refund_wallet(self, withdrawal):
        """Refund amount back to user wallet"""
        try:
            user = withdrawal.user
            amount = withdrawal.amount
            
            if user.user_type == 'vendor':
                wallet = user.vendor_profile.wallet
                wallet.balance += amount
                wallet.save()
            elif user.user_type == 'picker':
                wallet = user.picker_profile.wallet
                wallet.amount += amount
                wallet.save()
            elif user.user_type == 'student_picker':
                wallet = user.student_picker_profile.wallet
                wallet.amount += amount
                wallet.save()
            elif user.user_type == 'company':
                wallet = user.company_profile.wallet
                wallet.balance += amount
                wallet.save()
            
            # Create refund transaction record
            WalletTransaction.objects.create(
                transaction_type='refund',
                amount=amount,
                user=user,
                description=f"Refund for failed withdrawal - {withdrawal.paystack_reference}",
            )
            
            logger.info(f"Wallet refunded for user {user.id}, amount: {amount}")
            
        except Exception as e:
            logger.error(f"Error refunding wallet: {str(e)}")

class BankSearchView(APIView):
    """Search for banks by name"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            query = request.GET.get('q', '').strip().lower()
            bank_type = request.GET.get('type', '').strip().lower()
            
            if not query:
                return Response({
                    'error': 'Search query is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get all banks
            all_banks = BankListView().get_comprehensive_bank_list()
            
            # Filter by search query
            filtered_banks = [
                bank for bank in all_banks
                if query in bank['name'].lower()
            ]
            
            # Filter by type if specified
            if bank_type and bank_type in ['commercial', 'microfinance', 'merchant', 'payment_service', 'other']:
                filtered_banks = [
                    bank for bank in filtered_banks
                    if bank['type'] == bank_type
                ]
            
            # Sort by relevance (exact matches first, then partial matches)
            def sort_key(bank):
                name_lower = bank['name'].lower()
                if name_lower.startswith(query):
                    return (0, name_lower)
                elif query in name_lower:
                    return (1, name_lower)
                else:
                    return (2, name_lower)
            
            filtered_banks.sort(key=sort_key)
            
            return Response({
                'success': True,
                'banks': filtered_banks[:20],  # Limit to 20 results
                'total_found': len(filtered_banks),
                'query': query
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Bank search error: {str(e)}")
            return Response({
                'error': 'Failed to search banks'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)