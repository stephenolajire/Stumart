# chat/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max, Exists, OuterRef
from django.utils import timezone
from rest_framework import serializers
from django.http import JsonResponse

from Stumart.models import (
    ServiceApplication, Conversation, Message, MessageReadStatus
)
from User.models import User, Vendor


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='get_sender_name', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender_type', 'sender_name', 'created_at', 'is_read']


class ConversationListSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(source='conversation.id')
    other_participant_name = serializers.CharField()
    service_name = serializers.CharField()
    unread_count = serializers.IntegerField()
    updated_at = serializers.DateTimeField(source='conversation.updated_at', format='%Y-%m-%d %H:%M:%S')


class ServiceApplicationSerializer(serializers.Serializer):
    application_id = serializers.IntegerField(source='application.id')
    participant_name = serializers.SerializerMethodField()
    has_conversation = serializers.BooleanField()
    can_start_chat = serializers.BooleanField()
    status = serializers.CharField(source='application.status')
    created_at = serializers.DateTimeField(source='application.created_at', format='%Y-%m-%d %H:%M:%S')
    description = serializers.CharField(source='application.description')
    
    def get_participant_name(self, obj):
        return obj.get('applicant_name') or obj.get('vendor_name')


class ChatListAPIView(APIView):
    """API endpoint to list all conversations for the current user"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required',
                    'conversations': [],
                    'total_unread': 0,
                    'user_type': 'student'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Determine user type
            is_vendor = hasattr(user, 'vendor_profile') and user.vendor_profile
            
            # Build base query
            if is_vendor:
                conversations_query = Conversation.objects.filter(vendor=user.vendor_profile)
                # Fixed: Changed 'message' to 'messages' to match the model field
                unread_filter = Q(messages__sender_type='user', messages__is_read=False)
            else:
                conversations_query = Conversation.objects.filter(user=user)
                # Fixed: Changed 'message' to 'messages' to match the model field
                unread_filter = Q(messages__sender_type='vendor', messages__is_read=False)
            
            # Execute query with annotations
            conversations_data = conversations_query.select_related(
                'user', 'vendor', 'service_application'
            ).annotate(
                unread_count=Count('messages', filter=unread_filter)
            ).order_by('-updated_at')
            
            # Process results
            conversations = []
            for conv in conversations_data:
                if is_vendor:
                    other_participant_name = f"{conv.user.first_name} {conv.user.last_name}".strip()
                else:
                    other_participant_name = conv.vendor.business_name or 'Unknown Vendor'
                
                conversations.append({
                    'conversation': conv,
                    'other_participant_name': other_participant_name,
                    'service_name': conv.service_name or 'General Inquiry',
                    'unread_count': conv.unread_count
                })
            
            # Serialize the data
            serializer = ConversationListSerializer(conversations, many=True)
            
            # Calculate total unread count
            total_unread = sum(conv['unread_count'] for conv in conversations)
            
            return Response({
                'conversations': serializer.data,
                'total_unread': total_unread,
                'user_type': 'vendor' if is_vendor else 'student'
            })
            
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ChatListAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'conversations': [],
                'total_unread': 0,
                'user_type': 'student',
                'error': 'Unable to fetch conversations at this time'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ServiceApplicationsAPIView(APIView):
    """API endpoint to show service applications for starting conversations"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required',
                    'applications': [],
                    'user_type': 'student'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            applications = []
            
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                # Vendor view - show applications for their services
                try:
                    vendor_applications = ServiceApplication.objects.filter(
                        service=user.vendor_profile
                    ).select_related('user').annotate(
                        has_conversation=Exists(
                            Conversation.objects.filter(
                                vendor=user.vendor_profile,
                                service_application=OuterRef('pk')
                            )
                        )
                    ).order_by('-created_at')
                    
                    for app in vendor_applications:
                        applications.append({
                            'application': app,
                            'applicant_name': app.name,
                            'has_conversation': app.has_conversation,
                            'can_start_chat': True
                        })
                except Exception as e:
                    # Log the error but don't fail the request
                    print(f"Error fetching vendor applications: {e}")
            else:
                # Student view - show their applications
                try:
                    user_applications = ServiceApplication.objects.filter(
                        user=user
                    ).select_related('service').annotate(
                        has_conversation=Exists(
                            Conversation.objects.filter(
                                user=user,
                                service_application=OuterRef('pk')
                            )
                        )
                    ).order_by('-created_at')
                    
                    for app in user_applications:
                        applications.append({
                            'application': app,
                            'vendor_name': app.service.business_name,
                            'has_conversation': app.has_conversation,
                            'can_start_chat': app.status in ['accepted', 'pending']
                        })
                except Exception as e:
                    # Log the error but don't fail the request
                    print(f"Error fetching user applications: {e}")
            
            serializer = ServiceApplicationSerializer(applications, many=True)
            
            return Response({
                'applications': serializer.data,
                'user_type': 'vendor' if hasattr(user, 'vendor_profile') and user.vendor_profile else 'student'
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ServiceApplicationsAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'applications': [],
                'user_type': 'student',
                'error': 'Unable to fetch applications at this time'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StartConversationAPIView(APIView):
    """API endpoint to start a new conversation from a service application"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, application_id):
        try:
            application = get_object_or_404(ServiceApplication, id=application_id)
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check permissions
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                if application.service != user.vendor_profile:
                    return Response(
                        {'error': "You don't have permission to start this conversation."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                other_user = application.user
                vendor = user.vendor_profile
            else:
                if application.user != user:
                    return Response(
                        {'error': "You don't have permission to start this conversation."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                other_user = user
                vendor = application.service
            
            # Check if conversation already exists
            conversation, created = Conversation.objects.get_or_create(
                user=other_user if not (hasattr(user, 'vendor_profile') and user.vendor_profile) else application.user,
                vendor=vendor,
                service_application=application,
                defaults={
                    'service_name': f"{vendor.business_name} - {application.description[:50]}..."
                }
            )
            
            return Response({
                'conversation_id': conversation.id,
                'created': created,
                'message': 'Conversation started successfully!' if created else 'Conversation already exists'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in StartConversationAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to start conversation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConversationDetailAPIView(APIView):
    """API endpoint for individual conversation details and messages"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check permissions and determine participant type
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                if conversation.vendor != user.vendor_profile:
                    return Response(
                        {'error': "You don't have permission to view this conversation."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                participant_type = 'vendor'
                other_participant_name = f"{conversation.user.first_name} {conversation.user.last_name}"
            else:
                if conversation.user != user:
                    return Response(
                        {'error': "You don't have permission to view this conversation."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                participant_type = 'user'
                other_participant_name = conversation.vendor.business_name
            
            # Get messages
            messages_list = Message.objects.filter(
                conversation=conversation
            ).select_related('sender_user', 'sender_vendor').order_by('created_at')
            
            # Mark messages as read
            opposite_sender_type = 'vendor' if participant_type == 'user' else 'user'
            Message.objects.filter(
                conversation=conversation,
                sender_type=opposite_sender_type,
                is_read=False
            ).update(is_read=True, read_at=timezone.now())
            
            # Update read status
            if participant_type == 'user':
                read_status, created = MessageReadStatus.objects.get_or_create(
                    conversation=conversation,
                    reader_type='user',
                    reader_user=user,
                    defaults={'last_read_message': messages_list.last() if messages_list else None}
                )
            else:
                read_status, created = MessageReadStatus.objects.get_or_create(
                    conversation=conversation,
                    reader_type='vendor',
                    reader_vendor=user.vendor_profile,
                    defaults={'last_read_message': messages_list.last() if messages_list else None}
                )
            
            if not created and messages_list:
                read_status.last_read_message = messages_list.last()
                read_status.save()
            
            # Serialize messages
            message_serializer = MessageSerializer(messages_list, many=True)
            
            return Response({
                'conversation_id': conversation.id,
                'messages': message_serializer.data,
                'participant_type': participant_type,
                'other_participant_name': other_participant_name,
                'service_name': conversation.service_name or 'General Inquiry'
            })
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in ConversationDetailAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to load conversation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendMessageAPIView(APIView):
    """API endpoint to send a message"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check permissions
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                if conversation.vendor != user.vendor_profile:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                sender_type = 'vendor'
                sender_user = None
                sender_vendor = user.vendor_profile
            else:
                if conversation.user != user:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                sender_type = 'user'
                sender_user = user
                sender_vendor = None
            
            content = request.data.get('content', '').strip()
            
            if not content:
                return Response(
                    {'error': 'Message content is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                content=content,
                sender_type=sender_type,
                sender_user=sender_user,
                sender_vendor=sender_vendor
            )
            
            # Serialize the message
            serializer = MessageSerializer(message)
            
            return Response({
                'success': True,
                'message': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in SendMessageAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to send message'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetMessagesAPIView(APIView):
    """API endpoint to get messages for a conversation"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check permissions
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                if conversation.vendor != user.vendor_profile:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                if conversation.user != user:
                    return Response(
                        {'error': 'Permission denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            messages_list = Message.objects.filter(
                conversation=conversation
            ).select_related('sender_user', 'sender_vendor').order_by('created_at')
            
            serializer = MessageSerializer(messages_list, many=True)
            
            return Response({'messages': serializer.data})
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in GetMessagesAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to load messages'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnreadCountAPIView(APIView):
    """API endpoint to get unread message count"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Check if user is authenticated
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required',
                    'unread_count': 0
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if hasattr(user, 'vendor_profile') and user.vendor_profile:
                unread_count = Message.objects.filter(
                    conversation__vendor=user.vendor_profile,
                    sender_type='user',
                    is_read=False
                ).count()
            else:
                unread_count = Message.objects.filter(
                    conversation__user=user,
                    sender_type='vendor',
                    is_read=False
                ).count()
            
            return Response({'unread_count': unread_count})
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in UnreadCountAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'unread_count': 0,
                'error': 'Failed to get unread count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)