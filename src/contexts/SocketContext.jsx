import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null); // Use ref to preserve socket methods
  const [activeUsers, setActiveUsers] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    // Only create socket connection when user is authenticated
    if (!isAuthenticated || !user) {
      console.log('🔌 User not authenticated, skipping socket connection');
      return;
    }

    // Create socket connection with better configuration
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('🔌 Creating socket connection to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: maxReconnectAttempts,
      autoConnect: false // Don't auto-connect, we'll connect manually
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      console.log('🔌 Socket after connect:', { 
        socket: !!newSocket, 
        on: !!(newSocket && newSocket.on), 
        emit: !!(newSocket && newSocket.emit) 
      });
      
      // Set socket in ref to preserve methods, and in state for reactivity
      console.log('🔌 Setting socket in ref and state:', { 
        socket: !!newSocket, 
        on: !!(newSocket && newSocket.on), 
        emit: !!(newSocket && newSocket.emit) 
      });
      socketRef.current = newSocket; // Store in ref to preserve methods
      setSocket(newSocket); // Also set in state for reactivity
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      socketRef.current = null; // Clear socket ref on disconnect
      setSocket(null); // Clear socket on disconnect
      
      // Only attempt reconnection if it wasn't intentional
      if (reason !== 'io client disconnect' && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`🔄 Attempting reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        
        reconnectTimeout.current = setTimeout(() => {
          newSocket.connect();
        }, 2000 * reconnectAttempts.current);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.log('🔌 Socket connection error:', error);
      setIsConnected(false);
      setSocket(null); // Clear socket on error
    });

    // Connect manually
    newSocket.connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (socket && isAuthenticated && user) {
      // Join the main socket room when user is authenticated
      socketRef.current.emit('join', {
        userId: user._id,
        username: user.username
      });

      // Listen for user count updates
      socketRef.current.on('userCount', (data) => {
        setActiveUsers(data.count);
        setConnectedUsers(data.users);
      });

      // Cleanup listeners
      return () => {
        socketRef.current.off('userCount');
        socketRef.current.emit('leave', { userId: user._id });
      };
    }
  }, [socketRef.current, isAuthenticated, user]);

  const joinAdminPage = () => {
    if (socketRef.current && isAuthenticated && user && isConnected) {
      // Prevent multiple join events
      socketRef.current.off('join');
      socketRef.current.emit('join', {
        userId: user._id,
        username: user.username
      });
    }
  };

  const leaveAdminPage = () => {
    if (socketRef.current && isConnected) {
      // Prevent multiple leave events
      socketRef.current.off('leave');
      socketRef.current.emit('leave');
    }
  };

  const value = {
    socket: socketRef.current, // Use socket from ref to preserve methods
    activeUsers,
    connectedUsers,
    isConnected,
    joinAdminPage,
    leaveAdminPage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
