import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, Clock, CheckCircle2 } from "lucide-react";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import styles from "./css/VendorMessages.module.css";

const Message = () => {
  const [conversations, setConversations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState("student");
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeTab, setActiveTab] = useState("conversations");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await api.get("chats/");
      setConversations(response.data.conversations);
      setTotalUnread(response.data.total_unread);
      setUserType(response.data.user_type);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    try {
      const response = await api.get("application/");
      setApplications(response.data.applications);
    } catch (err) {
      if (err.response?.status === 401) {
        // Redirect to login with return URL
        navigate("/login?next=/messages");
      } else {
        setError("Failed to load applications");
        console.error(err);
      }
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`chats/${conversationId}/`);

      // Using axios response format (response.data)
      const data = response.data;
      setMessages(data.messages);
      setActiveConversation({
        id: conversationId,
        otherParticipant: data.other_participant_name,
        serviceName: data.service_name,
        participantType: data.participant_type,
      });
    } catch (err) {
      setError("Failed to load messages");
      console.error(err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await api.post(`chats/${activeConversation.id}/send/`, {
        content: newMessage.trim(), // Include the message content in the request body
      });

      // Using axios response format (response.data)
      const data = response.data;
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");

      // Refresh conversations to update unread counts
      fetchConversations();
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Start conversation from application
  const startConversation = async (applicationId) => {
    try {
      const response = await api.post(`chats/start/${applicationId}/`);

      // Using axios response format (response.data)
      const data = response.data;

      // Refresh conversations and switch to conversations tab
      await fetchConversations();
      setActiveTab("conversations");

      // Select the new/existing conversation
      fetchMessages(data.conversation_id);
    } catch (err) {
      setError("Failed to start conversation");
      console.error(err);
    }
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
  }, [messages]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchApplications()]);
      setLoading(false);
    };

    loadData();
  }, []);

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

  if (loading) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.loading}>
          <MessageCircle size={24} />
          <span style={{ marginLeft: "1rem" }}>Loading chat...</span>
        </div>
      </div>
    );
  }

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
                  onClick={() => fetchMessages(conv.conversation_id)}
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
                        Click to start chat
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
              {messages.map((message) => {
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
              })}
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
                    sendingMessage || !newMessage.trim()
                      ? styles.sendButtonDisabled
                      : ""
                  }`}
                  onClick={sendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
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
          {error}
          <button
            style={{
              background: "none",
              border: "none",
              color: "white",
              marginLeft: "1rem",
              cursor: "pointer",
            }}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
