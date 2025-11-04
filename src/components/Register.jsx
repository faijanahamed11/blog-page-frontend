import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
      const result = await register(formData.username, formData.password);
      if (result.success) {
        navigate('/login');
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
      <h2 className="text-purple-800 mb-6 text-2xl text-center">Register</h2>
      
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
            className="w-full px-4 py-3 border border-gray-300 rounded border-solid text-sm transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            placeholder="Choose username stay (anonymous)"
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
            placeholder="Choose a password"
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
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      
      <p className="mt-5 text-center">
        Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login here</Link>
      </p>
    </div>
  );
};

export default Register;
