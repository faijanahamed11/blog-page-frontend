import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { PrivateMessageProvider } from './contexts/PrivateMessageContext.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import CreatePost from './components/CreatePost.jsx';
import PostDetail from './components/PostDetail.jsx';
import EditPost from './components/EditPost.jsx';
import MyPosts from './components/MyPosts.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import PrivateMessages from './components/PrivateMessages.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './App.css';

function AppContent() {
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  // Protected Route component - moved inside AppContent to have access to AuthProvider
  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return <div className="flex justify-center items-center h-50 text-lg" style={{ color: 'var(--color-original-primary)' }}>Loading...</div>;
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-original-bg)' }}>
        <Navbar showSearch={showSearch} toggleSearch={toggleSearch} />
        <main className="w-full mx-auto px-5 lg:px-50 flex-1">
          <Routes>
            <Route path="/" element={<Home showSearch={showSearch} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <PrivateMessages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditPost />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/myposts" 
              element={
                <ProtectedRoute>
                  <MyPosts showSearch={showSearch} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ErrorBoundary>
          <PrivateMessageProvider>
            <AppContent />
          </PrivateMessageProvider>
        </ErrorBoundary>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
