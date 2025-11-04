import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-purple-800 mb-6 text-2xl text-center">Login</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="username" className="block mb-2 text-gray-800 font-medium">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded border-solid text-base transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            required
          />
        </div>
        
        <div className="mb-5">
          <label htmlFor="password" className="block mb-2 text-gray-800 font-medium">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded border-solid text-base transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            required
          />
        </div>
        
                <button
          type="submit"
          className="w-full py-3 text-white border-none rounded cursor-pointer text-base font-medium transition-colors duration-300 ease-out disabled:bg-gray-400 disabled:cursor-not-allowed" 
          style={{
            backgroundColor: '#FF6F61'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#D1A6D4';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#FF6F61';
          }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="mt-5 text-center">
        Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
