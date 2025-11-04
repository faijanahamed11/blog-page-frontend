import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import Search, { highlightSearchTerm } from './Search';

const Home = ({ showSearch }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('content');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [postsPerPage, setPostsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    { value: 'all', label: 'All Posts', icon: '📝' },
    { value: 'general', label: 'General', icon: '📄' },
    { value: 'meme', label: 'Meme/Fun', icon: '😂' },
    { value: 'confession', label: 'Confession', icon: '🤐' },
    { value: 'question', label: 'Question', icon: '❓' },
    { value: 'announcement', label: 'Announcement', icon: '📢' }
  ];

  useEffect(() => {
    fetchPosts(searchTerm, searchType, selectedCategory);
  }, [searchTerm, searchType, selectedCategory]);

  useEffect(() => {
    fetchPosts(searchTerm, searchType, selectedCategory);
  }, []);

  const fetchPosts = async (search = '', type = 'content', category = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const response = await postsAPI.getAllPosts(search, type, category);
      
      // Validate response data
      if (response && response.data && Array.isArray(response.data)) {
        const sortedPosts = sortPostsWithAdminPriority(response.data, search, type);
        setPosts(sortedPosts);

      } else {

        setError('Invalid data format received from server');
        setPosts([]);
      }
    } catch (error) {

      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running on port 3000.');
      } else {
        setError('Failed to load posts. Please try again later.');
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term, type) => {
    setSearchTerm(term);
    setSearchType(type);
    setCurrentPage(1); // Reset to first page when searching
    fetchPosts(term, type, selectedCategory);
  };

  const handlePostsPerPageChange = (newPostsPerPage) => {
    setPostsPerPage(newPostsPerPage);
    setCurrentPage(1); // Reset to first page when changing posts per page
  };

  // Calculate pagination
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

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

  // Check if a user is admin (you can modify this list as needed)
  const isAdminUser = (username) => {
    // Add admin usernames here - you can expand this list
    const adminUsernames = ['admin'];
    return adminUsernames.includes(username);
  };

  // Sort posts with admin posts at top, then by relevance/date
  const sortPostsWithAdminPriority = (posts, searchTerm, searchType) => {
    if (!posts.length) return posts;

    // First, separate admin posts from regular posts
    const adminPosts = posts.filter(post => isAdminUser(post.username));
    const regularPosts = posts.filter(post => !isAdminUser(post.username));

    // Sort admin posts by date (newest first)
    const sortedAdminPosts = adminPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Sort regular posts by relevance if searching, otherwise by date
    let sortedRegularPosts;
    if (searchTerm) {
      sortedRegularPosts = sortPostsByRelevance(regularPosts, searchTerm, searchType);
    } else {
      sortedRegularPosts = regularPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Return admin posts first, then regular posts
    return [...sortedAdminPosts, ...sortedRegularPosts];
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-50 text-lg text-gray-800">Loading posts...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mb-4">{error}</div>;
  }

  return (
    <div>
      {/* Search Component */}
      {showSearch && (
        <div className="animate-slideDown">
          <Search onSearch={handleSearch} loading={loading} />
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-30">
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-base">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {searchTerm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-5 border-l-4 border-orange-400">
          <p className="m-0 text-gray-800 flex justify-between items-center flex-wrap gap-2.5">
            Showing {getFilteredPostCount()} result{getFilteredPostCount() !== 1 ? 's' : ''} for "{searchTerm}" in {searchType === 'username' ? 'usernames' : 'post content'}
            <span className="text-gray-800 text-xs italic ml-2.5">(Results sorted by relevance)</span>
            <button 
              onClick={() => handleSearch('', 'content')} 
              className="bg-orange-400 text-white border-none py-1.5 px-3 rounded cursor-pointer text-sm transition-all duration-300 ease-out hover:bg-purple-300"
            >
              Clear search
            </button>
          </p>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div className="text-gray-800 italic text-center py-10 px-5 bg-gray-50 rounded-lg">
          <h2>
            {searchTerm ? 'No posts found' : 'No posts yet'}
          </h2>
          <p>
            {searchTerm 
              ? `No posts found matching "${searchTerm}"` 
              : 'Be the first to create a post!'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentPosts.map((post) => {
          const isAdmin = isAdminUser(post.username);
          return (
              <div key={post._id} className={`rounded-lg p-5 shadow-md transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg h-full flex flex-col ${
              isAdmin 
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500' 
                : 'bg-white'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-lg font-medium ${
                    isAdmin ? 'text-purple-700' : 'text-purple-800'
                  }`}>
                    {searchType === 'username' && searchTerm 
                      ? highlightSearchTerm(`@${post.username}`, searchTerm)
                      : `@${post.username}`
                    }
                  </div>
                  {isAdmin && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium border border-purple-200">
                      🔧 Admin
                    </span>
                  )}
                </div>
                  <div className="text-gray-800 text-sm text-right">{formatDate(post.createdAt)}</div>
              </div>
              
              {/* Category Badge */}
              {post.category && post.category !== 'general' && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    post.category === 'meme' ? 'bg-yellow-100 text-yellow-800' :
                    post.category === 'confession' ? 'bg-red-100 text-red-800' :
                    post.category === 'question' ? 'bg-blue-100 text-blue-800' :
                    post.category === 'announcement' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <span>
                      {post.category === 'meme' ? '😂' :
                       post.category === 'confession' ? '🤐' :
                       post.category === 'question' ? '❓' :
                       post.category === 'announcement' ? '📢' : '📝'}
                    </span>
                    <span className="capitalize">
                      {post.category === 'meme' ? 'Meme/Fun' :
                       post.category === 'confession' ? 'Confession' :
                       post.category === 'question' ? 'Question' :
                       post.category === 'announcement' ? 'Announcement' : 'General'}
                    </span>
                  </span>
                </div>
              )}

                <div className={`text-base mb-4 whitespace-pre-wrap break-words leading-relaxed flex-grow ${
                isAdmin ? 'text-purple-900 font-medium' : 'text-gray-800'
              }`}>
                {searchType === 'content' && searchTerm 
                  ? highlightSearchTerm(post.content, searchTerm)
                  : post.content
                }
              </div>
                <div className="mt-auto">
                  <Link to={`/posts/${post._id}`} className="w-full px-4 py-2 border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-all duration-300 ease-out text-white text-center"
                      style={{
                        backgroundColor: isAdmin ? '#8B5CF6' : '#FF6F61'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = isAdmin ? '#A78BFA' : '#D1A6D4';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = isAdmin ? '#8B5CF6' : '#FF6F61';
                      }}>
                  View Comments ({post.comments?.length || 0})
                </Link>
              </div>
            </div>
          );
          })}
        </div>
        </>
      )}

      {/* Pagination and Posts Per Page Controls */}
      {posts.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Posts Per Page Selector */}
          <div className="flex items-center gap-3">
            <span className="text-gray-700 font-medium">Posts per page:</span>
            <select
              value={postsPerPage}
              onChange={(e) => handlePostsPerPageChange(parseInt(e.target.value))}
              className="px-3 py-2 text-sm font-medium rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 ease-out"
              style={{
                backgroundColor: '#FF6F61',
                color: 'white',
                border: 'none'
              }}
            >
              <option value={30} style={{ backgroundColor: '#FF6F61', color: 'white' }}>30</option>
              <option value={50} style={{ backgroundColor: '#FF6F61', color: 'white' }}>50</option>
              <option value={100} style={{ backgroundColor: '#FF6F61', color: 'white' }}>100</option>
              <option value={150} style={{ backgroundColor: '#FF6F61', color: 'white' }}>150</option>
              <option value={200} style={{ backgroundColor: '#FF6F61', color: 'white' }}>200</option>
            </select>
          </div>

          {/* Pagination Info */}
          <div className="text-gray-600 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, posts.length)} of {posts.length} posts
          </div>

          {/* Pagination Buttons */}
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium rounded transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{
                  backgroundColor: currentPage === 1 ? '#d1d5db' : '#FF6F61'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.backgroundColor = '#D1A6D4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.backgroundColor = '#FF6F61';
                  }
                }}
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded transition-all duration-300 ease-out ${
                      currentPage === pageNum ? 'text-white' : 'text-gray-700 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: currentPage === pageNum ? '#FF6F61' : '#f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = '#D1A6D4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium rounded transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{
                  backgroundColor: currentPage === totalPages ? '#d1d5db' : '#FF6F61'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.backgroundColor = '#D1A6D4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.backgroundColor = '#FF6F61';
                  }
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
