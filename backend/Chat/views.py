from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Exists, OuterRef
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse
import logging

from .models import (
    ServiceApplication, Conversation, Message, MessageReadStatus
)
from .serializers import (
    MessageSerializer, ConversationListSerializer,
    ServiceApplicationSerializer, SendMessageRequestSerializer,
    UnreadCountResponseSerializer
)

logger = logging.getLogger(__name__)


class ChatListAPIView(APIView):
    """
    Chat List API
    
    Retrieve all conversations for the current user with unread message counts.
    Returns different data based on whether the user is a vendor or student.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Retrieve all conversations for the current user"
    )
    def get(self, request):
        try:
            user = request.user
            
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required',
                    'conversations': [],
                    'total_unread': 0,
                    'user_type': 'student'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            is_vendor = hasattr(user, 'vendor_profile') and user.vendor_profile
            
            if is_vendor:
                conversations_query = Conversation.objects.filter(vendor=user.vendor_profile)
                unread_filter = Q(messages__sender_type='user', messages__is_read=False)
            else:
                conversations_query = Conversation.objects.filter(user=user)
                unread_filter = Q(messages__sender_type='vendor', messages__is_read=False)
            
            conversations_data = conversations_query.select_related(
                'user', 'vendor', 'service_application'
            ).annotate(
                unread_count=Count('messages', filter=unread_filter)
            ).order_by('-updated_at')
            
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
            
            serializer = ConversationListSerializer(conversations, many=True)
            total_unread = sum(conv['unread_count'] for conv in conversations)
            
            return Response({
                'conversations': serializer.data,
                'total_unread': total_unread,
                'user_type': 'vendor' if is_vendor else 'student'
            })
            
        except Exception as e:
            logger.error(f"Error in ChatListAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'conversations': [],
                'total_unread': 0,
                'user_type': 'student',
                'error': 'Unable to fetch conversations at this time'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ServiceApplicationsAPIView(APIView):
    """
    Service Applications API
    
    Retrieve service applications for starting conversations.
    Vendors see applications for their services, students see their applications.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Retrieve service applications for starting conversations"
    )
    def get(self, request):
        try:
            user = request.user
            
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
                    logger.error(f"Error fetching vendor applications: {e}")
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
                    logger.error(f"Error fetching user applications: {e}")
            
            serializer = ServiceApplicationSerializer(applications, many=True)
            
            return Response({
                'applications': serializer.data,
                'user_type': 'vendor' if hasattr(user, 'vendor_profile') and user.vendor_profile else 'student'
            })
            
        except Exception as e:
            logger.error(f"Error in ServiceApplicationsAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'applications': [],
                'user_type': 'student',
                'error': 'Unable to fetch applications at this time'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StartConversationAPIView(APIView):
    """
    Start Conversation API
    
    Start a new conversation from a service application.
    Both vendors and students can initiate conversations through this endpoint.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Start a new conversation from a service application"
    )
    def post(self, request, application_id):
        try:
            application = get_object_or_404(ServiceApplication, id=application_id)
            user = request.user
            
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
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
            logger.error(f"Error in StartConversationAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to start conversation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConversationDetailAPIView(APIView):
    """
    Conversation Detail API
    
    Retrieve detailed conversation information including all messages.
    Automatically marks messages as read for the current user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Retrieve conversation details and messages"
    )
    def get(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
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
            
            message_serializer = MessageSerializer(messages_list, many=True)
            
            return Response({
                'conversation_id': conversation.id,
                'messages': message_serializer.data,
                'participant_type': participant_type,
                'other_participant_name': other_participant_name,
                'service_name': conversation.service_name or 'General Inquiry'
            })
            
        except Exception as e:
            logger.error(f"Error in ConversationDetailAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to load conversation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SendMessageAPIView(APIView):
    """
    Send Message API
    
    Send a message in a conversation.
    Both vendors and students can send messages.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=SendMessageRequestSerializer,
        description="Send a message in a conversation"
    )
    def post(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
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
            
            request_serializer = SendMessageRequestSerializer(data=request.data)
            if not request_serializer.is_valid():
                return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            content = request_serializer.validated_data['content'].strip()
            
            message = Message.objects.create(
                conversation=conversation,
                content=content,
                sender_type=sender_type,
                sender_user=sender_user,
                sender_vendor=sender_vendor
            )
            
            message_serializer = MessageSerializer(message)
            
            return Response({
                'success': True,
                'message': message_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error in SendMessageAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to send message'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetMessagesAPIView(APIView):
    """
    Get Messages API
    
    Retrieve all messages for a specific conversation.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        description="Retrieve all messages for a conversation"
    )
    def get(self, request, conversation_id):
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            user = request.user
            
            if not user or user.is_anonymous:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
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
            logger.error(f"Error in GetMessagesAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'error': 'Failed to load messages'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UnreadCountAPIView(APIView):
    """
    Unread Count API
    
    Get the total count of unread messages for the current user.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        responses=UnreadCountResponseSerializer,
        description="Get total unread message count"
    )
    def get(self, request):
        try:
            user = request.user
            
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
            logger.error(f"Error in UnreadCountAPIView: {str(e)}", exc_info=True)
            
            return Response({
                'unread_count': 0,
                'error': 'Failed to get unread count'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)