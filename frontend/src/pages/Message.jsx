import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageCircle,
  User,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Menu,
  Search,
  MoreVertical,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";

const Message = () => {
  const [activeConversation, setActiveConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [userType, setUserType] = useState("student");
  const [activeTab, setActiveTab] = useState("conversations");
  const [showSidebar, setShowSidebar] = useState(true);
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
    staleTime: 30000,
    refetchInterval: 60000,
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
    staleTime: 300000,
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
    staleTime: 10000,
    refetchInterval: 5000,
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
      queryClient.setQueryData(
        ["messages", activeConversation.id],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages: [...oldData.messages, data.message],
          };
        },
      );
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
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveTab("conversations");
      setActiveConversation({
        id: data.conversation_id,
        otherParticipant: "",
        serviceName: "",
        participantType: userType,
      });
      setShowSidebar(false);
    },
    onError: (error) => {
      console.error("Failed to start conversation:", error);
    },
  });

  const handleConversationSelect = (conversation) => {
    setActiveConversation({
      id: conversation.conversation_id,
      otherParticipant: conversation.other_participant_name,
      serviceName: conversation.service_name,
      participantType: userType,
    });
    setShowSidebar(false);
  };

  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      !activeConversation ||
      sendMessageMutation.isPending
    )
      return;

    sendMessageMutation.mutate({ content: newMessage });
  };

  const startConversation = (applicationId) => {
    startConversationMutation.mutate(applicationId);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.messages]);

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
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (conversationsLoading || applicationsLoading) {
    return (
      <div className="flex h-screen bg-[#111b21]">
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center space-x-3 text-[#8696a0]">
            <MessageCircle size={24} className="animate-pulse" />
            <span className="text-lg font-medium">Loading chat...</span>
          </div>
        </div>
      </div>
    );
  }

  const error = conversationsError || applicationsError || messagesError;
  const conversations = conversationsData?.conversations || [];
  const applications = applicationsData?.applications || [];
  const messages = messagesData?.messages || [];
  const totalUnread = conversationsData?.total_unread || 0;

  return (
    <div className="flex h-screen mt-40 md:mt-0 bg-[#111b21] overflow-hidden">
      {/* Sidebar - WhatsApp Style */}
      <div
        className={`${showSidebar ? "flex" : "hidden"} md:flex w-full md:w-[400px] bg-[#111b21] flex-col border-r border-[#2a3942]`}
      >
        {/* Sidebar Header */}
        <div className="bg-[#202c33] px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-medium text-[#e9edef]">Messages</h1>
            <div className="flex items-center gap-6">
              {totalUnread > 0 && (
                <span className="bg-[#25d366] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                  {totalUnread}
                </span>
              )}
              <button className="text-[#aebac1] hover:text-[#e9edef]">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-[#8696a0]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full bg-[#111b21] text-[#e9edef] text-sm pl-10 pr-4 py-2 rounded-lg outline-none focus:bg-[#1a2831]"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111b21] border-b border-[#2a3942]">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "conversations"
                ? "text-[#25d366]"
                : "text-[#8696a0] hover:text-[#aebac1]"
            }`}
            onClick={() => setActiveTab("conversations")}
          >
            Chats
            {activeTab === "conversations" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25d366]"></div>
            )}
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "applications"
                ? "text-[#25d366]"
                : "text-[#8696a0] hover:text-[#aebac1]"
            }`}
            onClick={() => setActiveTab("applications")}
          >
            Applications
            {activeTab === "applications" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#25d366]"></div>
            )}
          </button>
        </div>

        {/* Conversations List */}
        {activeTab === "conversations" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374248] scrollbar-track-transparent">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-[#8696a0]">
                <MessageCircle size={64} className="mb-4 opacity-50" />
                <p className="text-center text-sm">No conversations yet</p>
              </div>
            ) : (
              <div>
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-[#202c33] ${
                      activeConversation?.id === conv.conversation_id
                        ? "bg-[#2a3942]"
                        : ""
                    }`}
                    onClick={() => handleConversationSelect(conv)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#6b7c85] rounded-full flex items-center justify-center shrink-0">
                        <User size={24} className="text-[#111b21]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-medium text-[#e9edef] truncate text-base">
                            {conv.other_participant_name}
                          </h3>
                          <span className="text-xs text-[#8696a0] ml-2 shrink-0">
                            {formatTime(conv.updated_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-[#8696a0] truncate">
                            {conv.service_name}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-[#25d366] text-[#111b21] text-xs font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center ml-2">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications List */}
        {activeTab === "applications" && (
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374248] scrollbar-track-transparent">
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-[#8696a0]">
                <User size={64} className="mb-4 opacity-50" />
                <p className="text-center text-sm">No applications yet</p>
              </div>
            ) : (
              <div>
                {applications.map((app) => (
                  <div
                    key={app.application_id}
                    className={`p-3 transition-colors ${
                      !app.has_conversation && app.can_start_chat
                        ? "cursor-pointer hover:bg-[#202c33]"
                        : ""
                    }`}
                    onClick={() =>
                      !app.has_conversation &&
                      app.can_start_chat &&
                      startConversation(app.application_id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#6b7c85] rounded-full flex items-center justify-center shrink-0">
                        <User size={24} className="text-[#111b21]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#e9edef] mb-1 text-base">
                          {app.participant_name}
                        </h3>
                        <p className="text-sm text-[#8696a0] mb-2 line-clamp-2">
                          {app.description}
                        </p>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusStyle(
                              app.status,
                            )}`}
                          >
                            {app.status}
                          </span>
                          {app.has_conversation ? (
                            <div className="flex items-center text-[#25d366] text-xs">
                              <CheckCircle2 size={14} className="mr-1" />
                              <span>Chat Active</span>
                            </div>
                          ) : app.can_start_chat ? (
                            <span className="text-[#25d366] text-xs font-medium">
                              {startConversationMutation.isPending
                                ? "Starting..."
                                : "Tap to chat"}
                            </span>
                          ) : (
                            <span className="text-[#8696a0] text-xs">
                              Cannot start chat
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div
        className={`${!showSidebar || activeConversation ? "flex" : "hidden"} md:flex flex-1 flex-col`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] px-4 py-2.5 flex items-center gap-3 shadow-sm">
              <button
                className="md:hidden text-[#aebac1] hover:text-[#e9edef] mr-1"
                onClick={() => {
                  setShowSidebar(true);
                  setActiveConversation(null);
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <div className="w-10 h-10 bg-[#6b7c85] rounded-full flex items-center justify-center shrink-0">
                <User size={20} className="text-[#111b21]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-medium text-[#e9edef] truncate">
                  {activeConversation.otherParticipant}
                </h2>
                <p className="text-xs text-[#8696a0] truncate">
                  {activeConversation.serviceName}
                </p>
              </div>
              <button className="text-[#aebac1] hover:text-[#e9edef]">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages - WhatsApp Pattern Background */}
            <div
              className="flex-1 overflow-y-auto px-4 md:px-16 py-4"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M0 0h50v50H0z'/%3E%3Cpath d='M50 50h50v50H50z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: "#0b141a",
              }}
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center space-x-3 text-[#8696a0]">
                    <MessageCircle size={24} className="animate-pulse" />
                    <span className="text-sm">Loading messages...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const isOwn =
                      activeConversation.participantType ===
                      message.sender_type;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`relative max-w-[85%] md:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                            isOwn
                              ? "bg-[#005c4b] text-white rounded-tr-none"
                              : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                          }`}
                        >
                          <div className="text-sm wrap-break-words whitespace-pre-wrap leading-5">
                            {message.content}
                          </div>
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isOwn ? "text-[#a8d9cc]" : "text-[#8696a0]"
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </div>
                          {/* WhatsApp tail */}
                          <div
                            className={`absolute top-0 w-0 h-0 ${
                              isOwn
                                ? "right-0 -mr-2 border-l-8 border-l-[#005c4b] border-t-8 border-t-transparent"
                                : "left-0 -ml-2 border-r-8 border-r-[#202c33] border-t-8 border-t-transparent"
                            }`}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-[#202c33] px-3 py-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative bg-[#2a3942] rounded-lg">
                  <textarea
                    className="w-full bg-transparent text-[#e9edef] text-sm px-4 py-2.5 resize-none outline-none min-h-[42px] max-h-32 placeholder-[#8696a0]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message"
                    rows={1}
                  />
                </div>
                <button
                  className={`p-2.5 rounded-full transition-all shrink-0 ${
                    sendMessageMutation.isPending || !newMessage.trim()
                      ? "bg-[#2a3942] text-[#8696a0] cursor-not-allowed"
                      : "bg-[#25d366] text-[#111b21] hover:bg-[#20bd5f] active:scale-95"
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
          <div className="hidden md:flex flex-col items-center justify-center h-full text-[#8696a0] bg-[#0b141a] border-b-4 border-[#25d366]">
            <div className="w-80 text-center">
              <MessageCircle size={120} className="mb-8 opacity-20 mx-auto" />
              <h2 className="text-3xl font-light text-[#e9edef] mb-6">
                Messages
              </h2>
              <p className="text-sm leading-relaxed">
                Send and receive messages without keeping your phone online.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-[#202c33] text-[#e9edef] p-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-sm border border-[#2a3942] z-50">
          <div className="flex-1">
            <p className="font-medium text-sm">Error</p>
            <p className="text-xs text-[#8696a0] mt-1">
              {error.message || "An error occurred"}
            </p>
          </div>
          <button
            className="bg-[#25d366] hover:bg-[#20bd5f] text-[#111b21] px-3 py-1.5 rounded text-xs font-medium transition-colors"
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
