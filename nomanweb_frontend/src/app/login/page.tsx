"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import LineSignIn from "@/components/auth/LineSignIn";
import toast from "react-hot-toast";

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, setAuthData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      rememberMe: false,
    },
  });

  // Load saved email and password if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail && savedPassword) {
      setValue("email", savedEmail);
      setValue("password", savedPassword);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  // Show success message if coming from email verification - moved to useEffect
  useEffect(() => {
    if (verified === "true") {
      toast.success("Email verified successfully! You can now log in.");
    }
  }, [verified]);

  const onSubmit = async (data: LoginForm) => {
    try {
      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
        localStorage.setItem("rememberedPassword", data.password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      await login(data.email, data.password);
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  const handleGoogleSuccess = (response: any) => {
    console.log("🔐 Google OAuth response:", response);
    // Google OAuth success - need to set token, refreshToken and user in AuthContext
    if (response.token && response.refreshToken && response.user) {
      // Set token, refreshToken and user in AuthContext
      setAuthData(response.token, response.refreshToken, response.user);

      toast.success("Google login successful!");

      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        console.log("🚀 Navigating to stories after Google OAuth");
        router.push("/stories");
      }, 100);
    } else {
      console.error("❌ Google OAuth response missing required fields:", {
        hasToken: !!response.token,
        hasRefreshToken: !!response.refreshToken,
        hasUser: !!response.user,
      });
      toast.error("Google login failed - invalid response");
    }
  };

  const handleGoogleError = (error: any) => {
    console.error("Google OAuth error:", error);
  };

  const handleLineSuccess = (response: any) => {
    console.log("🔐 LINE OAuth response:", response);
    // LINE OAuth success - need to set token, refreshToken and user in AuthContext
    if (response.token && response.refreshToken && response.user) {
      // Set token, refreshToken and user in AuthContext
      setAuthData(response.token, response.refreshToken, response.user);

      toast.success("LINE login successful!");

      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        console.log("🚀 Navigating to stories after LINE OAuth");
        router.push("/stories");
      }, 100);
    } else {
      console.error("❌ LINE OAuth response missing required fields:", {
        hasToken: !!response.token,
        hasRefreshToken: !!response.refreshToken,
        hasUser: !!response.user,
      });
      toast.error("LINE login failed - invalid response");
    }
  };

  const handleLineError = (error: any) => {
    console.error("LINE OAuth error:", error);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/mountain.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-sm w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/30">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
            Welcome Back
          </h1>
          <p className="text-white/80 text-sm">
            Sign in to your NoManWeb account
          </p>
        </div>

        {/* OAuth Sign-In */}
        <div className="mb-4 space-y-4">
          <GoogleSignIn
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
          <LineSignIn onSuccess={handleLineSuccess} onError={handleLineError} />
        </div>

        <div className="relative mb-4">
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/80 font-medium">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                type="email"
                className="w-full pl-7 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white text-base"
                placeholder="Email"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                type={showPassword ? "text" : "password"}
                className="w-full pl-7 pr-12 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white text-base"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register("rememberMe")}
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#20243c] focus:ring-[#20243c] border-white/30 rounded bg-white/20 accent-[#20243c]"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-white/80"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-white/80 hover:text-white transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 mt-6 border border-white/30 rounded-xl shadow-lg text-sm font-semibold text-white bg-[#20243c] hover:bg-[#23274a] focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Signing in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-white/80 text-xs">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-300 hover:text-blue-200 font-semibold transition-colors underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
