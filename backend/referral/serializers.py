from rest_framework import serializers
from .models import Referral, PayoutHistory


class ReferralCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new referral
    """
    class Meta:
        model = Referral
        fields = ['first_name', 'last_name', 'email']
    
    def validate_email(self, value):
        """
        Check that email is unique
        """
        if Referral.objects.filter(email=value).exists():
            raise serializers.ValidationError("A referral with this email already exists.")
        return value
    
    def create(self, validated_data):
        """
        Create referral with auto-generated code
        """
        referral = Referral.objects.create(**validated_data)
        return referral


class PayoutHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for payout history
    """
    class Meta:
        model = PayoutHistory
        fields = [
            'id',
            'amount',
            'referral_count',
            'payout_date',
            'period_start',
            'period_end',
            'email_sent',
            'email_sent_at',
            'notes'
        ]


class ReferralListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing referrals in admin view
    """
    name = serializers.SerializerMethodField()
    pending_payout = serializers.SerializerMethodField()
    total_order_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Referral
        fields = [
            'id',
            'name',
            'first_name',
            'last_name',
            'email',
            'referral_code',
            'total_referrals',
            'total_earnings',
            'pending_payout',
            'lifetime_referrals',
            'lifetime_earnings',
            'total_order_value',
            'total_paid_out',
            'last_payout_amount',
            'last_payout_date',
            'last_reset_date',
            'is_active',
            'created_at'
        ]
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_pending_payout(self, obj):
        """Amount pending to be paid out (current earnings)"""
        return float(obj.total_earnings)
    
    def get_total_order_value(self, obj):
        """Total value of all lifetime orders (lifetime_referrals * 200)"""
        return float(obj.lifetime_earnings)


class ReferralSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving referral information
    """
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Referral
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'referral_code',
            'total_referrals',
            'total_earnings',
            'lifetime_referrals',
            'lifetime_earnings',
            'total_paid_out',
            'last_payout_amount',
            'last_payout_date',
            'last_reset_date',
            'is_active',
            'created_at',
            'stats'
        ]
        read_only_fields = [
            'id',
            'referral_code',
            'total_referrals',
            'total_earnings',
            'lifetime_referrals',
            'lifetime_earnings',
            'total_paid_out',
            'last_payout_amount',
            'last_payout_date',
            'last_reset_date',
            'created_at'
        ]
    
    def get_stats(self, obj):
        """
        Get comprehensive statistics
        """
        return obj.get_stats()


class ReferralDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer with order information and payout history
    """
    stats = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()
    payout_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Referral
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'referral_code',
            'total_referrals',
            'total_earnings',
            'lifetime_referrals',
            'lifetime_earnings',
            'total_paid_out',
            'last_payout_amount',
            'last_payout_date',
            'last_reset_date',
            'is_active',
            'created_at',
            'updated_at',
            'stats',
            'recent_orders',
            'payout_history'
        ]
    
    def get_stats(self, obj):
        """
        Get comprehensive statistics
        """
        return obj.get_stats()
    
    def get_recent_orders(self, obj):
        """
        Get recent orders (last 10 from current period)
        """
        orders = obj.get_current_period_orders()[:10]
        
        return [{
            'order_number': order.order_number,
            'total': float(order.total),
            'status': order.order_status,
            'created_at': order.created_at,
            'customer_name': f"{order.first_name} {order.last_name}"
        } for order in orders]
    
    def get_payout_history(self, obj):
        """
        Get last 5 payout records
        """
        payouts = PayoutHistory.objects.filter(referral=obj)[:5]
        return PayoutHistorySerializer(payouts, many=True).data


class ReferralValidateSerializer(serializers.Serializer):
    """
    Serializer for validating a referral code
    """
    referral_code = serializers.CharField(max_length=10)
    
    def validate_referral_code(self, value):
        """
        Check if referral code exists and is active
        """
        value = value.upper()
        try:
            referral = Referral.objects.get(referral_code=value, is_active=True)
        except Referral.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive referral code.")
        
        return value