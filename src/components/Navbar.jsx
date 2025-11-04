import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { usePrivateMessages } from '../contexts/PrivateMessageContext.jsx';

const Navbar = ({ showSearch, toggleSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { unreadCount } = usePrivateMessages();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cleanup effect to restore body scroll when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overflowX = 'unset';
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bg-white py-4 shadow-md mb-6 relative z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <Link to="/" className="no-underline">
            <h1 className="text-2xl md:text-3xl font-bold transition-all duration-300 ease-out hover:opacity-80" style={{ color: 'var(--color-original-primary)' }}>LU BLOGS</h1>
          </Link>
        </div>
        
        {/* Search Button - Hidden on mobile, visible on tablet+ */}
        <button 
          className={`hidden sm:flex items-center justify-center px-3 py-2 md:px-4 md:py-2.5 text-white border-none rounded-full cursor-pointer font-semibold text-sm transition-all duration-300 ease-out shadow-lg relative overflow-hidden hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg`}
          style={{
            background: showSearch 
              ? 'linear-gradient(135deg, var(--color-original-primary) 0%, var(--color-original-accent) 100%)'
              : 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'linear-gradient(135deg, var(--color-original-secondary) 0%, var(--color-original-accent) 100%)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = showSearch 
              ? 'linear-gradient(135deg, var(--color-original-primary) 0%, var(--color-original-accent) 100%)'
              : 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)';
          }}
          onClick={toggleSearch}
          aria-label="Toggle search"
        >
          <div className="flex items-center gap-2 relative z-10">
            <svg className="w-4 h-4 md:w-4.5 md:h-4.5 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <span className="hidden md:inline font-semibold tracking-wide">Search</span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-4 items-center">
          <Link to="/" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>Home</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/create" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>Create Post</Link>
              <Link to="/myposts" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>My Posts</Link>
              <Link to="/messages" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white relative" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/change-password" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>Change Password</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-white no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:opacity-80" style={{ backgroundColor: 'var(--color-original-primary)' }}>Admin</Link>
              )}
              <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-600 mr-3">Welcome, {user?.username}!</span>
              </div>
              <button onClick={handleLogout} className="text-white border-none px-4 py-2 rounded cursor-pointer font-medium transition-all duration-300 ease-out hover:bg-opacity-80" style={{ backgroundColor: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-original-accent)'}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="no-underline font-medium px-3 py-2 rounded transition-all duration-300 ease-out hover:text-white" style={{ color: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>Login</Link>
              <Link to="/register" className="text-white border-none px-4 py-2 rounded cursor-pointer font-medium transition-all duration-300 ease-out hover:bg-opacity-80" style={{ backgroundColor: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-original-accent)'}>Register</Link>
            </>
          )}
        </div>

        {/* Mobile Controls - Better positioning */}
        <div className="lg:hidden flex items-center space-x-2">
          {/* Mobile Search Button - Positioned correctly next to hamburger */}
          <button 
            className="flex items-center justify-center p-2.5 text-white border-none rounded-xl cursor-pointer transition-all duration-300 ease-out hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)' }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, var(--color-original-secondary) 0%, var(--color-original-accent) 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)';
            }}
            onClick={toggleSearch}
            aria-label="Toggle search"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
          
          {/* Hamburger Menu Button */}
          <button 
            className="flex flex-col justify-around w-7 h-7 bg-transparent border-none cursor-pointer p-0 z-50 group"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className={`w-full h-0.5 rounded-sm transition-all duration-300 ease-out origin-center ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ backgroundColor: 'var(--color-original-primary)' }}></span>
            <span className={`w-full h-0.5 rounded-sm transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0' : ''}`} style={{ backgroundColor: 'var(--color-original-primary)' }}></span>
            <span className={`w-full h-0.5 rounded-sm transition-all duration-300 ease-out origin-center ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ backgroundColor: 'var(--color-original-primary)' }}></span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`fixed top-0 right-0 w-80 h-screen bg-white shadow-xl transition-transform duration-300 ease-out z-40 overflow-y-auto ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="pt-20 px-6 pb-6 flex flex-col gap-2">
            {/* Mobile Search Button */}
            <button 
              className="flex items-center justify-center gap-3 p-4 text-white border-none rounded-xl cursor-pointer font-semibold transition-all duration-300 ease-out w-full shadow-lg hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)' }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, var(--color-original-secondary) 0%, var(--color-original-accent) 100%)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, var(--color-original-accent) 0%, var(--color-original-secondary) 100%)';
              }}
              onClick={() => { toggleSearch(); closeMenu(); }}
              aria-label="Toggle search"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <span className="font-semibold">Search</span>
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            <Link to="/" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
              <span className="text-xl w-6 text-center">🏠</span>
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/create" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">✏️</span>
                  Create Post
                </Link>
                <Link to="/myposts" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">📝</span>
                  My Posts
                </Link>
                <Link to="/messages" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md relative" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">💬</span>
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/change-password" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">⚙️</span>
                  Settings
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                    <span className="text-xl w-6 text-center">👑</span>
                    Admin
                  </Link>
                )}
                <div className="border-t border-gray-100 my-2"></div>
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-xl">
                  <span className="text-xl w-6 text-center">👤</span>
                  <div>
                    <div className="font-semibold">Welcome!</div>
                    <div className="text-sm text-gray-600">{user?.username}</div>
                  </div>
                </div>
                <button onClick={() => { handleLogout(); closeMenu(); }} className="flex items-center gap-4 p-4 text-white border-none rounded-xl cursor-pointer font-semibold text-base transition-all duration-300 ease-out w-full text-left shadow-lg hover:shadow-xl" style={{ backgroundColor: 'var(--color-original-accent)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--color-original-accent)'}>
                  <span className="text-xl w-6 text-center">🚪</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">🔑</span>
                  Login
                </Link>
                <Link to="/register" className="flex items-center gap-4 p-4 no-underline font-medium rounded-xl transition-all duration-300 ease-out hover:text-white hover:shadow-md" style={{ color: 'var(--color-original-accent)' }} onClick={closeMenu} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-original-secondary)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  <span className="text-xl w-6 text-center">📝</span>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed top-0 left-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-30"
            onClick={closeMenu}
          ></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
