"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api/auth";
import Cookies from "js-cookie";
import TokenMonitor from "@/components/TokenMonitor";

export default function TestJwtFlowPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearLogs = () => setLogs([]);

  const testTokenInspection = async () => {
    setIsTesting(true);
    addLog("=== TOKEN INSPECTION ===");

    try {
      const accessToken = Cookies.get("token");
      const refreshToken = Cookies.get("refreshToken");

      addLog(`Access Token: ${accessToken ? "Present" : "Missing"}`);
      addLog(`Refresh Token: ${refreshToken ? "Present" : "Missing"}`);

      if (accessToken && refreshToken) {
        // Parse JWT tokens to inspect expiration
        try {
          const parseJWT = (token: string) => {
            const parts = token.split(".");
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]));
            return payload;
          };

          const accessPayload = parseJWT(accessToken);
          const refreshPayload = parseJWT(refreshToken);

          if (accessPayload) {
            const accessExp = new Date(accessPayload.exp * 1000);
            const now = new Date();
            const timeLeft = Math.round(
              (accessExp.getTime() - now.getTime()) / 1000
            );

            addLog(`Access Token expires at: ${accessExp.toLocaleString()}`);
            addLog(`Access Token time left: ${timeLeft} seconds (30s total)`);
            addLog(`Access Token is ${timeLeft > 0 ? "VALID" : "EXPIRED"}`);
          }

          if (refreshPayload) {
            const refreshExp = new Date(refreshPayload.exp * 1000);
            const now = new Date();
            const timeLeft = Math.round(
              (refreshExp.getTime() - now.getTime()) / 1000
            );

            addLog(`Refresh Token expires at: ${refreshExp.toLocaleString()}`);
            addLog(`Refresh Token time left: ${timeLeft} seconds (60s total)`);
            addLog(`Refresh Token is ${timeLeft > 0 ? "VALID" : "EXPIRED"}`);
          }

          // Check if tokens are identical (they shouldn't be)
          const tokensIdentical = accessToken === refreshToken;
          addLog(`Security Check - Tokens identical: ${tokensIdentical}`);

          if (tokensIdentical) {
            addLog("⚠️ WARNING: Access and refresh tokens are the same!");
          }
        } catch (e) {
          addLog(`Error parsing tokens: ${e}`);
        }
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testApiCall = async () => {
    setIsTesting(true);
    addLog("=== TESTING API CALL ===");

    try {
      const profile = await authApi.getProfile();
      addLog(`✅ API call successful: ${profile.email}`);
      addLog(`User ID: ${profile.id}`);
      addLog(`Role: ${profile.role}`);
    } catch (error: any) {
      addLog(`❌ API call failed: ${error.response?.status || error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testRefreshToken = async () => {
    setIsTesting(true);
    addLog("=== TESTING REFRESH TOKEN ===");

    try {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        addLog("❌ No refresh token available");
        return;
      }

      addLog("Calling refresh token API...");
      const response = await authApi.refreshToken(refreshToken);
      addLog(`✅ Refresh successful!`);
      addLog(`New access token: ${response.token ? "Present" : "Missing"}`);
      addLog(
        `New refresh token: ${response.refreshToken ? "Present" : "Missing"}`
      );

      // Check if tokens were rotated
      const newRefreshToken = Cookies.get("refreshToken");
      const tokensRotated = refreshToken !== newRefreshToken;
      addLog(`Refresh token rotated: ${tokensRotated ? "YES ✅" : "NO ❌"}`);
    } catch (error: any) {
      addLog(
        `❌ Refresh failed: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testLogout = async () => {
    setIsTesting(true);
    addLog("=== TESTING LOGOUT ===");

    try {
      const refreshToken = Cookies.get("refreshToken");
      if (refreshToken) {
        await authApi.logout(refreshToken);
        addLog("✅ Logout API call successful");
      } else {
        addLog("⚠️ No refresh token to send to logout API");
      }
    } catch (error: any) {
      addLog(
        `❌ Logout API call failed: ${error.response?.status || error.message}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testAutomaticRefresh = async () => {
    setIsTesting(true);
    addLog("=== TESTING AUTOMATIC REFRESH ===");

    try {
      // First, check current token expiration
      const accessToken = Cookies.get("token");
      if (!accessToken) {
        addLog("❌ No access token available");
        return;
      }

      // Parse token to get expiration
      const parts = accessToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      const exp = new Date(payload.exp * 1000);
      const now = new Date();
      const timeLeft = Math.round((exp.getTime() - now.getTime()) / 1000);

      addLog(`Current access token expires in: ${timeLeft} seconds`);

      if (timeLeft > 0) {
        addLog(`⏰ Waiting ${timeLeft + 5} seconds for token to expire...`);
        await new Promise((resolve) =>
          setTimeout(resolve, (timeLeft + 5) * 1000)
        );
      }

      addLog("🔄 Making API call that should trigger automatic refresh...");
      const profile = await authApi.getProfile();
      addLog(`✅ Automatic refresh successful! User: ${profile.email}`);

      // Check if tokens were updated
      const newAccessToken = Cookies.get("token");
      const tokensUpdated = accessToken !== newAccessToken;
      addLog(`Tokens updated: ${tokensUpdated ? "YES ✅" : "NO ❌"}`);
    } catch (error: any) {
      addLog(
        `❌ Automatic refresh failed: ${
          error.response?.status || error.message
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testRouteChangeRefresh = async () => {
    setIsTesting(true);
    addLog("=== TESTING ROUTE CHANGE REFRESH ===");

    try {
      // First, check current token expiration
      const accessToken = Cookies.get("token");
      const refreshToken = Cookies.get("refreshToken");

      addLog(`Access Token: ${accessToken ? "Present" : "Missing"}`);
      addLog(`Refresh Token: ${refreshToken ? "Present" : "Missing"}`);

      if (!accessToken || !refreshToken) {
        addLog("❌ Tokens not available");
        return;
      }

      // Parse token to get expiration
      const parts = accessToken.split(".");
      const payload = JSON.parse(atob(parts[1]));
      const exp = new Date(payload.exp * 1000);
      const now = new Date();
      const timeLeft = Math.round((exp.getTime() - now.getTime()) / 1000);

      addLog(`Current access token expires in: ${timeLeft} seconds`);

      if (timeLeft > 0) {
        addLog(`⏰ Waiting ${timeLeft + 5} seconds for token to expire...`);
        await new Promise((resolve) =>
          setTimeout(resolve, (timeLeft + 5) * 1000)
        );
      }

      addLog("🔄 Simulating route change by calling refresh token API...");

      // Call the refresh token API directly
      const currentRefreshToken = Cookies.get("refreshToken");
      if (currentRefreshToken) {
        try {
          const response = await authApi.refreshToken(currentRefreshToken);
          addLog("✅ Route change refresh successful!");

          // Check if tokens were updated
          const newAccessToken = Cookies.get("token");
          const newRefreshToken = Cookies.get("refreshToken");
          const tokensUpdated = accessToken !== newAccessToken;
          addLog(`Tokens updated: ${tokensUpdated ? "YES ✅" : "NO ❌"}`);
          addLog(`New access token: ${newAccessToken ? "Present" : "Missing"}`);
          addLog(
            `New refresh token: ${newRefreshToken ? "Present" : "Missing"}`
          );
        } catch (error: any) {
          addLog(
            `❌ Route change refresh failed: ${
              error.response?.status || error.message
            }`
          );
        }
      } else {
        addLog("❌ No refresh token available");
      }
    } catch (error: any) {
      addLog(
        `❌ Route change refresh failed: ${
          error.response?.status || error.message
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testWaitAndNavigate = async () => {
    setIsTesting(true);
    addLog("=== TESTING WAIT 35s AND NAVIGATE ===");

    try {
      addLog("⏰ Waiting 35 seconds for token to expire...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      addLog("🔄 Making API call after 35 seconds...");
      const profile = await authApi.getProfile();
      addLog(`✅ API call successful after 35s: ${profile.email}`);

      // Check if tokens are still present
      const accessToken = Cookies.get("token");
      const refreshToken = Cookies.get("refreshToken");
      addLog(`Access Token after 35s: ${accessToken ? "Present" : "Missing"}`);
      addLog(
        `Refresh Token after 35s: ${refreshToken ? "Present" : "Missing"}`
      );
    } catch (error: any) {
      addLog(
        `❌ API call after 35s failed: ${
          error.response?.status || error.message
        }`
      );

      // Check if tokens are still present even after error
      const accessToken = Cookies.get("token");
      const refreshToken = Cookies.get("refreshToken");
      addLog(
        `Access Token after error: ${accessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Refresh Token after error: ${refreshToken ? "Present" : "Missing"}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testTokenPersistence = async () => {
    setIsTesting(true);
    addLog("=== TESTING TOKEN PERSISTENCE ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait 35 seconds
      addLog("⏰ Waiting 35 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // Check tokens after wait (without any API calls)
      const afterWaitAccessToken = Cookies.get("token");
      const afterWaitRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After 35s Access Token: ${
          afterWaitAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After 35s Refresh Token: ${
          afterWaitRefreshToken ? "Present" : "Missing"
        }`
      );

      // Try to navigate to a different page (simulate route change)
      addLog("🔄 Simulating route change...");
      window.history.pushState({}, "", "/test-jwt-flow?test=1");

      // Check tokens after route change
      const afterRouteAccessToken = Cookies.get("token");
      const afterRouteRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After route change Access Token: ${
          afterRouteAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After route change Refresh Token: ${
          afterRouteRefreshToken ? "Present" : "Missing"
        }`
      );

      // Try to make an API call
      addLog("🔄 Making API call...");
      const profile = await authApi.getProfile();
      addLog(`✅ API call successful: ${profile.email}`);

      // Check tokens after API call
      const afterApiAccessToken = Cookies.get("token");
      const afterApiRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After API call Access Token: ${
          afterApiAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After API call Refresh Token: ${
          afterApiRefreshToken ? "Present" : "Missing"
        }`
      );
    } catch (error: any) {
      addLog(`❌ Test failed: ${error.response?.status || error.message}`);

      // Check tokens after error
      const afterErrorAccessToken = Cookies.get("token");
      const afterErrorRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After error Access Token: ${
          afterErrorAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After error Refresh Token: ${
          afterErrorRefreshToken ? "Present" : "Missing"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testSimpleNavigation = async () => {
    setIsTesting(true);
    addLog("=== TESTING SIMPLE NAVIGATION ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait 35 seconds
      addLog("⏰ Waiting 35 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // Check tokens after wait
      const afterWaitAccessToken = Cookies.get("token");
      const afterWaitRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After 35s Access Token: ${
          afterWaitAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After 35s Refresh Token: ${
          afterWaitRefreshToken ? "Present" : "Missing"
        }`
      );

      // Just navigate without making any API calls
      addLog("🔄 Navigating to dashboard...");
      window.location.href = "/dashboard";
    } catch (error: any) {
      addLog(`❌ Test failed: ${error.response?.status || error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testMultipleRefreshes = async () => {
    setIsTesting(true);
    addLog("=== TESTING MULTIPLE REFRESHES ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait for token to expire
      addLog("⏰ Waiting 35 seconds for token to expire...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // First refresh
      addLog("🔄 Attempting first refresh...");
      const firstRefreshToken = Cookies.get("refreshToken");
      if (firstRefreshToken) {
        const firstResponse = await authApi.refreshToken(firstRefreshToken);
        addLog("✅ First refresh successful");

        // Check if tokens were updated
        const afterFirstAccessToken = Cookies.get("token");
        const afterFirstRefreshToken = Cookies.get("refreshToken");
        const tokensUpdated = initialAccessToken !== afterFirstAccessToken;
        addLog(
          `Tokens updated after first refresh: ${
            tokensUpdated ? "YES ✅" : "NO ❌"
          }`
        );
        addLog(
          `Refresh token rotated: ${
            initialRefreshToken !== afterFirstRefreshToken ? "YES ✅" : "NO ❌"
          }`
        );

        // Wait a bit more
        addLog("⏰ Waiting 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Second refresh
        addLog("🔄 Attempting second refresh...");
        const secondRefreshToken = Cookies.get("refreshToken");
        if (secondRefreshToken) {
          const secondResponse = await authApi.refreshToken(secondRefreshToken);
          addLog("✅ Second refresh successful");

          // Check if tokens were updated again
          const afterSecondAccessToken = Cookies.get("token");
          const afterSecondRefreshToken = Cookies.get("refreshToken");
          const secondTokensUpdated =
            afterFirstAccessToken !== afterSecondAccessToken;
          addLog(
            `Tokens updated after second refresh: ${
              secondTokensUpdated ? "YES ✅" : "NO ❌"
            }`
          );
          addLog(
            `Refresh token rotated again: ${
              afterFirstRefreshToken !== afterSecondRefreshToken
                ? "YES ✅"
                : "NO ❌"
            }`
          );

          // Try a third refresh
          addLog("🔄 Attempting third refresh...");
          const thirdRefreshToken = Cookies.get("refreshToken");
          if (thirdRefreshToken) {
            const thirdResponse = await authApi.refreshToken(thirdRefreshToken);
            addLog("✅ Third refresh successful");

            // Check final token state
            const finalAccessToken = Cookies.get("token");
            const finalRefreshToken = Cookies.get("refreshToken");
            addLog(
              `Final Access Token: ${finalAccessToken ? "Present" : "Missing"}`
            );
            addLog(
              `Final Refresh Token: ${
                finalRefreshToken ? "Present" : "Missing"
              }`
            );
          } else {
            addLog("❌ No refresh token available for third refresh");
          }
        } else {
          addLog("❌ No refresh token available for second refresh");
        }
      } else {
        addLog("❌ No refresh token available for first refresh");
      }
    } catch (error: any) {
      addLog(
        `❌ Multiple refreshes test failed: ${
          error.response?.status || error.message
        }`
      );

      // Check tokens after error
      const afterErrorAccessToken = Cookies.get("token");
      const afterErrorRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After error Access Token: ${
          afterErrorAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After error Refresh Token: ${
          afterErrorRefreshToken ? "Present" : "Missing"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testConsecutiveApiCalls = async () => {
    setIsTesting(true);
    addLog("=== TESTING CONSECUTIVE API CALLS ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait for token to expire
      addLog("⏰ Waiting 35 seconds for access token to expire...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // First API call (should trigger refresh)
      addLog("🔄 Making first API call...");
      const profile1 = await authApi.getProfile();
      addLog(`✅ First API call successful: ${profile1.email}`);

      // Check tokens after first call
      const afterFirstAccessToken = Cookies.get("token");
      const afterFirstRefreshToken = Cookies.get("refreshToken");
      const firstTokensUpdated = initialAccessToken !== afterFirstAccessToken;
      addLog(
        `Tokens updated after first call: ${
          firstTokensUpdated ? "YES ✅" : "NO ❌"
        }`
      );

      // Wait 5 seconds
      addLog("⏰ Waiting 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Second API call (should trigger refresh again)
      addLog("🔄 Making second API call...");
      const profile2 = await authApi.getProfile();
      addLog(`✅ Second API call successful: ${profile2.email}`);

      // Check tokens after second call
      const afterSecondAccessToken = Cookies.get("token");
      const afterSecondRefreshToken = Cookies.get("refreshToken");
      const secondTokensUpdated =
        afterFirstAccessToken !== afterSecondAccessToken;
      addLog(
        `Tokens updated after second call: ${
          secondTokensUpdated ? "YES ✅" : "NO ❌"
        }`
      );

      // Wait 5 seconds
      addLog("⏰ Waiting 5 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Third API call (should trigger refresh again)
      addLog("🔄 Making third API call...");
      const profile3 = await authApi.getProfile();
      addLog(`✅ Third API call successful: ${profile3.email}`);

      // Check tokens after third call
      const afterThirdAccessToken = Cookies.get("token");
      const afterThirdRefreshToken = Cookies.get("refreshToken");
      const thirdTokensUpdated =
        afterSecondAccessToken !== afterThirdAccessToken;
      addLog(
        `Tokens updated after third call: ${
          thirdTokensUpdated ? "YES ✅" : "NO ❌"
        }`
      );

      // Final token state
      addLog(
        `Final Access Token: ${afterThirdAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Final Refresh Token: ${afterThirdRefreshToken ? "Present" : "Missing"}`
      );
    } catch (error: any) {
      addLog(
        `❌ Consecutive API calls test failed: ${
          error.response?.status || error.message
        }`
      );

      // Check tokens after error
      const afterErrorAccessToken = Cookies.get("token");
      const afterErrorRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After error Access Token: ${
          afterErrorAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After error Refresh Token: ${
          afterErrorRefreshToken ? "Present" : "Missing"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testRefreshTokenExpiration = async () => {
    setIsTesting(true);
    addLog("=== TESTING REFRESH TOKEN EXPIRATION ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      if (initialRefreshToken) {
        // Parse refresh token to check expiration
        const parts = initialRefreshToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = new Date(payload.exp * 1000);
          const now = new Date();
          const timeLeft = Math.round((exp.getTime() - now.getTime()) / 1000);

          addLog(`Refresh token expires in: ${timeLeft} seconds`);
          addLog(`Refresh token expiration: ${exp.toISOString()}`);

          if (timeLeft > 0) {
            addLog(
              `⏰ Waiting ${
                timeLeft + 10
              } seconds for refresh token to expire...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, (timeLeft + 10) * 1000)
            );

            // Try to refresh after expiration
            addLog("🔄 Attempting refresh after expiration...");
            try {
              const response = await authApi.refreshToken(initialRefreshToken);
              addLog("❌ Refresh succeeded when it should have failed!");
            } catch (error: any) {
              addLog(
                `✅ Refresh failed as expected: ${
                  error.response?.status || error.message
                }`
              );
            }
          } else {
            addLog("⚠️ Refresh token already expired");
          }
        } else {
          addLog("❌ Invalid refresh token format");
        }
      } else {
        addLog("❌ No refresh token available");
      }
    } catch (error: any) {
      addLog(
        `❌ Refresh token expiration test failed: ${
          error.response?.status || error.message
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testInterceptorRefresh = async () => {
    setIsTesting(true);
    addLog("=== TESTING INTERCEPTOR REFRESH ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait for token to expire
      addLog("⏰ Waiting 35 seconds for access token to expire...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // Make an API call that should trigger automatic refresh
      addLog("🔄 Making API call that should trigger automatic refresh...");
      const profile = await authApi.getProfile();
      addLog(`✅ API call successful: ${profile.email}`);

      // Check if tokens were updated by the interceptor
      const afterApiAccessToken = Cookies.get("token");
      const afterApiRefreshToken = Cookies.get("refreshToken");
      const accessTokenUpdated = initialAccessToken !== afterApiAccessToken;
      const refreshTokenUpdated = initialRefreshToken !== afterApiRefreshToken;

      addLog(
        `Access token updated by interceptor: ${
          accessTokenUpdated ? "YES ✅" : "NO ❌"
        }`
      );
      addLog(
        `Refresh token updated by interceptor: ${
          refreshTokenUpdated ? "YES ✅" : "NO ❌"
        }`
      );
      addLog(
        `New access token: ${afterApiAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `New refresh token: ${afterApiRefreshToken ? "Present" : "Missing"}`
      );

      // Try another API call to verify the new tokens work
      addLog("🔄 Making second API call to verify new tokens...");
      const profile2 = await authApi.getProfile();
      addLog(`✅ Second API call successful: ${profile2.email}`);
    } catch (error: any) {
      addLog(
        `❌ Interceptor refresh test failed: ${
          error.response?.status || error.message
        }`
      );

      // Check tokens after error
      const afterErrorAccessToken = Cookies.get("token");
      const afterErrorRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After error Access Token: ${
          afterErrorAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After error Refresh Token: ${
          afterErrorRefreshToken ? "Present" : "Missing"
        }`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const testDirectApiCall = async () => {
    setIsTesting(true);
    addLog("=== TESTING DIRECT API CALL ===");

    try {
      // Check initial tokens
      const initialAccessToken = Cookies.get("token");
      const initialRefreshToken = Cookies.get("refreshToken");
      addLog(
        `Initial Access Token: ${initialAccessToken ? "Present" : "Missing"}`
      );
      addLog(
        `Initial Refresh Token: ${initialRefreshToken ? "Present" : "Missing"}`
      );

      // Wait for token to expire
      addLog("⏰ Waiting 35 seconds for access token to expire...");
      await new Promise((resolve) => setTimeout(resolve, 35000));

      // Make a direct API call using fetch to bypass axios interceptors
      addLog("🔄 Making direct fetch API call...");
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
        }/auth/profile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${initialAccessToken}`,
          },
        }
      );

      if (response.ok) {
        const profile = await response.json();
        addLog(`✅ Direct API call successful: ${profile.email}`);
      } else {
        addLog(
          `❌ Direct API call failed: ${response.status} ${response.statusText}`
        );
      }

      // Check tokens after direct call
      const afterDirectAccessToken = Cookies.get("token");
      const afterDirectRefreshToken = Cookies.get("refreshToken");
      addLog(
        `After direct call Access Token: ${
          afterDirectAccessToken ? "Present" : "Missing"
        }`
      );
      addLog(
        `After direct call Refresh Token: ${
          afterDirectRefreshToken ? "Present" : "Missing"
        }`
      );
    } catch (error: any) {
      addLog(`❌ Direct API call test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">JWT Authentication Flow Test</h1>

      {user ? (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="text-lg font-semibold text-green-800">Logged In</h2>
          <p className="text-green-700">User: {user.email}</p>
          <p className="text-green-700">Role: {user.role}</p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded">
          <h2 className="text-lg font-semibold text-red-800">Not Logged In</h2>
          <p className="text-red-700">
            Please log in to test the authentication flow
          </p>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={clearLogs}
          className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
        >
          Clear Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testTokenInspection}
          disabled={isTesting}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Inspect Tokens
        </button>

        <button
          onClick={testApiCall}
          disabled={isTesting}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test API Call
        </button>

        <button
          onClick={testRefreshToken}
          disabled={isTesting}
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Refresh Token
        </button>

        <button
          onClick={testAutomaticRefresh}
          disabled={isTesting}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Auto Refresh
        </button>

        <button
          onClick={testRouteChangeRefresh}
          disabled={isTesting}
          className="bg-indigo-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Route Refresh
        </button>

        <button
          onClick={testLogout}
          disabled={isTesting}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Logout
        </button>

        <button
          onClick={testWaitAndNavigate}
          disabled={isTesting}
          className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Wait 35s & API Call
        </button>

        <button
          onClick={testTokenPersistence}
          disabled={isTesting}
          className="bg-teal-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Token Persistence
        </button>

        <button
          onClick={testSimpleNavigation}
          disabled={isTesting}
          className="bg-pink-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Simple Navigation
        </button>

        <button
          onClick={testMultipleRefreshes}
          disabled={isTesting}
          className="bg-cyan-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Multiple Refreshes
        </button>

        <button
          onClick={testRefreshTokenExpiration}
          disabled={isTesting}
          className="bg-violet-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Refresh Token Expiration
        </button>

        <button
          onClick={testInterceptorRefresh}
          disabled={isTesting}
          className="bg-emerald-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Interceptor Refresh
        </button>

        <button
          onClick={testDirectApiCall}
          disabled={isTesting}
          className="bg-amber-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Direct API Call
        </button>

        <button
          onClick={testConsecutiveApiCalls}
          disabled={isTesting}
          className="bg-lime-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Test Consecutive API Calls
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Test Logs</h3>
        <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">
              No logs yet. Run a test to see results.
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <TokenMonitor />
    </div>
  );
}
