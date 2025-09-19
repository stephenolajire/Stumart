from rest_framework import serializers
from User.models import Company, Area, CompanyRider
from django.utils import timezone
from django.db.models import Sum


class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ["id", "name"]


class CompanyAreaSerializer(serializers.ModelSerializer):
    delivery_areas = AreaSerializer(many=True, read_only=True)

    class Meta:
        model = Company
        fields = ["id", "user", "delivery_areas"]

class CompanyRiderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyRider
        fields = [
            "name", "email", "phone", "location",
        ]

    def validate_email(self, value):
        if CompanyRider.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone(self, value):
        if not value.startswith("+") or not value[1:].replace(" ", "").isdigit():
            raise serializers.ValidationError("Phone number must start with '+' and contain digits only.")
        if CompanyRider.objects.filter(phone=value).exists():
            raise serializers.ValidationError("This phone number is already registered.")
        return value
    
    def validate_location(self, value):
        if not Area.objects.filter(name=value).exists():
            raise serializers.ValidationError("Location must be a valid area.")
        return value
    
class CompanyRiderSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.user.email', read_only=True)
    monthly_earnings = serializers.SerializerMethodField()
    last_active_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyRider
        fields = [
            'id', 'name', 'email', 'phone', 'status', 'location',
            'rating', 'completed_deliveries', 'join_date', 'last_active',
            'total_earnings', 'monthly_earnings', 'company_name', 'last_active_display'
        ]

    def get_monthly_earnings(self, obj):
        """Calculate monthly earnings for the rider"""
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # Replace this with your actual monthly earnings calculation
        # Example: if you have a DeliveryEarning model
        # monthly_earnings = DeliveryEarning.objects.filter(
        #     rider=obj,
        #     created_at__month=current_month,
        #     created_at__year=current_year
        # ).aggregate(total=Sum('amount'))['total'] or 0
        
        # For now, returning a calculated value based on total earnings
        # You should replace this with actual monthly calculation
        monthly_earnings = float(obj.total_earnings) * 0.1  # Example calculation
        return round(monthly_earnings, 2)

    def get_last_active_display(self, obj):
        """Get formatted last active time"""
        return obj.get_last_active_display()


