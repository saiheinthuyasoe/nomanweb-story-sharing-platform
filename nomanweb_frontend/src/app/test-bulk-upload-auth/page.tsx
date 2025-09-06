"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";

export default function TestBulkUploadAuthPage() {
  const { user, loading } = useAuth();
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = Cookies.get("token");
    const refreshToken = Cookies.get("refreshToken");

    let tokenInfo = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Date.now() / 1000;
        tokenInfo = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
          issuedAt: new Date(payload.iat * 1000).toLocaleString(),
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: now > payload.exp,
          timeUntilExpiry: Math.floor((payload.exp - now) / 60) + " minutes",
        };
      } catch (error) {
        tokenInfo = { error: "Failed to decode token" };
      }
    }

    setAuthStatus({
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenInfo,
      user,
      loading,
    });
  };

  const testBulkUploadAuth = async () => {
    setTestResult("Testing bulk upload authentication...");

    const token = Cookies.get("token");
    if (!token) {
      setTestResult("❌ No authentication token found. Please log in first.");
      return;
    }

    try {
      // Test the exact same endpoint that bulk upload uses
      const testFile = new File(["Test content"], "test.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("file", testFile);
      formData.append("storyId", "2059391b-751e-4a93-8777-41e9a4a0d663"); // The story ID from the error

      const response = await fetch(
        "/api/chapters/story/2059391b-751e-4a93-8777-41e9a4a0d663/bulk-upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          credentials: "include",
        }
      );

      if (response.ok) {
        setTestResult(
          "✅ Authentication successful! Bulk upload endpoint is accessible."
        );
      } else {
        const errorText = await response.text();
        setTestResult(
          `❌ Authentication failed: ${response.status} ${response.statusText}\nError: ${errorText}`
        );
      }
    } catch (error) {
      setTestResult(`❌ Request failed: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading authentication status...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Bulk Upload Authentication Test
      </h1>

      <div className="space-y-6">
        {/* Authentication Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <button
            onClick={checkAuthStatus}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Status
          </button>

          {authStatus && (
            <div className="space-y-2 text-sm">
              <p>
                <strong>User Logged In:</strong>{" "}
                {authStatus.user ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Has Token:</strong>{" "}
                {authStatus.hasToken ? "✅ Yes" : "❌ No"}
              </p>
              <p>
                <strong>Has Refresh Token:</strong>{" "}
                {authStatus.hasRefreshToken ? "✅ Yes" : "❌ No"}
              </p>

              {authStatus.user && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p>
                    <strong>User ID:</strong> {authStatus.user.id}
                  </p>
                  <p>
                    <strong>Email:</strong> {authStatus.user.email}
                  </p>
                  <p>
                    <strong>Username:</strong> {authStatus.user.username}
                  </p>
                  <p>
                    <strong>Role:</strong> {authStatus.user.role}
                  </p>
                </div>
              )}

              {authStatus.tokenInfo && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <h3 className="font-semibold">Token Information:</h3>
                  {authStatus.tokenInfo.error ? (
                    <p className="text-red-600">{authStatus.tokenInfo.error}</p>
                  ) : (
                    <div className="space-y-1">
                      <p>
                        <strong>User ID:</strong> {authStatus.tokenInfo.userId}
                      </p>
                      <p>
                        <strong>Email:</strong> {authStatus.tokenInfo.email}
                      </p>
                      <p>
                        <strong>Role:</strong> {authStatus.tokenInfo.role}
                      </p>
                      <p>
                        <strong>Issued At:</strong>{" "}
                        {authStatus.tokenInfo.issuedAt}
                      </p>
                      <p>
                        <strong>Expires At:</strong>{" "}
                        {authStatus.tokenInfo.expiresAt}
                      </p>
                      <p>
                        <strong>Is Expired:</strong>{" "}
                        {authStatus.tokenInfo.isExpired ? "❌ Yes" : "✅ No"}
                      </p>
                      <p>
                        <strong>Time Until Expiry:</strong>{" "}
                        {authStatus.tokenInfo.timeUntilExpiry}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Bulk Upload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Test Bulk Upload Endpoint
          </h2>
          <button
            onClick={testBulkUploadAuth}
            className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={!authStatus?.hasToken}
          >
            Test Bulk Upload Authentication
          </button>

          {testResult && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <a
              href="/login"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login
            </a>
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </a>
            <a
              href="/debug-auth"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Debug Auth Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
