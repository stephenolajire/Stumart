from django.db import models
from user.models import User, Vendor
from stumart.models import ServiceApplication

class Conversation(models.Model):
    """Unified conversation model for user-vendor messaging"""
    
    # Participants
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='user_conversations'
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        related_name='vendor_conversations'
    )
    
    # Optional: Link to service application if conversation started from an application
    service_application = models.ForeignKey(
        ServiceApplication, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='conversations'
    )
    
    # Optional: Link to specific service/product if needed
    service_id = models.IntegerField(null=True, blank=True)
    service_name = models.CharField(max_length=200, null=True, blank=True)
    
    # Conversation metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Last message info (for quick display in conversation list)
    last_message = models.TextField(blank=True, null=True)
    last_message_sender = models.CharField(
        max_length=10, 
        choices=[('user', 'User'), ('vendor', 'Vendor')],
        null=True, 
        blank=True
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('user', 'vendor', 'service_application')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['vendor', '-updated_at']),
        ]
    
    def __str__(self):
        return f"Conversation between {self.user.email} and {self.vendor.business_name}"
    
    @property
    def get_other_participant(self, current_user):
        """Get the other participant in the conversation"""
        if hasattr(current_user, 'vendor_profile'):
            return self.user
        else:
            return self.vendor


class Message(models.Model):
    """Unified message model for both user and vendor messages"""
    
    SENDER_CHOICES = [
        ('user', 'User'),
        ('vendor', 'Vendor'),
    ]
    
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    
    # Message content
    content = models.TextField()
    
    # Sender information
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    sender_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='sent_messages'
    )
    sender_vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='sent_messages'
    )
    
    # Message metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional: Message type for future extensions (text, image, file, etc.)
    message_type = models.CharField(
        max_length=20, 
        choices=[('text', 'Text'), ('image', 'Image'), ('file', 'File')],
        default='text'
    )
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender_type', 'created_at']),
        ]
    
    def __str__(self):
        sender_name = self.get_sender_name()
        return f"Message from {sender_name}: {self.content[:50]}..."
    
    def get_sender_name(self):
        """Get the display name of the message sender"""
        if self.sender_type == 'user' and self.sender_user:
            return f"{self.sender_user.first_name} {self.sender_user.last_name}".strip()
        elif self.sender_type == 'vendor' and self.sender_vendor:
            return self.sender_vendor.business_name
        return "Unknown"
    
    def save(self, *args, **kwargs):
        # Ensure sender consistency
        if self.sender_type == 'user':
            self.sender_vendor = None
        elif self.sender_type == 'vendor':
            self.sender_user = None
        
        # Update conversation's last message info
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            self.conversation.last_message = self.content
            self.conversation.last_message_sender = self.sender_type
            self.conversation.last_message_at = self.created_at
            self.conversation.updated_at = self.created_at
            self.conversation.save(update_fields=[
                'last_message', 
                'last_message_sender', 
                'last_message_at', 
                'updated_at'
            ])


class MessageReadStatus(models.Model):
    """Track read status for each participant"""
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='read_statuses'
    )
    
    # Reader information
    reader_type = models.CharField(
        max_length=10, 
        choices=[('user', 'User'), ('vendor', 'Vendor')]
    )
    reader_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='message_read_statuses'
    )
    reader_vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='message_read_statuses'
    )
    
    # Last read message and timestamp
    last_read_message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    last_read_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('conversation', 'reader_type', 'reader_user', 'reader_vendor')
    
    def __str__(self):
        reader_name = self.get_reader_name()
        return f"{reader_name} read status for conversation {self.conversation.id}"
    
    def get_reader_name(self):
        """Get the display name of the reader"""
        if self.reader_type == 'user' and self.reader_user:
            return f"{self.reader_user.first_name} {self.reader_user.last_name}".strip()
        elif self.reader_type == 'vendor' and self.reader_vendor:
            return self.reader_vendor.business_name
        return "Unknown"