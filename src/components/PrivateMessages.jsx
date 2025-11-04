import React, { useState, useEffect, useRef } from 'react';
import { usePrivateMessages } from '../contexts/PrivateMessageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api';

const PrivateMessages = () => {
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    joinPrivateChat,
    leavePrivateChat,
    sendTypingIndicator,
    searchUsers,
    setCurrentConversation,
    setMessages,
    setError
  } = usePrivateMessages();

  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const modalOpenRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug conversations and messages
  useEffect(() => {
    console.log('Conversations:', conversations);
    console.log('Messages:', messages);
    console.log('Current User:', user);
    console.log('User ID:', user?._id);
    console.log('User Type:', typeof user);
  }, [conversations, messages, user]);



  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.relative')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleModalClickOutside = (event) => {
      if (showDeleteChatModal && event.target.classList.contains('fixed')) {
        setShowDeleteChatModal(false);
        modalOpenRef.current = false;
      }
      if (showDeleteUserModal && event.target.classList.contains('fixed')) {
        setShowDeleteUserModal(false);
        modalOpenRef.current = false;
      }
    };

    document.addEventListener('mousedown', handleModalClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleModalClickOutside);
    };
  }, [showDeleteChatModal, showDeleteUserModal]);

  // Simple keyboard handling - just scroll to bottom when input is focused
  useEffect(() => {
    const handleInputFocus = () => {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleInputFocus);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleInputFocus);
      }
    };
  }, [currentConversation]);

  // Handle conversation selection
  const handleConversationSelect = async (conversation) => {
    if (selectedConversation) {
      leavePrivateChat(selectedConversation.otherUser._id);
    }
    
    setSelectedConversation(conversation);
    setCurrentConversation(conversation.otherUser);
    setMessages([]);
    
    // Join the private chat room
    joinPrivateChat(conversation.otherUser._id);
    
    // Fetch messages
    await fetchMessages(conversation.otherUser._id);
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    try {
      await sendMessage(currentConversation._id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && currentConversation) {
      setIsTyping(true);
      sendTypingIndicator(currentConversation._id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (currentConversation) {
        sendTypingIndicator(currentConversation._id, false);
      }
    }, 1000);
  };

  // Handle user search
  const handleUserSearch = async (term) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const results = await searchUsers(term);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };



  // Delete chat conversation
  const deleteChat = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentConversation || isDeleting) return;
    
    setIsDeleting(true);
    
    // Close modal immediately
    setShowDeleteChatModal(false);
    setShowMenu(false);
    modalOpenRef.current = false;
    
    try {
      await api.delete(`/private-messages/conversation/${currentConversation._id}`);
      
      // Clear current conversation and messages
      setCurrentConversation(null);
      setMessages([]);
      setSelectedConversation(null);
      
      // Refresh conversations list immediately
      await fetchConversations();
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete user (admin only)
  const deleteUser = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentConversation || isDeleting) return;
    
    setIsDeleting(true);
    
    // Close modal immediately
    setShowDeleteUserModal(false);
    setShowMenu(false);
    modalOpenRef.current = false;
    
    try {
      await api.delete(`/api/admin/users/${currentConversation._id}`);
      
      // Clear current conversation and messages
      setCurrentConversation(null);
      setMessages([]);
      setSelectedConversation(null);
      
      // Refresh conversations list
      await fetchConversations();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Start new conversation
  const startNewConversation = async (otherUser) => {
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
    
    // Check if conversation already exists
    const existingConversation = conversations.find(
      conv => conv.otherUser._id === otherUser._id
    );
    
    if (existingConversation) {
      handleConversationSelect(existingConversation);
    } else {
      // Create new conversation
      setSelectedConversation({
        otherUser,
        lastMessage: null,
        unreadCount: 0
      });
      setCurrentConversation(otherUser);
      setMessages([]);
      joinPrivateChat(otherUser._id);
    }
  };

  // Format date for messages
  const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" style={{ height: '100vh', height: '100dvh' }}>
      {/* Conversations Sidebar */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        {/* Header */}
        <div className="p-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* Search for new conversations */}
          {showSearch && (
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-9 bg-gray-100 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => startNewConversation(user)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-center">
                <div className="font-medium text-sm">No conversations yet</div>
                <div className="text-xs text-gray-400">Start a new chat!</div>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => handleConversationSelect(conversation)}
                className={`w-full p-2.5 text-left hover:bg-gray-50 transition-colors ${
                  selectedConversation?.otherUser._id === conversation.otherUser._id
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {conversation.otherUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 truncate text-sm">
                        {conversation.otherUser.username}
                      </div>
                      <div className="flex items-center space-x-2">
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-400">
                            {formatMessageDate(conversation.lastMessage.createdAt)}
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center font-medium">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                    {conversation.lastMessage && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {conversation.lastMessage.content}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}
      >
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {currentConversation.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {currentConversation.username}
                    </h3>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${otherUserTyping ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                      <div className="text-xs text-gray-500">
                        {otherUserTyping ? 'typing...' : 'online'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showMenu && (
                    <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!modalOpenRef.current) {
                            modalOpenRef.current = true;
                            setShowDeleteChatModal(true);
                            setShowMenu(false);
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Chat</span>
                      </button>
                      
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!modalOpenRef.current) {
                              modalOpenRef.current = true;
                              setShowDeleteUserModal(true);
                              setShowMenu(false);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span>Delete User</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ backgroundColor: '#f0f2f5' }}>
              {/* End-to-End Encryption Notice */}
              {messages.length > 0 && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs text-gray-600">Messages are end-to-end encrypted. Only people in this chat can read, listen to, or share them.</span>
                  </div>
                </div>
              )}

              {messages.map((message, index) => {
                const isSender = message.sender?._id === (user?._id || user?.id);
                
                // Debug logging
                console.log('Message Debug:', {
                  messageSenderId: message.sender?._id,
                  currentUserId: user?._id || user?.id,
                  isSender,
                  messageContent: message.content,
                  senderObject: message.sender,
                  userObject: user
                });
                
                return (
                  <div
                    key={index}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isSender
                          ? 'text-white rounded-br-md shadow-sm' // Sender: Blue with rounded bottom-right
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-200' // Receiver: White with rounded bottom-left
                      }`}
                      style={{
                        backgroundColor: isSender ? '#007bff' : '#ffffff'
                      }}
                    >
                      <div className="text-sm leading-relaxed">{message.content}</div>
                      <div className={`text-xs mt-1 flex justify-end ${
                        isSender ? 'text-white opacity-70' : 'text-gray-500'
                      }`}>
                        {formatMessageDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                    maxLength={1000}
                    style={{ fontSize: '16px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Select a conversation</h3>
              <p className="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {showDeleteChatModal && (
        <div key="delete-chat-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Chat</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="text-gray-700 mb-6">
              <p className="mb-4">
                Are you sure you want to delete this chat with <strong>{currentConversation?.username}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-red-900 mb-1">Permanent Deletion</p>
                    <p className="text-red-700">This will permanently delete the chat for <strong>both you and {currentConversation?.username}</strong>. All messages will be removed and cannot be recovered.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteChatModal(false);
                  modalOpenRef.current = false;
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Chat'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserModal && (
        <div key="delete-user-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="text-gray-700 mb-6 space-y-3">
              <p>
                Are you sure you want to permanently delete user <strong>{currentConversation?.username}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-red-900 mb-1">Complete Account Deletion</p>
                    <p className="text-red-700">This will permanently remove the user account, all their posts, comments, and private messages. This action cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteUserModal(false);
                  modalOpenRef.current = false;
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateMessages;
