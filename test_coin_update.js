// Test script to trigger coin balance updates
// This script will help us test the real-time coin balance updates

const API_BASE = "http://localhost:8080";

// Function to get auth token from browser cookies
function getAuthToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "token") {
      return value;
    }
  }
  return null;
}

// Function to get current user info
async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) {
    console.error("❌ No auth token found");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      console.log("👤 Current user:", {
        id: user.id,
        username: user.username,
        email: user.email,
        coinBalance: user.coinBalance,
      });
      return user;
    } else {
      console.error("❌ Failed to get user profile:", response.status);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    return null;
  }
}

// Function to test admin coin transfer (requires admin privileges)
async function testCoinTransfer(
  userIdentifier,
  amount = 10,
  type = "transfer"
) {
  const token = getAuthToken();
  if (!token) {
    console.error("❌ No auth token found");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin/coins/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userIdentifier: userIdentifier,
        amount: amount,
        type: type,
        reason: "Test coin balance real-time update",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Coin transfer successful:", result);
      return result;
    } else {
      const error = await response.json();
      console.error("❌ Coin transfer failed:", error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error during coin transfer:", error);
    return null;
  }
}

// Function to check SSE connection status
function checkSSEConnection() {
  console.log("🔍 Checking SSE connection status...");

  // Check if there are any EventSource connections
  const eventSources = [];

  // This is a bit tricky to check from the outside, but we can look at network tab
  console.log("📡 Please check the Network tab in DevTools for:");
  console.log("   - Connection to: /api/coins/sse/balance-updates");
  console.log('   - Status should be "pending" or "200"');
  console.log('   - Type should be "eventsource"');
}

// Main test function
async function testRealTimeCoinBalance() {
  console.log("🧪 Starting real-time coin balance test...");

  // Step 1: Get current user
  const user = await getCurrentUser();
  if (!user) {
    console.error("❌ Cannot proceed without user information");
    return;
  }

  // Step 2: Check SSE connection
  checkSSEConnection();

  // Step 3: Test coin transfer (this will trigger SSE update)
  console.log("💰 Testing coin transfer...");
  const result = await testCoinTransfer(user.username, 5, "transfer");

  if (result) {
    console.log(
      "✅ Test completed! Check if the coin balance in the navbar updated automatically."
    );
    console.log("📊 Expected new balance:", result.newBalance);
    console.log(
      "🔄 If the balance didn't update, there might be an issue with the SSE connection or React Query invalidation."
    );
  }
}

// Export functions for manual testing
window.testRealTimeCoinBalance = testRealTimeCoinBalance;
window.getCurrentUser = getCurrentUser;
window.testCoinTransfer = testCoinTransfer;
window.checkSSEConnection = checkSSEConnection;

console.log(
  "🧪 Test functions loaded! Run testRealTimeCoinBalance() to start testing."
);
console.log("📋 Available functions:");
console.log("   - testRealTimeCoinBalance() - Full test");
console.log("   - getCurrentUser() - Get current user info");
console.log(
  "   - testCoinTransfer(username, amount, type) - Test coin transfer"
);
console.log("   - checkSSEConnection() - Check SSE status");
