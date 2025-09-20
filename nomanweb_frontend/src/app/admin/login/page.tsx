"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminLoginPage = () => {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(
        formData.email,
        formData.password,
        formData.adminCode || undefined
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/admin-login-bg.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-sm w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/30">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
            Admin Access
          </h1>
          <p className="text-white/80 text-sm">Secure administrator login</p>
        </div>

        {/* Security Warning */}
        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-4 backdrop-blur-sm">
          <div className="text-sm text-yellow-100">
            <p className="font-medium">Restricted Access</p>
            <p>
              This area is for authorized administrators only. All login
              attempts are monitored and logged.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-4 backdrop-blur-sm">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-4 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white text-base"
                placeholder="Admin Email"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-4 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white text-base"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 mt-6 border border-white/30 rounded-xl shadow-lg text-sm font-semibold text-white bg-[#18243c] hover:bg-[#1a2640] focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Authenticating...
              </div>
            ) : (
              "Admin Login"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-white/80 text-xs">
            <Link
              href="/login"
              className="text-blue-300 hover:text-blue-200 font-semibold transition-colors underline"
            >
              ← Back to User Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
