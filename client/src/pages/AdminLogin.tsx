import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Rate limiting refs
  const submittingRef = useRef(false);
  const lastRateLimitRef = useRef<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (submittingRef.current) {
      return;
    }

    // CRITICAL: Check rate limit BEFORE making the API call
    if (lastRateLimitRef.current > 0) {
      const timeSinceLastRateLimit = Date.now() - lastRateLimitRef.current;
      if (timeSinceLastRateLimit < 60000) {
        const remainingSeconds = Math.ceil((60000 - timeSinceLastRateLimit) / 1000);
        setError(`Too many login attempts. Please wait ${remainingSeconds} seconds before trying again.`);
        return;
      } else {
        // Reset if enough time has passed
        lastRateLimitRef.current = 0;
      }
    }

    setLoading(true);
    setError('');

    try {
      submittingRef.current = true;
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-cache',
      });

      if (response.status === 429) {
        lastRateLimitRef.current = Date.now();
        const remainingSeconds = 60;
        setError(`Too many login attempts. Please wait ${remainingSeconds} seconds before trying again.`);
        submittingRef.current = false;
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.includes('Too many')) {
          lastRateLimitRef.current = Date.now();
          const remainingSeconds = 60;
          setError(`Too many login attempts. Please wait ${remainingSeconds} seconds before trying again.`);
          submittingRef.current = false;
          setLoading(false);
          return;
        }
      }

      const data = await response.json();

      if (data.success) {
        // Check if user is admin
        if (data.data.user.role !== 'admin') {
          setError('Access denied. Admin credentials required.');
          submittingRef.current = false;
          setLoading(false);
          return;
        }

        // Store token and user data
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Reset rate limit on successful login
        lastRateLimitRef.current = 0;

        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error: any) {
      // Don't show error for 429 or network errors related to rate limiting
      if (!error.message?.includes('429') && !error.message?.includes('Too many') && !error.message?.includes('Failed to fetch')) {
        setError('Network error. Please try again.');
      }
      submittingRef.current = false;
    } finally {
      setLoading(false);
      // Reset submitting ref after a delay
      setTimeout(() => {
        submittingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 animate-pulse"></div>
        <div className="absolute inset-0 bg-black opacity-90"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-red-600 rounded-2xl shadow-lg border-2 border-purple-400">
              <Shield className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent mb-2">
            Admin Login
          </h1>
          <p className="text-gray-300">
            Access admin control panel
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/30 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-center">
              <AlertCircle className="text-red-400 mr-2" size={20} />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  placeholder="pn2@gmail.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  placeholder="pn2@gmail.com"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400 hover:text-gray-300" size={20} />
                  ) : (
                    <Eye className="text-gray-400 hover:text-gray-300" size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all transform hover:scale-105 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 shadow-lg border border-purple-500/30'
              }`}
            >
              {loading ? 'Authenticating...' : 'Admin Sign In'}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
            <p className="text-xs text-gray-300 font-medium mb-2">Admin Test Credentials:</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p><strong>Email:</strong> pn2@gmail.com</p>
              <p><strong>Password:</strong> pn2@gmail.com</p>
            </div>
          </div>

          {/* User Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Need user access?
              <button
                onClick={() => navigate('/login')}
                className="ml-1 font-medium text-blue-400 hover:text-blue-300"
              >
                User Login
              </button>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure admin access - Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
