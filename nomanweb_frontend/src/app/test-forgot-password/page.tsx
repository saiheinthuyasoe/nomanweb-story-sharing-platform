'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

export default function TestForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      console.log('Testing forgot password with email:', email);
      const result = await authApi.forgotPassword(email);
      console.log('Forgot password result:', result);
      setResponse({ success: true, data: result });
      toast.success('Password reset email sent successfully!');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setResponse({ 
        success: false, 
        error: error.message || 'Unknown error',
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const testResetPassword = async () => {
    const token = prompt('Enter reset token:');
    const password = prompt('Enter new password:');
    
    if (!token || !password) {
      toast.error('Token and password are required');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      console.log('Testing reset password with token:', token);
      const result = await authApi.resetPassword({ token, password });
      console.log('Reset password result:', result);
      setResponse({ success: true, data: result });
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      setResponse({ 
        success: false, 
        error: error.message || 'Unknown error',
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Forgot Password Functionality</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Test Forgot Password</h2>
            <div className="flex gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={testForgotPassword}
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Test Reset Password</h2>
            <button
              onClick={testResetPassword}
              disabled={isLoading}
              className="px-6 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Test Reset Password'}
            </button>
          </div>

          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Response:</h3>
              <div className={`p-4 rounded-lg ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Enter a valid email address that exists in your database</li>
              <li>Click "Send Reset Email" to test the forgot password functionality</li>
              <li>Check your email for the reset link</li>
              <li>Copy the token from the reset link URL</li>
              <li>Click "Test Reset Password" and enter the token and new password</li>
              <li>Check the response for any errors</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Security Features Implemented:</h3>
            <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
              <li><strong>Password Reset Attempts Tracking</strong> - All attempts are logged with IP, email, and user agent</li>
              <li><strong>Rate Limiting</strong> - Maximum 5 attempts per email per hour</li>
              <li><strong>IP-based Rate Limiting</strong> - Maximum 10 attempts per IP per hour</li>
              <li><strong>Security Audit Trail</strong> - Complete history of all password reset activities</li>
              <li><strong>Token Expiration</strong> - Reset tokens expire after 24 hours</li>
              <li><strong>Email Enumeration Prevention</strong> - Same response for valid/invalid emails</li>
              <li><strong>Admin Monitoring</strong> - Admins can view all attempts and statistics</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🔍 Database Schema Implementation:</h3>
            <div className="text-sm text-purple-700 space-y-2">
              <p><strong>password_reset_attempts</strong> table tracks:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>email</code> - Email address used for reset</li>
                <li><code>ip_address</code> - Client IP address (supports IPv6)</li>
                <li><code>user_agent</code> - Browser/client information</li>
                <li><code>token_generated</code> - Whether a reset token was created</li>
                <li><code>success</code> - Whether the password was successfully reset</li>
                <li><code>created_at</code> - Timestamp of the attempt</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Common Issues:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Email not configured properly in backend</li>
              <li>SMTP settings incorrect</li>
              <li>Email being sent to spam folder</li>
              <li>Rate limiting preventing email sending</li>
              <li>Database connection issues</li>
              <li>Token expiration (24 hours)</li>
              <li>Too many attempts from same email/IP</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🛠️ Admin Endpoints (for monitoring):</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p><code>GET /api/admin/password-reset-attempts</code> - View all attempts with pagination</p>
              <p><code>GET /api/admin/password-reset-stats</code> - Get statistics for last 24 hours</p>
              <p><code>GET /api/admin/password-reset-attempts/by-email/{email}</code> - View attempts by email</p>
              <p><code>GET /api/admin/password-reset-attempts/by-ip/{ip}</code> - View attempts by IP</p>
              <p><code>DELETE /api/admin/password-reset-attempts/cleanup</code> - Clean up old attempts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 