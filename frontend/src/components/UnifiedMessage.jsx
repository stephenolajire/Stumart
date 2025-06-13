import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../constant/api";
import styles from "../css/UnifiedMessages.module.css";

const UnifiedMessages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [userType, setUserType] = useState("user"); // 'user' or 'vendor'
  const [availableContacts, setAvailableContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Get parameters from URL for creating new conversations
  const contactId = searchParams.get("contactId"); // user_id for vendor, vendor_id for user
  const serviceApplicationId = searchParams.get("serviceApplicationId");
  const serviceId = searchParams.get("serviceId");
  const serviceName = searchParams.get("serviceName");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations for current user
  const fetchConversations = async () => {
    try {
      const response = await api.get("api/conversations/");
      setConversations(response.data.conversations || []);
      setUserType(response.data.user_type);

      // If contactId is provided, find or create conversation
      if (contactId) {
        const existingConversation = response.data.conversations?.find(
          (conv) => {
            if (response.data.user_type === "vendor") {
              return conv.user_id === parseInt(contactId);
            } else {
              return conv.vendor_id === parseInt(contactId);
            }
          }
        );

        if (existingConversation) {
          setActiveConversation(existingConversation);
          fetchMessages(existingConversation.id);
        } else {
          // Create new conversation
          createNewConversation();
        }
      } else if (response.data.conversations?.length > 0) {
        // Default to first conversation if no contactId
        setActiveConversation(response.data.conversations[0]);
        fetchMessages(response.data.conversations[0].id);
      }
    } catch (err) {
      setError("Failed to fetch conversations");
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available contacts based on user type
  const fetchAvailableContacts = async () => {
    try {
      setLoadingContacts(true);
      let response;

      if (userType === "vendor") {
        // Fetch applications for vendor
        response = await api.get("vendor/received-applications");
        const applications = response.data.applications || [];

        // Get unique users from applications
        const userMap = new Map();
        applications.forEach((app) => {
          const userKey = `${app.user_id}-${app.email}`;
          if (!userMap.has(userKey)) {
            userMap.set(userKey, {
              id: app.user_id,
              name: app.name,
              email: app.email,
              phone: app.phone,
              status: app.status,
              applicationId: app.id,
              type: "user",
            });
          }
        });
        setAvailableContacts(Array.from(userMap.values()));
      } else {
        // Fetch applications for user
        response = await api.get("my-submitted-applications");
        const applications = response.data.applications || [];

        // Get unique vendors from applications
        const vendorMap = new Map();
        applications.forEach((app) => {
          const vendorKey = `${app.service}-${app.service_name}`;
          if (!vendorMap.has(vendorKey)) {
            vendorMap.set(vendorKey, {
              id: app.service,
              name: app.service_name,
              category: app.service_category,
              status: app.status,
              type: "vendor",
            });
          }
        });
        setAvailableContacts(Array.from(vendorMap.values()));
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const createNewConversation = async (contact = null) => {
    try {
      setLoading(true);

      const conversationData = {};

      if (userType === "vendor") {
        conversationData.user_id = contact?.id || contactId;
        if (contact?.applicationId || serviceApplicationId) {
          conversationData.service_application_id =
            contact?.applicationId || serviceApplicationId;
        }
      } else {
        conversationData.vendor_id = contact?.id || contactId;
        if (serviceApplicationId) {
          conversationData.service_application_id = serviceApplicationId;
        }
        if (contact?.id || serviceId) {
          conversationData.service_id = contact?.id || serviceId;
        }
        if (contact?.name || serviceName) {
          conversationData.service_name = contact?.name || serviceName;
        }
      }

      console.log("Creating conversation with data:", conversationData);

      const response = await api.post(
        "api/conversations/create/",
        conversationData
      );
      const newConversation = response.data.conversation;

      if (!newConversation || !newConversation.id) {
        throw new Error("Invalid conversation data received from API");
      }

      setActiveConversation(newConversation);
      setConversations((prev) => [newConversation, ...prev]);
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError(
        "Failed to create conversation: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await api.get(
        `api/conversations/${conversationId}/messages/`
      );
      setMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch messages");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    try {
      setSending(true);
      const messageData = {
        content: newMessage.trim(),
        conversation_id: activeConversation.id,
      };

      const response = await api.post("api/messages/send/", messageData);

      // Add the new message to the messages list
      const sentMessage = response.data.message;
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversation.id
            ? {
                ...conv,
                last_message: sentMessage.content,
                last_message_sender: sentMessage.sender_type,
                updated_at: sentMessage.created_at,
              }
            : conv
        )
      );
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const selectConversation = (conversation) => {
    console.log("Selecting conversation:", conversation);
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
    // Update URL without params when switching conversations
    navigate("/messages", { replace: true });
  };

  const startNewConversation = async (contact) => {
    console.log("Starting conversation with contact:", contact);

    if (!contact || !contact.id) {
      console.error("Invalid contact data:", contact);
      setError("Invalid contact selected");
      return;
    }

    // Check if conversation already exists with this contact
    const existingConversation = conversations.find((conv) => {
      if (userType === "vendor") {
        return conv.user_id === contact.id;
      } else {
        return conv.vendor_id === contact.id;
      }
    });

    console.log("Existing conversation found:", existingConversation);

    if (existingConversation) {
      selectConversation(existingConversation);
    } else {
      console.log("Creating new conversation...");
      await createNewConversation(contact);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "#22c55e";
      case "pending":
        return "#f59e0b";
      case "declined":
      case "rejected":
        return "#ef4444";
      case "completed":
        return "#3b82f6";
      case "cancelled":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "accepted":
        return "Accepted";
      case "pending":
        return "Pending";
      case "declined":
      case "rejected":
        return "Declined";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getParticipantName = (conversation) => {
    if (userType === "vendor") {
      return conversation.user_name || conversation.participant_name;
    } else {
      return (
        conversation.vendor_name ||
        conversation.participant_name ||
        conversation.service_name
      );
    }
  };

  const getParticipantDetails = (conversation) => {
    if (userType === "vendor") {
      return conversation.user_email || conversation.participant_email;
    } else {
      return conversation.service_category || conversation.participant_details;
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (userType) {
      fetchAvailableContacts();
    }
  }, [userType]);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>{userType === "vendor" ? "Customer Messages" : "Messages"}</h2>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {/* Existing Conversations */}
        {conversations.length > 0 && (
          <div className={styles.sidebarSection}>
            <h3 className={styles.sectionTitle}>Active Conversations</h3>
            <div className={styles.conversationsList}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`${styles.conversationItem} ${
                    activeConversation?.id === conversation.id
                      ? styles.active
                      : ""
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className={styles.conversationInfo}>
                    <h4>{getParticipantName(conversation)}</h4>
                    <p className={styles.conversationEmail}>
                      {getParticipantDetails(conversation)}
                    </p>
                    <p className={styles.lastMessage}>
                      {conversation.last_message_sender === userType
                        ? "You: "
                        : ""}
                      {conversation.last_message || "Start a conversation"}
                    </p>
                  </div>
                  <div className={styles.conversationMeta}>
                    <span className={styles.time}>
                      {formatMessageTime(
                        conversation.updated_at || conversation.created_at
                      )}
                    </span>
                    {conversation.unread_count > 0 && (
                      <span className={styles.unreadBadge}>
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Contacts */}
        <div className={styles.sidebarSection}>
          <h3 className={styles.sectionTitle}>
            {userType === "vendor"
              ? "Customer Applications"
              : "Your Applied Services"}
          </h3>
          {loadingContacts ? (
            <div className={styles.loadingServices}>
              <div className={styles.spinner}></div>
              <p>Loading contacts...</p>
            </div>
          ) : availableContacts.length === 0 ? (
            <div className={styles.noServices}>
              <p>
                {userType === "vendor"
                  ? "No applications received yet"
                  : "No services applied to yet"}
              </p>
              {userType === "user" && (
                <button
                  className={styles.browseServicesBtn}
                  onClick={() => navigate("/services")}
                >
                  Browse Services
                </button>
              )}
            </div>
          ) : (
            <div className={styles.servicesList}>
              {availableContacts.map((contact) => {
                const hasConversation = conversations.some((conv) => {
                  if (userType === "vendor") {
                    return conv.user_id === contact.id;
                  } else {
                    return conv.vendor_id === contact.id;
                  }
                });

                return (
                  <div
                    key={`${contact.id}-${contact.name}`}
                    className={`${styles.serviceItem} ${
                      hasConversation ? styles.hasConversation : ""
                    }`}
                    onClick={() => startNewConversation(contact)}
                  >
                    <div className={styles.serviceInfo}>
                      <h4>{contact.name}</h4>
                      <p className={styles.serviceCategory}>
                        {userType === "vendor"
                          ? contact.email
                          : contact.category?.replace("_", " ").toUpperCase()}
                      </p>
                      {userType === "vendor" && contact.phone && (
                        <p className={styles.contactPhone}>{contact.phone}</p>
                      )}
                    </div>
                    <div className={styles.serviceMeta}>
                      <div
                        className={styles.statusDot}
                        style={{
                          backgroundColor: getStatusColor(contact.status),
                        }}
                      ></div>
                      <span
                        className={styles.statusLabel}
                        style={{ color: getStatusColor(contact.status) }}
                      >
                        {getStatusLabel(contact.status)}
                      </span>
                      {hasConversation ? (
                        <span className={styles.activeLabel}>Active Chat</span>
                      ) : (
                        <span className={styles.startChatLabel}>
                          Start Chat
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {!activeConversation ? (
          <div className={styles.noConversation}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>Select a conversation</h3>
            <p>
              Choose a conversation from the sidebar to start chatting
              {userType === "vendor"
                ? " with customers"
                : " with service providers"}
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.serviceInfo}>
                <h3>{getParticipantName(activeConversation)}</h3>
                <span className={styles.serviceCategory}>
                  {getParticipantDetails(activeConversation)}
                </span>
              </div>
              <div className={styles.headerActions}>
                <button className={styles.infoButton}>ℹ️</button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesContainer}>
              {loading ? (
                <div className={styles.loadingMessages}>
                  <div className={styles.spinner}></div>
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyMessages}>
                  <div className={styles.emptyIcon}>🚀</div>
                  <h4>Start the conversation</h4>
                  <p>
                    Send a message to begin chatting with{" "}
                    {userType === "vendor"
                      ? "the customer"
                      : "the service provider"}
                  </p>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.messageGroup} ${
                        message.sender_type === userType
                          ? styles.sent
                          : styles.received
                      }`}
                    >
                      <div className={styles.message}>
                        <p className={styles.messageContent}>
                          {message.content}
                        </p>
                        <span className={styles.messageTime}>
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className={styles.messageInput}>
              {error && (
                <div className={styles.errorMessage}>
                  <span>⚠️ {error}</span>
                  <button onClick={() => setError(null)}>×</button>
                </div>
              )}

              <div className={styles.inputContainer}>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type your message${
                    userType === "vendor"
                      ? " to customer"
                      : " to service provider"
                  }...`}
                  className={styles.textarea}
                  rows="1"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={styles.sendButton}
                >
                  {sending ? (
                    <div className={styles.sendingSpinner}></div>
                  ) : (
                    "➤"
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedMessages;
