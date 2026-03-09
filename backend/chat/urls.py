# chat/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.ChatListAPIView.as_view(), name='chat_list_api'),
    # path('chat/application/', views.ServiceApplicationsAPIView.as_view(), name='service_applications_api'),
    path('chat/start/<int:application_id>/', views.StartConversationAPIView.as_view(), name='start_conversation_api'),
    path('chat/<int:conversation_id>/', views.ConversationDetailAPIView.as_view(), name='conversation_detail_api'),
    path('chat/<int:conversation_id>/send/', views.SendMessageAPIView.as_view(), name='send_message_api'),
    path('chat/<int:conversation_id>/messages/', views.GetMessagesAPIView.as_view(), name='get_messages_api'),
    path('chat/unread-count/', views.UnreadCountAPIView.as_view(), name='unread_count_api'),
]