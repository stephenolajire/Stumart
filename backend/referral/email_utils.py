from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone


def send_payout_notification_email(referral, payout_amount, period_start, period_end):
    """
    Send payout notification email to a referral
    
    Args:
        referral: Referral instance
        payout_amount: Amount being paid out
        period_start: Start of payout period
        period_end: End of payout period
    
    Returns:
        Boolean indicating success
    """
    subject = f'Your Referral Earnings - ₦{payout_amount:,.2f}'
    
    # Format dates
    period_start_str = period_start.strftime('%B %d, %Y')
    period_end_str = period_end.strftime('%B %d, %Y')
    current_month = period_end.strftime('%B %Y')
    
    # Create email context
    context = {
        'first_name': referral.first_name,
        'last_name': referral.last_name,
        'referral_code': referral.referral_code,
        'payout_amount': payout_amount,
        'total_referrals': referral.total_referrals,
        'period_start': period_start_str,
        'period_end': period_end_str,
        'current_month': current_month,
        'lifetime_earnings': referral.lifetime_earnings,
        'total_paid_out': referral.total_paid_out,
    }
    
    # Plain text message
    text_message = f"""
Hello {referral.first_name} {referral.last_name},

Great news! Your referral earnings for {current_month} are ready.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYOUT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Referral Code: {referral.referral_code}
Period: {period_start_str} - {period_end_str}

Completed Referrals: {referral.total_referrals}
Amount Earned: ₦{payout_amount:,.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIFETIME STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Referrals: {referral.lifetime_referrals}
Total Earnings: ₦{referral.lifetime_earnings:,.2f}
Total Paid Out: ₦{referral.total_paid_out:,.2f}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your payout will be processed shortly. Keep sharing your referral code to earn more!

Thank you for being a valued member of our referral program.

Best regards,
The Team
    """
    
    # HTML message (optional, more attractive)
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #EAB308 0%, #F59E0B 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }}
        .stat-box {{
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .amount {{
            font-size: 36px;
            font-weight: bold;
            color: #EAB308;
            margin: 10px 0;
        }}
        .label {{
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .value {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 5px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }}
        .code {{
            background: #f0f0f0;
            padding: 10px 20px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 20px;
            letter-spacing: 2px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎉 Referral Earnings</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your {current_month} Payout Summary</p>
        </div>
        
        <div class="content">
            <p>Hello <strong>{referral.first_name} {referral.last_name}</strong>,</p>
            
            <p>Great news! Your referral earnings for <strong>{current_month}</strong> are ready.</p>
            
            <div class="stat-box" style="text-align: center; background: linear-gradient(135deg, #EAB308 0%, #F59E0B 100%); color: white;">
                <div class="label" style="color: rgba(255,255,255,0.9);">THIS PERIOD'S EARNINGS</div>
                <div class="amount" style="color: white; font-size: 48px;">₦{payout_amount:,.2f}</div>
                <div style="margin-top: 10px; opacity: 0.9;">{referral.total_referrals} completed referrals</div>
            </div>
            
            <div class="stat-box">
                <div class="label">Period</div>
                <div class="value" style="font-size: 16px;">{period_start_str} - {period_end_str}</div>
            </div>
            
            <div class="stat-box">
                <div class="label">Your Referral Code</div>
                <div class="code">{referral.referral_code}</div>
            </div>
            
            <h3 style="margin-top: 30px; color: #333;">Lifetime Statistics</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="stat-box">
                    <div class="label">Total Referrals</div>
                    <div class="value">{referral.lifetime_referrals}</div>
                </div>
                
                <div class="stat-box">
                    <div class="label">Lifetime Earnings</div>
                    <div class="value">₦{referral.lifetime_earnings:,.2f}</div>
                </div>
            </div>
            
            <div class="stat-box">
                <div class="label">Total Paid Out</div>
                <div class="value">₦{referral.total_paid_out:,.2f}</div>
            </div>
            
            <p style="margin-top: 30px;">Your payout will be processed shortly. Keep sharing your referral code to earn more!</p>
            
            <p>Thank you for being a valued member of our referral program.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    """
    
    try:
        # Create email message with both text and HTML versions
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[referral.email]
        )
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        return True
    except Exception as e:
        print(f"Error sending email to {referral.email}: {str(e)}")
        return False


def send_bulk_payout_notifications(referrals_with_payouts):
    """
    Send payout notification emails to multiple referrals
    
    Args:
        referrals_with_payouts: List of tuples (referral, payout_amount, period_start, period_end)
    
    Returns:
        Dictionary with success count and failed emails
    """
    success_count = 0
    failed_emails = []
    
    for referral, payout_amount, period_start, period_end in referrals_with_payouts:
        if payout_amount > 0:  # Only send if there's an amount to pay
            success = send_payout_notification_email(
                referral, 
                payout_amount, 
                period_start, 
                period_end
            )
            
            if success:
                success_count += 1
            else:
                failed_emails.append(referral.email)
    
    return {
        'success_count': success_count,
        'failed_emails': failed_emails,
        'total_processed': len(referrals_with_payouts)
    }