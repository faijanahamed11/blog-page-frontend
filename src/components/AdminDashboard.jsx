import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { adminAPI } from '../services/adminApi';
import DeleteModal from './DeleteModal.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';

// Utility function to highlight search terms (same as in Search.js)
const highlightSearchTerm = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-300 py-0.5 px-1 rounded font-bold">
        {part}
      </mark>
    ) : part
  );
};

  // Utility function to format dates - matching client format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { activeUsers, connectedUsers, joinAdminPage, leaveAdminPage, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: '', title: '', postId: '', commentIndex: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [stableActiveUsers, setStableActiveUsers] = useState(0);

  // Stabilize active users to prevent flickering
  useEffect(() => {
    if (activeUsers !== undefined && activeUsers !== null) {
      // Only update if the change is significant (more than 2 user difference) or if it's the first load
      if (stableActiveUsers === 0 || Math.abs(activeUsers - stableActiveUsers) > 2) {
        setStableActiveUsers(activeUsers);
      }
    }
  }, [activeUsers, stableActiveUsers]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      // Only join if connected and not already joined
      if (isConnected) {
        joinAdminPage();
      }
      
      return () => {
        if (isConnected) {
          leaveAdminPage();
        }
      };
    }
  }, [user, isConnected, joinAdminPage, leaveAdminPage]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, activeTab]);

  // Safety check to prevent blank screen - ensure users array is always valid
  useEffect(() => {
    if (users === null || users === undefined) {
      setUsers([]);
    }
    if (allUsers === null || allUsers === undefined) {
      setAllUsers([]);
    }
  }, [users, allUsers]);

  // Debug logging to track state changes


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'stats') {
        const statsResponse = await adminAPI.getStats();
        setStats(statsResponse.data);
      } else if (activeTab === 'users') {
        const usersResponse = await adminAPI.getAllUsers();
        setAllUsers(usersResponse.data);
        setUsers(usersResponse.data);
      } else if (activeTab === 'blocked') {
        // For blocked users tab, we can reuse the existing users data
        // since it's filtered from allUsers
        if (allUsers.length === 0) {
          const usersResponse = await adminAPI.getAllUsers();
          setAllUsers(usersResponse.data);
        }
      } else if (activeTab === 'posts') {
        const postsResponse = await adminAPI.getAllPosts();
        setAllPosts(postsResponse.data);
        setPosts(postsResponse.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, isBlocked) => {
    try {
      setActionLoading(true);
      setError(null); // Clear any previous errors
      

      
      const response = await adminAPI.blockUser(userId, isBlocked);
      

      
      // Simple approach: just refresh the data to ensure UI is in sync
      const usersResponse = await adminAPI.getAllUsers();
      setAllUsers(usersResponse.data);
      setUsers(usersResponse.data);
      

      
      // Show success message
      const action = isBlocked ? 'blocked' : 'unblocked';
      setSuccessMessage(`User has been ${action} successfully!`);

      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Refresh stats if on stats tab
      if (activeTab === 'stats') {
        loadData();
      }
      
      // Keep loading state for a bit longer to ensure UI stability
      setTimeout(() => {
        setActionLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('🔍 BlockUser Debug - Error occurred:', error);
      setError('Failed to update user. Please try again or refresh the page.');
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      setAllUsers(allUsers.filter(u => u._id !== userId));
      if (activeTab === 'stats') {
        loadData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      setActionLoading(true);
      await adminAPI.deletePost(postId);
      setPosts(posts.filter(p => p._id !== postId));
      setAllPosts(allPosts.filter(p => p._id !== postId));
      if (activeTab === 'stats') {
        loadData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      setActionLoading(true);
      await adminAPI.deleteComment(postId, commentId);
      // Refresh posts to get updated comment count
      const postsResponse = await adminAPI.getAllPosts();
      setAllPosts(postsResponse.data);
      setPosts(postsResponse.data);
      if (activeTab === 'stats') {
        loadData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    } finally {
      setActionLoading(false);
    }
  };

  const clearPostSearch = () => {
    setPostSearch('');
    setCommentSearch('');
    searchPosts('');
  };

  const clearUserSearch = () => {
    setUserSearch('');
    searchUsers('');
  };

  const searchUsers = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      setUsers(allUsers);
      return;
    }

    const filteredUsers = allUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort users by relevance
    const sortedUsers = filteredUsers.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const usernameA = a.username.toLowerCase();
      const usernameB = b.username.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Exact match gets highest score
      if (usernameA === searchLower) scoreA += 1000;
      if (usernameB === searchLower) scoreB += 1000;

      // Starts with search term gets high score
      if (usernameA.startsWith(searchLower)) scoreA += 500;
      if (usernameB.startsWith(searchLower)) scoreB += 500;

      // Contains search term gets medium score
      if (usernameA.includes(searchLower)) scoreA += 100;
      if (usernameB.includes(searchLower)) scoreB += 100;

      return scoreB - scoreA;
    });

    setUsers(sortedUsers);
  }, [allUsers]);

  const searchPosts = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      setPosts(allPosts);
      return;
    }

    const filteredPosts = allPosts.filter(post => {
      const searchLower = searchTerm.toLowerCase();

      
      // Check post content
      if (searchTerm && post.content.toLowerCase().includes(searchLower)) return true;
      
      // Check username
      if (searchTerm && post.username.toLowerCase().includes(searchLower)) return true;
      
      // Check comments for post search
      if (searchTerm && post.comments && post.comments.length > 0) {
        if (post.comments.some(comment => 
          !comment.isDeleted && comment.text.toLowerCase().includes(searchLower)
        )) return true;
      }
      

      
      return false;
    });

    // Sort posts by relevance
    const sortedPosts = filteredPosts.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const contentA = a.content.toLowerCase();
      const contentB = b.content.toLowerCase();
      const usernameA = a.username.toLowerCase();
      const usernameB = b.username.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Exact match gets highest score
      if (contentA === searchLower) scoreA += 1000;
      if (contentB === searchLower) scoreB += 1000;

      // Starts with search term gets high score
      if (contentA.startsWith(searchLower)) scoreA += 500;
      if (contentB.startsWith(searchLower)) scoreB += 500;

      // Contains search term gets medium score
      if (contentA.includes(searchLower)) scoreA += 100;
      if (contentB.includes(searchLower)) scoreB += 100;

      // Username matches get bonus points
      if (usernameA.includes(searchLower)) scoreA += 200;
      if (usernameB.includes(searchLower)) scoreB += 200;

      // Comment matches get bonus points
      if (a.comments && a.comments.length > 0) {
        const commentMatchesA = a.comments.filter(comment => 
          !comment.isDeleted && comment.text.toLowerCase().includes(searchLower)
        ).length;
        scoreA += commentMatchesA * 150;
      }
      
      if (b.comments && b.comments.length > 0) {
        const commentMatchesB = b.comments.filter(comment => 
          !comment.isDeleted && comment.text.toLowerCase().includes(searchLower)
        ).length;
        scoreB += commentMatchesB * 150;
      }

      // Recent posts get slight preference for same relevance
      if (scoreA === scoreB) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return scoreB - scoreA;
    });

    setPosts(sortedPosts);
  }, [allPosts]);

  const handleUserSearchChange = (e) => {
    const value = e.target.value;
    setUserSearch(value);
    searchUsers(value);
  };

  const handlePostSearchChange = (e) => {
    const value = e.target.value;
    setPostSearch(value);
    searchPosts(value);
  };

  // Trigger search when commentSearch changes
  useEffect(() => {
    searchPosts(postSearch);
  }, [postSearch, searchPosts]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center py-10">
          <h1 className="text-2xl text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link to="/" className="text-blue-500 hover:underline">Return to Homepage</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-5">
        <div className="text-center py-10">
          <div className="text-lg text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* Admin Header - Matching original client styling */}
      <div className="text-center mb-8 py-5 px-5 text-white rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h1 className="m-0 mb-2.5 text-2xl">Admin Dashboard</h1>
        <p className="m-0 mb-4">Welcome, {user.username}!</p>
        <div className="mt-4">
          <Link 
            to="/change-password" 
            className="inline-block px-4 py-2 rounded font-medium transition-colors duration-200 ease-out no-underline"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            🔐 Change Password
          </Link>
        </div>
      </div>

      {/* Live Counter Section - Stabilized to prevent flickering */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 bg-white bg-opacity-20 p-4 rounded-full backdrop-blur-md border border-white border-opacity-30">
          <span className="text-xl">👥</span>
          <span className="font-semibold text-sm">Active users:</span>
          <div className="min-w-16 text-center">
            <span className="text-2xl font-bold text-green-400 drop-shadow-lg inline-block w-16">{stableActiveUsers}</span>
          </div>
          <span className="text-xs font-medium opacity-80">Live</span>
        </div>
        {connectedUsers.length > 0 && (
          <div className="mt-3 opacity-80 text-xs">
            Connected: {connectedUsers.join(', ')}
          </div>
        )}
      </div>

      {/* Admin Tabs with Icons */}
      <div className="flex gap-2.5 mb-8 flex-wrap">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 border-none rounded-lg cursor-pointer font-medium transition-all duration-300 ease-out flex-1 min-w-30 ${activeTab === 'stats' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          📊 Statistics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 border-none rounded-lg cursor-pointer font-medium transition-all duration-300 ease-out flex-1 min-w-30 ${activeTab === 'users' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          👥 Users
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-5 py-3 border-none rounded-lg cursor-pointer font-medium transition-all duration-300 ease-out flex-1 min-w-30 ${activeTab === 'blocked' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          🚫 Blocked Users
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-5 py-3 border-none rounded-lg cursor-pointer font-medium transition-all duration-300 ease-out flex-1 min-w-30 ${activeTab === 'posts' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          📝 Posts
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-5 text-center">
          {error}
          <div className="mt-3 space-x-2">
          <button 
            onClick={() => setError(null)}
              className="bg-red-500 text-white border-none px-4 py-2 rounded cursor-pointer hover:bg-red-600"
            >
              Dismiss
            </button>
            {error.includes('refresh the page') && (
              <button 
                onClick={() => {
                  setError(null);
                  loadData();
                }}
                className="bg-blue-500 text-white border-none px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
              >
                🔄 Refresh Data
              </button>
            )}
          </div>
        </div>
      )}

      {/* Success Message Display */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-5 text-center border border-green-200">
          <span className="mr-2">✅</span>
          {successMessage}
          <button 
            onClick={() => setSuccessMessage(null)}
            className="bg-green-500 text-white border-none px-4 py-2 rounded cursor-pointer ml-2.5 hover:bg-green-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div>
        {activeTab === 'stats' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Total Users</h3>
                <p className="text-3xl font-bold text-gray-800 m-0">{stats.totalUsers}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Non-Blocked Users</h3>
                <p className="text-3xl font-bold text-gray-800 m-0">{stats.activeUsers}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Recently Active (24h)</h3>
                <p className="text-3xl font-bold text-blue-600 m-0">{stats.recentlyActiveUsers || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Weekly Active (7d)</h3>
                <p className="text-3xl font-bold text-green-600 m-0">{stats.weeklyActiveUsers || 0}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Blocked Users</h3>
                <p className="text-3xl font-bold text-red-600 m-0">{stats.blockedUsers}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Total Posts</h3>
                <p className="text-3xl font-bold text-gray-800 m-0">{stats.totalPosts}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-md text-center transition-transform duration-200 ease-out hover:-translate-y-0.5">
                <h3 className="m-0 mb-2.5 text-gray-600 text-sm font-medium">Admin Users</h3>
                <p className="text-3xl font-bold text-purple-600 m-0">{stats.adminUsers}</p>
              </div>
            </div>
            
            {/* Last Updated Info */}
            {stats.lastUpdated && (
              <div className="text-center text-sm text-gray-500 mb-4">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div key="users-tab-content">
            <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--color-original-primary)' }}>User Management</h2>
            
            {/* User Search */}
            <div className="mb-5">
              <div className="flex gap-2.5 mb-4">
                <input
                  type="text"
                  placeholder="Search users by username..."
                  value={userSearch}
                  onChange={handleUserSearchChange}
                  className="flex-1 px-4 py-2.5 border rounded border-solid text-sm transition-colors duration-300 ease-out focus:outline-none focus:shadow-lg"
                  style={{
                    borderColor: 'var(--color-original-accent)',
                    color: 'var(--color-original-primary)',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-original-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 31, 94, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-original-accent)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {userSearch && (
                  <button
                    onClick={clearUserSearch}
                    className="px-4 py-2.5 border-none rounded cursor-pointer font-medium transition-colors duration-300 ease-out"
                    style={{
                      backgroundColor: 'var(--color-original-accent)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--color-original-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--color-original-accent)';
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Search Results Info */}
              {userSearch && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 m-0">
                    Showing {users.length} user{users.length !== 1 ? 's' : ''} matching "{userSearch}"
                    <span className="text-xs text-gray-500 ml-2">(Results sorted by relevance)</span>
                    <button 
                      onClick={clearUserSearch} 
                      className="ml-3 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Show all users
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="space-y-3" key={`users-list-${users?.length || 0}-${actionLoading}`}>
              {actionLoading ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Updating User...</h3>
                  <p className="text-gray-500">Please wait while we process your request.</p>
                </div>
              ) : users && users.length > 0 ? users.map((userItem) => (
                <div key={userItem._id} className="bg-white p-5 rounded-xl shadow-md border-0">
                  <div className="flex justify-between items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                           style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        {userItem.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--color-original-primary)' }}>
                            {userSearch ? highlightSearchTerm(userItem.username, userSearch) : userItem.username}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {userItem.role}
                          </span>
                          {userItem.isBlocked && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="m-0">Joined: {formatDate(userItem.createdAt)}</p>
                          {userItem.lastLogin && (
                            <p className="m-0">Last Login: {formatDate(userItem.lastLogin)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* User Actions */}
                    <div className="flex gap-2">
                      {userItem.role !== 'admin' && (
                        <>
                          {userItem.isBlocked ? (
                            <button
                              onClick={() => handleBlockUser(userItem._id, false)}
                              disabled={actionLoading}
                              className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: '#27ae60',
                                color: 'white'
                              }}
                              onMouseEnter={(e) => {
                                if (!actionLoading) e.target.style.backgroundColor = '#229954';
                              }}
                              onMouseLeave={(e) => {
                                if (!actionLoading) e.target.style.backgroundColor = '#27ae60';
                              }}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(userItem._id, true)}
                              disabled={actionLoading}
                              className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: '#f39c12',
                                color: 'white'
                              }}
                              onMouseEnter={(e) => {
                                if (!actionLoading) e.target.style.backgroundColor = '#e67e22';
                              }}
                              onMouseLeave={(e) => {
                                if (!actionLoading) e.target.style.backgroundColor = '#f39c12';
                              }}
                            >
                              Block
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, type: 'user', id: userItem._id, title: userItem.username })}
                            disabled={actionLoading}
                            className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: '#e74c3c',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              if (!actionLoading) e.target.style.backgroundColor = '#c0392b';
                            }}
                            onMouseLeave={(e) => {
                              if (!actionLoading) e.target.style.backgroundColor = '#e74c3c';
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {userItem.role === 'admin' && (
                        <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Users Found</h3>
                  <p className="text-gray-500">
                    {userSearch ? `No users match "${userSearch}"` : 'No users available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'blocked' && (
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-original-primary)' }}>Blocked Users Management</h2>
              <button
                onClick={() => {
                  setLoading(true);
                  loadData();
                }}
                disabled={loading}
                className="px-4 py-2 border-none rounded cursor-pointer font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--color-original-accent)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = 'var(--color-original-secondary)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.backgroundColor = 'var(--color-original-accent)';
                }}
              >
                {loading ? '⏳ Refreshing...' : '🔄 Refresh List'}
              </button>
            </div>
            
            {/* Blocked Users List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Refreshing Blocked Users...</h3>
                  <p className="text-gray-500">Please wait while we update the list.</p>
                </div>
              ) : allUsers.filter(user => user.isBlocked).map((userItem) => (
                <div key={userItem._id} className="bg-white p-5 rounded-xl shadow-md border-0 border-l-4 border-l-red-500">
                  <div className="flex justify-between items-center gap-5">
                    <div className="flex items-center gap-4 flex-1">
                      {/* User Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                           style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}>
                        {userItem.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold m-0" style={{ color: 'var(--color-original-primary)' }}>
                            {userItem.username}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${userItem.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {userItem.role}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            🚫 Blocked
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="m-0">Joined: {formatDate(userItem.createdAt)}</p>
                          {userItem.lastLogin && (
                            <p className="m-0">Last Login: {formatDate(userItem.lastLogin)}</p>
                          )}
                          {userItem.blockedAt && (
                            <p className="m-0 text-red-600">Blocked: {formatDate(userItem.blockedAt)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* User Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBlockUser(userItem._id, false)}
                        disabled={actionLoading}
                        className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: '#27ae60',
                          color: 'white'
                        }}
                        onMouseEnter={(e) => {
                          if (!actionLoading) e.target.style.backgroundColor = '#229954';
                        }}
                        onMouseLeave={(e) => {
                          if (!actionLoading) e.target.style.backgroundColor = '#27ae60';
                        }}
                      >
                        ✅ Unblock User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* No Blocked Users Message */}
              {allUsers.filter(user => user.isBlocked).length === 0 && (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Blocked Users</h3>
                  <p className="text-gray-500">All users are currently active and unblocked.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--color-original-primary)' }}>Post Management</h2>
            
            {/* Post Search */}
            <div className="mb-5">
              <div className="flex gap-2.5 mb-4">
                <input
                  type="text"
                  placeholder="Search posts by username, content, or comments..."
                  value={postSearch}
                  onChange={handlePostSearchChange}
                  className="flex-1 px-4 py-2.5 border rounded border-solid text-sm transition-colors duration-300 ease-out focus:outline-none focus:shadow-lg"
                  style={{
                    borderColor: 'var(--color-original-accent)',
                    color: 'var(--color-original-primary)',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-original-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(93, 31, 94, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-original-accent)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {postSearch && (
                  <button
                    onClick={clearPostSearch}
                    className="px-4 py-2.5 border-none rounded cursor-pointer font-medium transition-colors duration-300 ease-out"
                    style={{
                      backgroundColor: 'var(--color-original-accent)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'var(--color-original-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'var(--color-original-accent)';
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Search Results Info */}
              {postSearch && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 m-0">
                    Showing {posts.length} post{posts.length !== 1 ? 's' : ''} matching 
                    {postSearch && ` "${postSearch}"`}
                    <span className="text-xs text-gray-500 ml-2">
                      (Searches username, content, and comments)
                    </span>
                    <button 
                      onClick={clearPostSearch} 
                      className="ml-3 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Show all posts
                    </button>
                  </p>
                </div>
              )}
            </div>



            {/* Posts List */}
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post._id} className="bg-white p-5 rounded-xl shadow-md border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg" style={{ color: '#667eea' }}>
                            @{postSearch ? highlightSearchTerm(post.username, postSearch) : post.username}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <div className="text-base leading-relaxed mb-3" style={{ color: '#1c1e21' }}>
                        {post.content.length > 100 
                          ? postSearch 
                            ? highlightSearchTerm(`${post.content.substring(0, 100)}...`, postSearch)
                            : `${post.content.substring(0, 100)}...`
                          : postSearch 
                            ? highlightSearchTerm(post.content, postSearch)
                            : post.content
                        }
                      </div>
                      
                      {/* Comments Section */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-original-primary)' }}>
                            Comments ({post.comments.filter(c => !c.isDeleted).length})
                          </h4>
                          {post.comments.map((comment, commentIndex) => {
                            if (comment.isDeleted) return null;
                            
                            return (
                              <div key={commentIndex} className="bg-gray-50 p-3 rounded-lg mb-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium" style={{ color: '#667eea' }}>
                                    @{comment.username}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <div className="text-sm" style={{ color: '#1c1e21' }}>
                                  {comment.text}
                                </div>
                                <div className="mt-2">
                                  <button
                                    onClick={() => handleDeleteComment(post._id, comment._id)}
                                    disabled={actionLoading}
                                    className="px-3 py-1 border-none rounded cursor-pointer text-xs font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                      backgroundColor: '#e74c3c',
                                      color: 'white'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!actionLoading) e.target.style.backgroundColor = '#c0392b';
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!actionLoading) e.target.style.backgroundColor = '#e74c3c';
                                    }}
                                  >
                                    Delete Comment
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm text-gray-600">
                          {post.comments?.filter(c => !c.isDeleted).length || 0} comment{post.comments?.filter(c => !c.isDeleted).length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, type: 'post', id: post._id, title: post.content.substring(0, 50) + '...' })}
                          disabled={actionLoading}
                          className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white'
                          }}
                          onMouseEnter={(e) => {
                            if (!actionLoading) e.target.style.backgroundColor = '#c0392b';
                          }}
                          onMouseLeave={(e) => {
                            if (!actionLoading) e.target.style.backgroundColor = '#e74c3c';
                          }}
                        >
                          Delete Post
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: '', id: '', title: '', postId: '', commentIndex: '' })}
        onConfirm={() => {
          if (deleteModal.type === 'user') {
            handleDeleteUser(deleteModal.id);
          } else if (deleteModal.type === 'post') {
            handleDeletePost(deleteModal.id);
          }
          setDeleteModal({ isOpen: false, type: '', id: '', title: '', postId: '', commentIndex: '' });
        }}
        title={`Delete ${deleteModal.type}`}
        message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
        itemName={deleteModal.title}
      />
    </div>
  );
};

export default AdminDashboard;
