import React, { useState } from 'react';

// Utility function to highlight search terms
export const highlightSearchTerm = (text, searchTerm) => {
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

const Search = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('content');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim(), searchType);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('', 'content');
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md mb-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2.5 flex-wrap">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 min-w-50 px-4 py-3 border border-gray-300 rounded border-solid text-base transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            disabled={loading}
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded border-solid text-base bg-white cursor-pointer transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400"
            disabled={loading}
          >
            <option value="content">Search by Content</option>
            <option value="username">Search by Username</option>
          </select>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            type="submit"
            className="px-5 py-3 border-none rounded text-base font-medium cursor-pointer transition-colors duration-300 ease-out bg-orange-400 text-white hover:bg-purple-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={loading || !searchTerm.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-3 border-none rounded text-base font-medium cursor-pointer transition-colors duration-300 ease-out bg-gray-200 text-gray-800 hover:bg-purple-300 hover:text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Search;
