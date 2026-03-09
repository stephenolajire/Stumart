from rest_framework import serializers
from .models import Message, Conversation, ServiceApplication


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for individual messages"""
    sender_name = serializers.CharField(source='get_sender_name', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender_type', 'sender_name', 'created_at', 'is_read']


class ConversationListSerializer(serializers.Serializer):
    """Serializer for conversation list response"""
    conversation_id = serializers.IntegerField(source='conversation.id')
    other_participant_name = serializers.CharField()
    service_name = serializers.CharField()
    unread_count = serializers.IntegerField()
    updated_at = serializers.DateTimeField(source='conversation.updated_at', format='%Y-%m-%d %H:%M:%S')


class ChatListResponseSerializer(serializers.Serializer):
    """Response serializer for chat list"""
    conversations = serializers.JSONField()
    total_unread = serializers.IntegerField()
    user_type = serializers.CharField()


class ServiceApplicationSerializer(serializers.Serializer):
    """Serializer for service applications"""
    application_id = serializers.IntegerField(source='application.id')
    participant_name = serializers.SerializerMethodField()
    has_conversation = serializers.BooleanField()
    can_start_chat = serializers.BooleanField()
    status = serializers.CharField(source='application.status')
    created_at = serializers.DateTimeField(source='application.created_at', format='%Y-%m-%d %H:%M:%S')
    description = serializers.CharField(source='application.description')
    
    def get_participant_name(self, obj):
        return obj.get('applicant_name') or obj.get('vendor_name')


class ServiceApplicationsResponseSerializer(serializers.Serializer):
    """Response serializer for service applications"""
    applications = serializers.JSONField()
    user_type = serializers.CharField()


class StartConversationRequestSerializer(serializers.Serializer):
    """Request serializer for starting a conversation"""
    application_id = serializers.IntegerField()


class StartConversationResponseSerializer(serializers.Serializer):
    """Response serializer for starting a conversation"""
    conversation_id = serializers.IntegerField()
    created = serializers.BooleanField()
    message = serializers.CharField()


class ConversationDetailResponseSerializer(serializers.Serializer):
    """Response serializer for conversation details"""
    conversation_id = serializers.IntegerField()
    messages = serializers.JSONField()
    participant_type = serializers.CharField()
    other_participant_name = serializers.CharField()
    service_name = serializers.CharField()


class SendMessageRequestSerializer(serializers.Serializer):
    """Request serializer for sending a message"""
    content = serializers.CharField(required=True, allow_blank=False)


class SendMessageResponseSerializer(serializers.Serializer):
    """Response serializer for sending a message"""
    success = serializers.BooleanField()
    message = serializers.JSONField()


class UnreadCountResponseSerializer(serializers.Serializer):
    """Response serializer for unread count"""
    unread_count = serializers.IntegerField()


class ErrorResponseSerializer(serializers.Serializer):
    """Generic error response"""
    error = serializers.CharField()