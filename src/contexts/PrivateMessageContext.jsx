import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import api from '../services/api';

const PrivateMessageContext = createContext();

export const usePrivateMessages = () => {
  const context = useContext(PrivateMessageContext);
  if (!context) {
    throw new Error('usePrivateMessages must be used within a PrivateMessageProvider');
  }
  return context;
};

export const PrivateMessageProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/private-messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (otherUserId, page = 1) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/private-messages/conversation/${otherUserId}?page=${page}&limit=50`);
      
      if (page === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }
      
      setCurrentConversation(response.data.otherUser);
      return response.data.hasMore;
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (receiverId, content) => {
    if (!isAuthenticated) {
      setError('You must be logged in to send messages');
      return;
    }
    
    if (!socket || !socket.emit) {
      setError('You must be connected to send messages');
      return;
    }
    
    try {
      // Send via API first
      const response = await api.post('/private-messages/send', {
        receiverId,
        content
      });

      // Emit via socket for real-time delivery
      if (socket && socket.emit) {
        console.log('Emitting private message via socket:', {
          senderId: user._id || user.id,
          receiverId,
          content
        });
        socket.emit('private-message', {
          senderId: user._id || user.id,
          receiverId,
          content
        });
      } else {
        console.log('Socket not available for real-time messaging:', { socket: !!socket, emit: !!(socket && socket.emit) });
      }

      // Add message to local state
      const newMessage = {
        ...response.data,
        sender: { 
          _id: user._id || user.id,
          username: user.username 
        },
        receiver: { 
          _id: currentConversation?._id,
          username: currentConversation?.username 
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversations list
      await fetchConversations();
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      throw error;
    }
  };

  // Join a private chat room
  const joinPrivateChat = (otherUserId) => {
    if (!socket || !user || !socket.emit) {
      console.log('Cannot join private chat - socket not ready:', { 
        socket: !!socket, 
        user: !!user, 
        emit: !!(socket && socket.emit),
        socketOn: !!(socket && socket.on)
      });
      return;
    }
    
    console.log('Joining private chat room:', { userId: user._id || user.id, otherUserId });
    socket.emit('join-private-chat', {
      userId: user._id || user.id,
      otherUserId
    });
  };

  // Leave a private chat room
  const leavePrivateChat = (otherUserId) => {
    if (!socket || !user || !socket.emit) return;
    
    socket.emit('leave-private-chat', {
      userId: user._id || user.id,
      otherUserId
    });
  };

  // Send typing indicator
  const sendTypingIndicator = (receiverId, isTyping) => {
    if (!socket || !user || !socket.emit) return;
    
    socket.emit('typing-private', {
      senderId: user._id || user.id,
      receiverId,
      isTyping
    });
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/private-messages/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Search users for new conversations
  const searchUsers = async (searchTerm = '') => {
    if (!isAuthenticated) return [];
    
    try {
      const response = await api.get(`/private-messages/users?search=${searchTerm}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Socket event listeners
  useEffect(() => {
    console.log('PrivateMessageContext socket check:', { 
      socket: !!socket, 
      user: !!user, 
      socketOn: !!(socket && socket.on),
      socketEmit: !!(socket && socket.emit),
      isAuthenticated: isAuthenticated,
      socketType: socket ? typeof socket : 'null',
      socketKeys: socket ? Object.keys(socket) : []
    });
    
    if (!socket || !user || !socket.on || !socket.emit) {
      return;
    }

    console.log('Setting up private message socket listeners');

    const handleNewMessage = (messageData) => {
      console.log('Received new private message:', messageData);
      
      const currentUserId = user._id || user.id;
      const isForCurrentUser = messageData.sender === currentUserId || messageData.receiver === currentUserId;
      
      if (!isForCurrentUser) {
        console.log('Message not for current user, ignoring');
        return;
      }
      
      // Update conversations list to show new message
      setConversations(prev => {
        const otherUserId = messageData.sender === currentUserId ? messageData.receiver : messageData.sender;
        const conversationId = [currentUserId, otherUserId].sort().join('_');
        
        return prev.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: messageData.content,
                sender: messageData.sender,
                timestamp: messageData.timestamp
              },
              unreadCount: messageData.receiver === currentUserId ? (conv.unreadCount || 0) + 1 : conv.unreadCount
            };
          }
          return conv;
        });
      });
      
      // Add message to current conversation if user is viewing it
      if (currentConversation && 
          (messageData.sender === currentConversation._id || messageData.receiver === currentConversation._id)) {
        
        const newMessage = {
          _id: Date.now(), // Temporary ID for real-time messages
          sender: { 
            _id: messageData.sender,
            username: messageData.senderUsername 
          },
          receiver: { 
            _id: messageData.receiver,
            username: currentConversation.username 
          },
          content: messageData.content,
          createdAt: messageData.timestamp,
          isRead: messageData.receiver === (user._id || user.id) ? false : true
        };
        
        console.log('Adding message to state:', newMessage);
        setMessages(prev => [...prev, newMessage]);
      }
      
      // Update unread count
      fetchUnreadCount();
    };

    const handleTypingIndicator = (data) => {
      // Handle typing indicators
      // You can implement typing indicator UI here
    };

    const handleMessageError = (error) => {
      setError(error.message);
    };

    // Only add event listeners if socket is properly initialized
    if (socket.on && typeof socket.on === 'function') {
      socket.on('new-private-message', handleNewMessage);
      socket.on('user-typing-private', handleTypingIndicator);
      socket.on('private-message-error', handleMessageError);
    }

    return () => {
      // Only remove event listeners if socket is properly initialized
      if (socket.off && typeof socket.off === 'function') {
        socket.off('new-private-message', handleNewMessage);
        socket.off('user-typing-private', handleTypingIndicator);
        socket.off('private-message-error', handleMessageError);
      }
    };
  }, [socket, user, currentConversation]);

  // Clear connection error when socket becomes available
  useEffect(() => {
    if (socket && socket.emit && error === 'You must be connected to send messages') {
      setError(null);
    }
  }, [socket, error]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const value = {
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
  };

  return (
    <PrivateMessageContext.Provider value={value}>
      {children}
    </PrivateMessageContext.Provider>
  );
};
