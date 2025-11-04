import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';
import Search, { highlightSearchTerm } from './Search.jsx';
import DeleteModal from './DeleteModal.jsx';

const MyPosts = ({ showSearch }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('content');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, postId: null, postContent: '' });
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getMyPosts();
      const myPosts = response.data;
      setAllPosts(myPosts);
      setPosts(myPosts);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setError('Failed to load your posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term, type) => {
    setSearchTerm(term);
    setSearchType(type);
    
    if (!term.trim()) {
      setPosts(allPosts);
      return;
    }
    
    const filteredPosts = allPosts.filter(post => {
      if (type === 'username') {
        return post.username.toLowerCase().includes(term.toLowerCase());
      } else {
        return post.content.toLowerCase().includes(term.toLowerCase());
      }
    });
    
    // Sort filtered posts by relevance
    const sortedPosts = sortPostsByRelevance(filteredPosts, term, type);
    setPosts(sortedPosts);
  };

  // Count posts that actually contain the search term and would be highlighted
  const getFilteredPostCount = () => {
    if (!searchTerm) return posts.length;
    
    return posts.filter(post => {
      if (searchType === 'username') {
        const username = post.username.toLowerCase();
        const term = searchTerm.toLowerCase();
        // Use the same regex logic as the highlighting function
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return regex.test(username);
      } else {
        const content = post.content.toLowerCase();
        const term = searchTerm.toLowerCase();
        // Use the same regex logic as the highlighting function
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        return regex.test(content);
      }
    }).length;
  };

  // Sort posts by relevance for search results
  const sortPostsByRelevance = (posts, searchTerm, searchType) => {
    if (!searchTerm || !posts.length) return posts;

    return posts.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (searchType === 'username') {
        // Sort by username relevance
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
      } else {
        // Sort by content relevance
        const contentA = a.content.toLowerCase();
        const contentB = b.content.toLowerCase();
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

        // Count word matches for additional scoring
        const wordsA = contentA.split(/\s+/);
        const wordsB = contentB.split(/\s+/);
        const searchWords = searchLower.split(/\s+/);

        let matchesA = 0;
        let matchesB = 0;

        searchWords.forEach(word => {
          if (word.length > 2) { // Only count words longer than 2 characters
            wordsA.forEach(w => {
              if (w.includes(word)) matchesA++;
            });
            wordsB.forEach(w => {
              if (w.includes(word)) matchesB++;
            });
          }
        });

        scoreA += matchesA * 100;
        scoreB += matchesB * 100;

        // Starts with search term gets bonus
        if (contentA.startsWith(searchLower)) scoreA += 50;
        if (contentB.startsWith(searchLower)) scoreB += 50;

        // Recent posts get slight preference for same relevance
        if (scoreA === scoreB) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
      }

      return scoreB - scoreA; // Higher score first
    });
  };

  const handleDeletePost = (postId, postContent) => {
    setDeleteModal({
      isOpen: true,
      postId: postId,
      postContent: postContent
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, postId: null, postContent: '' });
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await postsAPI.deletePost(deleteModal.postId);
      setPosts(posts.filter(post => post._id !== deleteModal.postId));
      setAllPosts(allPosts.filter(post => post._id !== deleteModal.postId));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-50 text-lg text-gray-800">Loading your posts...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mb-4">{error}</div>;
  }

  return (
    <div>
      <h2 className="mb-5 text-gray-800">My Posts</h2>
      
      {/* Search Component */}
      {showSearch && (
        <div className="animate-slideDown">
          <Search onSearch={handleSearch} loading={loading} />
        </div>
      )}
      
      {searchTerm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-5 border-l-4 border-orange-400">
          <p className="m-0 text-gray-800 flex justify-between items-center flex-wrap gap-2.5">
            Showing {getFilteredPostCount()} result{getFilteredPostCount() !== 1 ? 's' : ''} for "{searchTerm}" in {searchType === 'username' ? 'usernames' : 'post content'}
            <span className="text-gray-800 text-xs italic ml-2.5">(Results sorted by relevance)</span>
            <button 
              onClick={() => handleSearch('', 'content')} 
              className="bg-orange-400 text-white border-none py-1.5 px-3 rounded cursor-pointer text-sm transition-colors duration-300 ease-out hover:bg-purple-300"
            >
              Show all my posts
            </button>
          </p>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="text-gray-800 italic text-center py-10 px-5 bg-gray-50 rounded-lg">
          <h3>
            {searchTerm ? 'No posts found' : 'No posts yet'}
          </h3>
          <p>
            {searchTerm 
              ? `No posts found matching "${searchTerm}"` 
              : 'Create your first post to get started!'
            }
          </p>
          {!searchTerm && (
            <Link to="/create" className="px-4 py-2 text-white border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-all duration-300 ease-out mt-4"
                  style={{
                    backgroundColor: '#FF6F61'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#D1A6D4';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FF6F61';
                  }}>
              Create New Post
            </Link>
          )}
        </div>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="bg-white rounded-lg p-5 mb-5 shadow-md transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="text-purple-800 text-lg font-medium">
                {searchType === 'username' && searchTerm 
                  ? highlightSearchTerm(`@${post.username}`, searchTerm)
                  : `@${post.username}`
                }
              </div>
              <div className="text-gray-800 text-sm">{formatDate(post.createdAt)}</div>
            </div>
            <div className="text-base mb-4 whitespace-pre-wrap break-words leading-relaxed">
              {searchType === 'content' && searchTerm 
                ? highlightSearchTerm(post.content, searchTerm)
                : post.content
              }
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <Link to={`/posts/${post._id}`} className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-all duration-300 ease-out text-white"
                    style={{
                      backgroundColor: '#FF6F61'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#D1A6D4';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#FF6F61';
                    }}>
                View Post ({post.comments?.length || 0} comments)
              </Link>
              <Link to={`/edit/${post._id}`} className="px-4 py-2 bg-gray-200 text-gray-800 border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-all duration-300 ease-out hover:bg-purple-300 hover:text-white">
                Edit Post
              </Link>
              <button
                onClick={() => handleDeletePost(post._id, post.content)}
                className="px-4 py-2 bg-red-500 text-white border-none rounded cursor-pointer text-sm font-medium transition-all duration-300 ease-out hover:bg-red-700"
              >
                Delete Post
              </button>
            </div>
          </div>
        ))
      )}
      
      <div className="mt-8 text-center">
        <Link to="/" className="px-4 py-2 bg-gray-200 text-gray-800 border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-all duration-300 ease-out hover:bg-purple-300 hover:text-white">Back to Homepage</Link>
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Post"
        message={`Are you sure you want to delete this post?`}
        loading={deleting}
      />
    </div>
  );
};

export default MyPosts;
