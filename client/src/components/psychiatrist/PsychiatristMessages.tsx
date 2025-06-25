import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  User,
  Search,
  ChevronLeft,
  Plus,
} from "lucide-react";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderName: string;
  senderRole: string;
}

interface Patient {
  _id: string;
  name: string;
}

export default function PsychiatristMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      setShowMobileConversation(true);
    }
  }, [activeConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/messages/conversations");

      if (response.data.success) {
        setConversations(response.data.data);
      } else {
        setError("Failed to fetch conversations");
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);

      // If the endpoint returns 404, might be a backend not restarted issue
      if (error.response && error.response.status === 404) {
        setError(
          "The messaging API endpoint is not available. " +
            "Make sure your backend server has been restarted after adding messaging features."
        );
      } else {
        setError("An error occurred while fetching your conversations");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePatients = async () => {
    try {
      setLoadingPatients(true);
      // Get patients the psychiatrist has appointments with
      const response = await api.get("/psychiatrist/patients");

      if (response.data.success) {
        setAvailablePatients(response.data.data);
      } else {
        console.error("Failed to fetch patients:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const startNewConversation = async (patientId: string) => {
    // Send a first message to start the conversation
    try {
      const response = await api.post("/messages", {
        receiverId: patientId,
        content: "Hello, I'm your psychiatrist. How can I help you today?",
      });

      if (response.data.success) {
        // Refresh conversations
        await fetchConversations();

        // Set this as the active conversation
        setActiveConversation(patientId);

        // Close the modal
        setShowNewConversationModal(false);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const openNewConversationModal = () => {
    fetchAvailablePatients();
    setShowNewConversationModal(true);
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      setLoadingMessages(true);
      const response = await api.get(`/messages/conversation/${partnerId}`);

      if (response.data.success) {
        setMessages(response.data.data);
      } else {
        console.error("Failed to fetch messages:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await api.post("/messages", {
        receiverId: activeConversation,
        content: newMessage.trim(),
      });

      if (response.data.success) {
        // Add message to UI immediately
        setMessages((prev) => [...prev, response.data.data]);
        setNewMessage("");

        // Update the conversation list with the latest message
        setConversations((prev) => {
          const updated = [...prev];
          const index = updated.findIndex(
            (c) => c.partnerId === activeConversation
          );

          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              lastMessage: newMessage.trim(),
              lastMessageTime: new Date().toISOString(),
            };

            // Move this conversation to the top
            const [conversation] = updated.splice(index, 1);
            updated.unshift(conversation);
          }

          return updated;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // If today, return time
    if (date.toDateString() === now.toDateString()) {
      return formatTime(dateString);
    }

    // If this year, return month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    // Otherwise, return month, day and year
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilteredConversations = () => {
    if (!searchTerm) return conversations;

    return conversations.filter((convo) =>
      convo.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Patient Messages
        </h1>
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Messages</h1>
        <button
          onClick={openNewConversationModal}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-250">
          <div className="flex items-center justify-center flex-col gap-4 py-8">
            <MessageSquare className="h-12 w-12 text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              No Messages Yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              You don't have any messages yet. Start a conversation with your
              patients.
            </p>
            <button
              onClick={openNewConversationModal}
              className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Start a Conversation
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversation List */}
            <div
              className={`w-full md:w-1/3 border-r border-gray-200 ${
                showMobileConversation ? "hidden md:block" : "block"
              }`}
            >
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search patients..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(600px-57px)]">
                {getFilteredConversations().map((conversation) => (
                  <div
                    key={conversation.partnerId}
                    onClick={() =>
                      setActiveConversation(conversation.partnerId)
                    }
                    className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeConversation === conversation.partnerId
                        ? "bg-indigo-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.partnerName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatDate(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="ml-2 bg-indigo-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div
              className={`w-full md:w-2/3 flex flex-col ${
                !showMobileConversation ? "hidden md:flex" : "flex"
              }`}
            >
              {activeConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-3 border-b border-gray-200 flex items-center">
                    <button
                      onClick={() => setShowMobileConversation(false)}
                      className="md:hidden mr-2"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-500" />
                    </div>
                    <h3 className="ml-2 text-sm font-medium text-gray-900">
                      {conversations.find(
                        (c) => c.partnerId === activeConversation
                      )?.partnerName || "Chat"}
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <div
                            key={message._id}
                            className={`flex ${
                              message.sender === user?._id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                message.sender === user?._id
                                  ? "bg-indigo-500 text-white rounded-br-none"
                                  : "bg-white text-gray-700 rounded-bl-none border border-gray-200"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <span className="text-xs mt-1 opacity-75 block text-right">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-200">
                    <form onSubmit={sendMessage} className="flex">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-500 text-white rounded-r-lg hover:bg-indigo-600 transition-colors"
                        disabled={!newMessage.trim()}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center bg-gray-50">
                  <div className="text-center p-6">
                    <MessageSquare className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select a Conversation
                    </h3>
                    <p className="text-gray-600 max-w-md mt-2">
                      Choose a patient from the list to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              Start a New Conversation
            </h3>

            {loadingPatients ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            ) : availablePatients.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  You don't have any patients yet. Patients who book
                  appointments with you will appear here.
                </p>
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Select a patient to start a conversation with:
                </p>
                <div className="space-y-2 mb-4">
                  {availablePatients.map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => startNewConversation(patient._id)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowNewConversationModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors mr-2"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
