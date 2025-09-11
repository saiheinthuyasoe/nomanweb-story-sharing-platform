'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminLoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Admin login failed');
      }

      // Store admin token
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Dispatch custom event to notify admin layout of auth change
      window.dispatchEvent(new Event('adminAuthChange'));
      
      toast.success('Admin login successful');
      
      // Small delay to ensure localStorage is set and events are processed
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 100);
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: 'url(/admin-login-bg.svg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Admin Access</h1>
        </div>

        {/* Security Warning removed */}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] transition-all bg-white/50 text-sm"
              placeholder="Email"
            />
          </div>

          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#18243c] focus:border-[#18243c] transition-all bg-white/50 text-sm"
              placeholder="Password"
            />
          </div>

          {/* Admin code field removed */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#18243c] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1c2a47] focus:ring-2 focus:ring-[#18243c]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Admin Login'
            )}
          </button>
        </form>

        {/* Footer with navigation link removed */}
      </div>
    </div>
  );
};

export default AdminLoginPage;