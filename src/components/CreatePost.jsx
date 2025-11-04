import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'general', label: 'General', icon: '📝' },
    { value: 'meme', label: 'Meme/Fun', icon: '😂' },
    { value: 'confession', label: 'Confession', icon: '🤐' },
    { value: 'question', label: 'Question', icon: '❓' },
    { value: 'announcement', label: 'Announcement', icon: '📢' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setError('');
    setLoading(true);

    try {
      await postsAPI.createPost(content, category);
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (content.trim()) {
      if (window.confirm('Are you sure you want to discard this post?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const characterCount = content.length;
  const maxCharacters = 1000;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white sticky top-0 z-40">
        <button 
          onClick={handleCancel}
          className="bg-none border-none text-blue-500 cursor-pointer p-2 rounded-full transition-colors duration-200 ease-out flex items-center justify-center hover:bg-gray-100"
          aria-label="Cancel"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        </button>
        
        <h1 className="text-lg font-semibold text-gray-800 m-0">Create Post</h1>
        
        <button 
          type="submit"
          form="create-post-form"
          className={`px-4 py-2 border-none rounded font-semibold text-sm cursor-pointer transition-colors duration-200 ease-out ${content.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={loading || !content.trim()}
        >
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>

      {/* User Info */}
      <div className="flex items-center px-5 py-4 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-base mr-3">
          <span>{user?.username?.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-sm">{user?.username}</span>
          <span className="text-gray-500 text-xs mt-0.5">Public Post</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-500 px-5 py-3 border-b border-red-200 text-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#e74c3c"/>
          </svg>
          {error}
        </div>
      )}

      {/* Post Form */}
      <form id="create-post-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-5 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-50 border-none outline-none resize-none text-base leading-relaxed text-gray-800 font-inherit bg-transparent"
            placeholder="What's on your mind?"
            maxLength={maxCharacters}
            autoFocus
          />
          
          {/* Character Counter */}
          <div className="absolute bottom-5 right-5 bg-gray-100 px-2 py-1 rounded-xl text-xs text-gray-500">
            <span className={`${characterCount > maxCharacters * 0.8 ? 'text-yellow-500' : ''} ${characterCount > maxCharacters * 0.95 ? 'text-red-500' : ''}`}>
              {characterCount}/{maxCharacters}
            </span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="px-5 py-4 border-t border-gray-200 bg-white">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    category === cat.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                  <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-4 flex-wrap">
            <button type="button" className="flex items-center gap-2 bg-none border-none text-gray-500 px-3 py-2 rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" fill="currentColor"/>
              </svg>
              Photo
            </button>
            
            <button type="button" className="flex items-center gap-2 bg-none border-none text-gray-500 px-3 py-2 rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
              Feeling
            </button>
            
            <button type="button" className="flex items-center gap-2 bg-none border-none text-gray-500 px-3 py-2 rounded cursor-pointer text-sm font-medium transition-colors duration-200 ease-out hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
              Tag People
            </button>
          </div>
        </div>
      </form>

      {/* Mobile Bottom Actions */}
      <div className="hidden px-5 py-4 border-t border-gray-200 bg-white gap-3 md:hidden">
        <button 
          onClick={handleCancel}
          className="flex-1 bg-gray-300 text-gray-800 border-none py-3 rounded font-semibold text-sm cursor-pointer transition-colors duration-200 ease-out hover:bg-gray-400"
        >
          Cancel
        </button>
        
        <button 
          type="submit"
          form="create-post-form"
          className={`flex-1 border-none py-3 rounded font-semibold text-sm cursor-pointer transition-colors duration-200 ease-out ${content.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={loading || !content.trim()}
        >
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
