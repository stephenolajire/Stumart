import React, { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, Clock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";

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
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Loading state
  if (conversationsLoading || applicationsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center space-x-3 text-gray-600">
            <MessageCircle size={24} className="animate-pulse" />
            <span className="text-lg font-medium">Loading chat...</span>
          </div>
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-500 to-yellow-600">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 border-b border-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "conversations"
                ? "bg-white text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            Chats
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "applications"
                ? "bg-white text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </button>
        </div>

        {/* Conversations List */}
        {activeTab === "conversations" && (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                <MessageCircle size={48} className="mb-4 opacity-50" />
                <p className="text-center">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 relative ${
                      activeConversation?.id === conv.conversation_id
                        ? "bg-yellow-50 border-r-4 border-yellow-500"
                        : ""
                    }`}
                    onClick={() => handleConversationSelect(conv)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">
                        {conv.other_participant_name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {conv.service_name}
                    </p>
                    {conv.unread_count > 0 && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications List */}
        {activeTab === "applications" && (
          <div className="flex-1 overflow-y-auto">
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                <User size={48} className="mb-4 opacity-50" />
                <p className="text-center">No applications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <div
                    key={app.application_id}
                    className={`p-4 transition-colors ${
                      !app.has_conversation && app.can_start_chat
                        ? "cursor-pointer hover:bg-gray-50"
                        : ""
                    }`}
                    onClick={() =>
                      !app.has_conversation &&
                      app.can_start_chat &&
                      startConversation(app.application_id)
                    }
                  >
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {app.participant_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                      {app.has_conversation ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle2 size={16} className="mr-1" />
                          <span>Chat Active</span>
                        </div>
                      ) : app.can_start_chat ? (
                        <span className="text-yellow-600 text-sm font-medium">
                          {startConversationMutation.isPending
                            ? "Starting..."
                            : "Click to start chat"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          Cannot start chat
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <User size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation.otherParticipant}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {activeConversation.serviceName}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MessageCircle size={24} className="animate-pulse" />
                    <span>Loading messages...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwn =
                      activeConversation.participantType ===
                      message.sender_type;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwn
                              ? "bg-yellow-500 text-white"
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}
                        >
                          <div className="break-words">{message.content}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isOwn ? "text-yellow-100" : "text-gray-500"
                            }`}
                          >
                            {message.sender_name} •{" "}
                            {formatTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors min-h-[48px] max-h-32"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1}
                  />
                </div>
                <button
                  className={`p-3 rounded-full transition-all duration-200 ${
                    sendMessageMutation.isPending || !newMessage.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-yellow-500 text-white hover:bg-yellow-600 transform hover:scale-105 active:scale-95"
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">
              Select a conversation to start chatting
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Choose from your conversations or start a new chat from
              applications
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm">
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm opacity-90">
              {error.message || "An error occurred"}
            </p>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
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
