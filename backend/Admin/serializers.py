# serializers.py
from rest_framework import serializers
from User.models import Picker, StudentPicker, User
from .models import Contact
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'profile_pic', 'state', 'is_verified']

class PickerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    picker_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Picker
        fields = ['id', 'user', 'fleet_type', 'is_available', 'total_deliveries', 
                  'rating', 'bank_name', 'account_number', 'account_name', 'picker_type']
    
    def get_picker_type(self, obj):
        return 'picker'

class StudentPickerSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    picker_type = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentPicker
        fields = ['id', 'user', 'hostel_name', 'room_number', 'is_available', 
                  'total_deliveries', 'rating', 'bank_name', 'account_number', 
                  'account_name', 'picker_type']
    
    def get_picker_type(self, obj):
        return 'student_picker'
    

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']
        read_only_fields = ['created_at']