import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, Clock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import styles from "../css/Message.module.css";

const Message = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [userType, setUserType] = useState("student");
  const [activeTab, setActiveTab] = useState("conversations");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch conversations with TanStack Query
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await api.get("chats/");
      return response.data;
    },
    onSuccess: (data) => {
      setUserType(data.user_type);
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every minute to get new messages
  });

  // Fetch applications with TanStack Query
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const response = await api.get("application/");
      return response.data;
    },
    onError: (err) => {
      if (err.response?.status === 401) {
        navigate("/login?next=/messages");
      }
    },
    staleTime: 300000, // Consider applications fresh for 5 minutes
  });

  // Fetch messages for active conversation
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: async () => {
      if (!activeConversation?.id) return null;
      const response = await api.get(`chats/${activeConversation.id}/`);
      return response.data;
    },
    enabled: !!activeConversation?.id,
    staleTime: 10000, // Consider messages fresh for 10 seconds
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const response = await api.post(`chats/${activeConversation.id}/send/`, {
        content: messageData.content.trim(),
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Optimistically update the messages
      queryClient.setQueryData(
        ["messages", activeConversation.id],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [...oldData.messages, data.message],
          };
        }
      );

      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (applicationId) => {
      const response = await api.post(`chats/start/${applicationId}/`);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate conversations to get the new conversation
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveTab("conversations");

      // Set the active conversation
      setActiveConversation({
        id: data.conversation_id,
        otherParticipant: "",
        serviceName: "",
        participantType: userType,
      });
    },
    onError: (error) => {
      console.error("Failed to start conversation:", error);
    },
  });

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setActiveConversation({
      id: conversation.conversation_id,
      otherParticipant: conversation.other_participant_name,
      serviceName: conversation.service_name,
      participantType: userType,
    });
  };

  // Send message handler
  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      !activeConversation ||
      sendMessageMutation.isPending
    )
      return;

    sendMessageMutation.mutate({ content: newMessage });
  };

  // Start conversation handler
  const startConversation = (applicationId) => {
    startConversationMutation.mutate(applicationId);
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.messages]);

  // Update active conversation details when messages are loaded
  useEffect(() => {
    if (messagesData && activeConversation) {
      setActiveConversation((prev) => ({
        ...prev,
        otherParticipant: messagesData.other_participant_name,
        serviceName: messagesData.service_name,
        participantType: messagesData.participant_type,
      }));
    }
  }, [messagesData]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return styles.statusAccepted;
      case "pending":
        return styles.statusPending;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  // Loading state
  if (conversationsLoading || applicationsLoading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.loading}>
          <MessageCircle size={24} />
          <span style={{ marginLeft: "1rem" }}>Loading chat...</span>
        </div>
      </div>
    );
  }

  // Error state
  const error = conversationsError || applicationsError || messagesError;
  const conversations = conversationsData?.conversations || [];
  const applications = applicationsData?.applications || [];
  const messages = messagesData?.messages || [];
  const totalUnread = conversationsData?.total_unread || 0;

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            Messages
            {totalUnread > 0 && (
              <span
                className={styles.unreadBadge}
                style={{ marginLeft: "1rem" }}
              >
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabContainer}>
          <div
            className={`${styles.tab} ${
              activeTab === "conversations" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            Chats
          </div>
          <div
            className={`${styles.tab} ${
              activeTab === "applications" ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </div>
        </div>

        {/* Conversations List */}
        {activeTab === "conversations" && (
          <div className={styles.conversationList}>
            {conversations.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageCircle size={48} className={styles.emptyStateIcon} />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  className={`${styles.conversationItem} ${
                    activeConversation?.id === conv.conversation_id
                      ? styles.conversationItemActive
                      : ""
                  }`}
                  onClick={() => handleConversationSelect(conv)}
                >
                  <div className={styles.conversationInfo}>
                    <div className={styles.participantName}>
                      {conv.other_participant_name}
                    </div>
                    <div className={styles.conversationTime}>
                      {formatTime(conv.updated_at)}
                    </div>
                  </div>
                  <div className={styles.serviceName}>{conv.service_name}</div>
                  {conv.unread_count > 0 && (
                    <div className={styles.unreadCount}>
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Applications List */}
        {activeTab === "applications" && (
          <div className={styles.applicationsList}>
            {applications.length === 0 ? (
              <div className={styles.emptyState}>
                <User size={48} className={styles.emptyStateIcon} />
                <p>No applications yet</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.application_id}
                  className={styles.applicationItem}
                  onClick={() =>
                    !app.has_conversation &&
                    app.can_start_chat &&
                    startConversation(app.application_id)
                  }
                >
                  <div className={styles.applicationName}>
                    {app.participant_name}
                  </div>
                  <div className={styles.applicationDescription}>
                    {app.description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className={`${styles.applicationStatus} ${getStatusStyle(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                    {app.has_conversation ? (
                      <span
                        style={{ color: "var(--success)", fontSize: "1.2rem" }}
                      >
                        <CheckCircle2
                          size={16}
                          style={{
                            verticalAlign: "middle",
                            marginRight: "0.5rem",
                          }}
                        />
                        Chat Active
                      </span>
                    ) : app.can_start_chat ? (
                      <span
                        style={{
                          color: "var(--primary-500)",
                          fontSize: "1.2rem",
                        }}
                      >
                        {startConversationMutation.isPending
                          ? "Starting..."
                          : "Click to start chat"}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "1.2rem",
                        }}
                      >
                        Cannot start chat
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainChat}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div>
                <div className={styles.chatHeaderTitle}>
                  {activeConversation.otherParticipant}
                </div>
                <div className={styles.chatHeaderSubtitle}>
                  {activeConversation.serviceName}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messagesLoading ? (
                <div className={styles.loading}>
                  <MessageCircle size={24} />
                  <span style={{ marginLeft: "1rem" }}>
                    Loading messages...
                  </span>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn =
                    activeConversation.participantType === message.sender_type;
                  return (
                    <div
                      key={message.id}
                      className={`${styles.message} ${
                        isOwn ? styles.messageOwn : styles.messageOther
                      }`}
                    >
                      <div>{message.content}</div>
                      <div className={styles.messageInfo}>
                        {message.sender_name} • {formatTime(message.created_at)}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <textarea
                  className={styles.messageInput}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                />
                <button
                  className={`${styles.sendButton} ${
                    sendMessageMutation.isPending || !newMessage.trim()
                      ? styles.sendButtonDisabled
                      : ""
                  }`}
                  onClick={sendMessage}
                  disabled={sendMessageMutation.isPending || !newMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <MessageCircle size={64} className={styles.emptyStateIcon} />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          {error.message || "An error occurred"}
          <button
            style={{
              background: "none",
              border: "none",
              color: "white",
              marginLeft: "1rem",
              cursor: "pointer",
            }}
            onClick={() => queryClient.invalidateQueries()}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
