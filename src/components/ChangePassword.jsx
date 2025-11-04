import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-purple-800 mb-6 text-2xl text-center">Change Password</h2>
      
      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
      {success && <div className="text-green-500 text-sm mb-4 text-center">{success}</div>}
      
      <div className="mb-5 p-2.5 bg-blue-50 rounded border border-blue-500">
        <strong>Changing password for:</strong> {user?.username}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="currentPassword" className="block mb-2 text-gray-800 font-medium">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded border-solid text-base transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            required
          />
        </div>
        
        <div className="mb-5">
          <label htmlFor="newPassword" className="block mb-2 text-gray-800 font-medium">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded border-solid text-base transition-colors duration-300 ease-out focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20"
            placeholder="At least 6 characters"
            required
          />
        </div>
        
        <div className="mb-5">
          <label htmlFor="confirmPassword" className="block mb-2 text-gray-800 font-medium">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
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
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
      
      <button 
        onClick={() => navigate(-1)} 
        className="w-full py-3 bg-gray-300 text-gray-800 border-none rounded cursor-pointer text-base font-medium transition-colors duration-300 ease-out hover:bg-gray-400 mt-2.5" 
      >
        Back
      </button>
    </div>
  );
};

export default ChangePassword;
