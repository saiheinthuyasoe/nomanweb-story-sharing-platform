"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, User, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RegisterForm {
  email: string;
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        username: data.username,
        password: data.password,
        displayName: data.displayName,
      });
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
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
            Create Account
          </h1>
          <p className="text-white/80 text-sm">Join NoManWeb today</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                autoComplete="email"
                className="w-full pl-8 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Email"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.email.message}
              </p>
            )}

            <div className="relative">
              <User className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register("username", {
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                  maxLength: {
                    value: 50,
                    message: "Username must be less than 50 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message:
                      "Username can only contain letters, numbers, and underscores",
                  },
                })}
                type="text"
                autoComplete="username"
                className="w-full pl-8 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Username"
              />
            </div>
            {errors.username && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.username.message}
              </p>
            )}

            <div className="relative">
              <User className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register("displayName", {
                  maxLength: {
                    value: 100,
                    message: "Display name must be less than 100 characters",
                  },
                })}
                type="text"
                className="w-full pl-8 pr-4 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Display Name (Optional)"
              />
            </div>
            {errors.displayName && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.displayName.message}
              </p>
            )}

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
                autoComplete="new-password"
                className="w-full pl-8 pr-12 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
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

            <div className="relative">
              <Lock className="absolute left-0 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                className="w-full pl-8 pr-12 py-2 bg-transparent border-0 border-b-2 border-white/40 focus:outline-none focus:border-white focus:border-b-2 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 mt-6 border border-white/30 rounded-xl shadow-lg text-sm font-semibold text-white bg-[#20243c] hover:bg-[#23274a] focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Creating account...
              </div>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-white/80">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-white hover:text-white/80 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
