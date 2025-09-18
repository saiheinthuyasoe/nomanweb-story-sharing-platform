// Test script for coin balance real-time updates
// Run this in the browser console to test the coin balance update flow

console.log("🧪 Coin Balance Update Test Script Loaded");

// Function to test coin balance update
async function testCoinBalanceUpdate() {
  console.log("🚀 Starting coin balance update test...");
  
  // Get current user info
  const userResponse = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
    }
  });
  
  if (!userResponse.ok) {
    console.error("❌ Failed to get user info");
    return;
  }
  
  const user = await userResponse.json();
  console.log("👤 Current user:", user);
  console.log("💰 Current balance:", user.coinBalance);
  
  // Test coin transfer via admin endpoint
  const transferAmount = 5;
  console.log(`💸 Testing transfer of ${transferAmount} coins...`);
  
  const transferResponse = await fetch('/api/admin/coins/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
    },
    body: JSON.stringify({
      username: user.username,
      amount: transferAmount,
      type: 'transfer',
      reason: 'Test transfer for real-time update'
    })
  });
  
  if (!transferResponse.ok) {
    console.error("❌ Transfer failed:", await transferResponse.text());
    return;
  }
  
  const transferResult = await transferResponse.json();
  console.log("✅ Transfer successful:", transferResult);
  console.log("📊 Expected new balance:", transferResult.newBalance);
  
  // Monitor for UI updates
  console.log("👀 Monitoring for UI updates...");
  console.log("🔍 Check the profile dropdown in the navbar for balance changes");
  
  // Set up a timer to check if balance updated in UI
  let checkCount = 0;
  const maxChecks = 36; // 3 minutes worth of checks (5 second intervals)
  
  const checkInterval = setInterval(() => {
    checkCount++;
    const navbarBalance = document.querySelector('[data-testid="coin-balance"]')?.textContent;
    console.log(`⏰ Check ${checkCount}/${maxChecks} - Navbar balance: ${navbarBalance}`);
    
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.log("⏰ Test completed - 3 minutes elapsed");
      console.log("📋 Summary:");
      console.log(`   - Expected balance: ${transferResult.newBalance}`);
      console.log(`   - Current navbar balance: ${navbarBalance}`);
      console.log(`   - Update successful: ${navbarBalance == transferResult.newBalance ? '✅' : '❌'}`);
    }
  }, 5000);
  
  return transferResult;
}

// Function to check SSE connection status
function checkSSEStatus() {
  console.log("🔍 Checking SSE connection status...");
  
  // Check if SSE logs are present in console
  const originalLog = console.log;
  let sseConnected = false;
  
  console.log = (...args) => {
    if (args[0]?.includes?.("✅ Connected to coin balance updates SSE")) {
      sseConnected = true;
      console.log("✅ SSE connection detected!");
    }
    originalLog.apply(console, args);
  };
  
  // Restore original console.log after a short delay
  setTimeout(() => {
    console.log = originalLog;
    console.log(`🔗 SSE Status: ${sseConnected ? 'Connected' : 'Not detected'}`);
  }, 1000);
}

// Function to manually trigger balance refresh
async function refreshBalance() {
  console.log("🔄 Manually refreshing balance...");
  
  // Trigger React Query refetch
  if (window.queryClient) {
    await window.queryClient.refetchQueries({ queryKey: ['coin-balance'] });
    console.log("✅ React Query refetch triggered");
  } else {
    console.log("❌ React Query client not found");
  }
}

// Export functions to global scope
window.testCoinBalanceUpdate = testCoinBalanceUpdate;
window.checkSSEStatus = checkSSEStatus;
window.refreshBalance = refreshBalance;

console.log("📋 Available test functions:");
console.log("   - testCoinBalanceUpdate() - Full test with timing");
console.log("   - checkSSEStatus() - Check SSE connection");
console.log("   - refreshBalance() - Manual balance refresh");
console.log("");
console.log("🚀 Run testCoinBalanceUpdate() to start testing!");