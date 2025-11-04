import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';
import { highlightSearchTerm } from './Search.jsx';
import DeleteModal from './DeleteModal.jsx';

const PostDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCommentSearch, setShowCommentSearch] = useState(false);
  const [filteredComments, setFilteredComments] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentIndex: null, commentText: '' });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(id);
      setPost(response.data);
      setFilteredComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const response = await postsAPI.addComment(id, comment);
      setPost(response.data);
      setFilteredComments(response.data.comments || []);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (commentIndex, commentText) => {
    setDeleteModal({ isOpen: true, commentIndex, commentText });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, commentIndex: null, commentText: '' });
  };

  const handleDeleteComment = async (commentIndex) => {
    try {
      const commentToDelete = filteredComments[commentIndex];
      

      
      const response = await postsAPI.deleteComment(id, commentToDelete._id);

      
      setPost(response.data);
      setFilteredComments(response.data.comments || []);
      setError(null); // Clear any previous errors
      
      // Close the modal after successful deletion
      setDeleteModal({ isOpen: false, commentIndex: null, commentText: '' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const handleCommentSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredComments(post?.comments || []);
      return;
    }
    
    const filtered = (post?.comments || []).filter(comment => 
      comment.text.toLowerCase().includes(term.toLowerCase()) ||
      comment.username.toLowerCase().includes(term.toLowerCase())
    );
    
    // Sort comments by relevance
    const sortedComments = sortCommentsByRelevance(filtered, term);
    setFilteredComments(sortedComments);
  };

  // Sort comments by relevance
  const sortCommentsByRelevance = (comments, searchTerm) => {
    if (!searchTerm || !comments.length) return comments;

    return comments.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      const textA = a.text.toLowerCase();
      const textB = b.text.toLowerCase();
      const usernameA = a.username.toLowerCase();
      const usernameB = b.username.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Exact match gets highest score
      if (textA === searchLower) scoreA += 1000;
      if (textB === searchLower) scoreB += 1000;

      // Starts with search term gets high score
      if (textA.startsWith(searchLower)) scoreA += 500;
      if (textB.startsWith(searchLower)) scoreB += 500;

      // Contains search term gets medium score
      if (textA.includes(searchLower)) scoreA += 100;
      if (textB.includes(searchLower)) scoreB += 100;

      // Username matches get bonus points
      if (usernameA.includes(searchLower)) scoreA += 200;
      if (usernameB.includes(searchLower)) scoreB += 200;

      // Word boundary matches get small bonus
      const wordsA = textA.split(/\s+/);
      const wordsB = textB.split(/\s+/);
      
      wordsA.forEach(word => {
        if (word.startsWith(searchLower)) scoreA += 50;
        if (word.includes(searchLower)) scoreA += 25;
      });
      
      wordsB.forEach(word => {
        if (word.startsWith(searchLower)) scoreB += 50;
        if (word.includes(searchLower)) scoreB += 25;
      });

      return scoreB - scoreA;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-50 text-lg" style={{ color: 'var(--color-original-primary)' }}>Loading post...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mb-4">{error}</div>;
  }

  if (!post) {
    return <div className="text-red-500 text-center mb-4">Post not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-5">
      <div className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div className="text-lg font-medium" style={{ color: 'var(--color-original-primary)' }}>@{post.username}</div>
          <div className="text-gray-800 text-sm">{formatDate(post.createdAt)}</div>
        </div>
        <div className="text-base mb-4 whitespace-pre-wrap break-words leading-relaxed" style={{ color: 'var(--color-original-primary)' }}>{post.content}</div>
      </div>

      <div className="mt-8">
        <h3 className="mb-5 text-xl" style={{ color: 'var(--color-original-primary)' }}>Comments</h3>
        
        {/* Comment Search Toggle */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => {
              if (showCommentSearch) {
                setShowCommentSearch(false);
                setSearchTerm('');
                setFilteredComments(post?.comments || []);
              } else {
                setShowCommentSearch(true);
                setSearchTerm('');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer font-medium text-sm transition-all duration-300 ease-out hover:-translate-y-0.5 select-none"
            style={{
              backgroundColor: showCommentSearch ? '#FF6F61' : 'var(--color-original-accent)',
              color: 'white',
              borderColor: showCommentSearch ? '#FF6F61' : 'var(--color-original-accent)'
            }}
            aria-label="Toggle comment search"
          >
            <span className="text-lg">🔍</span>
            <span>
              {showCommentSearch ? 'Hide Search' : 'Search Comments'}
            </span>
          </button>
        </div>

        {/* Comment Search Input */}
        {showCommentSearch && (
          <div className="mb-5">
            <input
              id="comment-search-input"
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={handleCommentSearch}
              className="w-full px-4 py-2.5 border rounded border-solid text-sm transition-colors duration-300 ease-out focus:outline-none focus:shadow-lg"
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
          </div>
        )}
        
        {filteredComments && filteredComments.length > 0 ? (
          filteredComments.map((comment, index) => (
            <div key={index} className="bg-white p-4 mb-2.5 rounded-lg border shadow-sm" style={{ borderColor: 'var(--color-original-secondary)' }}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium" style={{ color: 'var(--color-original-primary)' }}>
                  {searchTerm 
                    ? highlightSearchTerm(`@${comment.username}`, searchTerm)
                    : `@${comment.username}`
                  }
                </div>
                <div className="text-gray-800 text-xs">{formatDate(comment.createdAt)}</div>
              </div>
              <div className="leading-relaxed" style={{ color: 'var(--color-original-primary)' }}>
                {searchTerm 
                  ? highlightSearchTerm(comment.text, searchTerm)
                  : comment.text
                }
              </div>
              {isAuthenticated && user?.username === comment.username && (
                <div className="mt-2.5">
                  <button
                    onClick={() => openDeleteModal(index, comment.text)}
                    className="border-none py-1 px-2 rounded cursor-pointer text-xs transition-colors duration-300 ease-out"
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
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="italic text-center py-10 px-5 rounded-lg" style={{ color: 'var(--color-original-primary)', backgroundColor: 'var(--color-original-secondary)' }}>
            {searchTerm 
              ? `No comments found matching "${searchTerm}"`
              : 'No comments yet. Be the first to comment!'
            }
          </div>
        )}

        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mt-5 pb-20 sm:pb-5">
            <div className="mb-5">
              <label htmlFor="comment" className="block mb-2 font-medium" style={{ color: 'var(--color-original-primary)' }}>Add a Comment</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border rounded border-solid text-base min-h-25 resize-y font-inherit transition-colors duration-300 ease-out focus:outline-none focus:shadow-lg"
                placeholder="Write your comment here..."
                required
                style={{
                  minHeight: '120px',
                  height: '120px',
                  width: '100%',
                  borderColor: 'var(--color-original-accent)',
                  color: 'var(--color-original-primary)',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-original-primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 31, 94, 0.1)';
                  // Scroll the input into view on mobile when keyboard appears
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-original-accent)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 text-white border-none rounded cursor-pointer text-base font-medium transition-all duration-300 ease-out disabled:bg-gray-400 disabled:cursor-not-allowed" 
              style={{
                backgroundColor: 'var(--color-original-accent)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--color-original-secondary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--color-original-accent)';
              }}
              disabled={submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <div className="italic text-center py-10 px-5 rounded-lg" style={{ color: 'var(--color-original-primary)', backgroundColor: 'var(--color-original-secondary)' }}>
            <Link to="/login" style={{ color: 'var(--color-original-accent)' }}>Log in</Link> to post a comment.
          </div>
        )}
      </div>

      <div className="mt-1 mb-10 sm:mb-5 text-center">
        <Link to="/" className="px-4 py-2 border-none rounded cursor-pointer text-sm font-medium no-underline inline-block transition-colors duration-300 ease-out" style={{ backgroundColor: 'var(--color-original-accent)', color: 'white' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-original-accent)'}>Back to Homepage</Link>
      </div>

      {/* Delete Comment Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => handleDeleteComment(deleteModal.commentIndex)}
        title="Delete Comment"
        message={`Are you sure you want to delete this comment?`}
        loading={false}
      />
    </div>
  );
};

export default PostDetail;