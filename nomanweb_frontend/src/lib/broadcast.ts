// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Store active SSE connections for coin transfers
const transferConnections = new Set<ReadableStreamDefaultController>();

// Global type declaration for development mode
declare global {
  var __sseConnections: Set<ReadableStreamDefaultController> | undefined;
  var __sseTransferConnections:
    | Set<ReadableStreamDefaultController>
    | undefined;
}

// Global storage fallback for development mode
if (typeof global !== "undefined") {
  if (!global.__sseConnections) {
    global.__sseConnections = new Set<ReadableStreamDefaultController>();
  }
  if (!global.__sseTransferConnections) {
    global.__sseTransferConnections =
      new Set<ReadableStreamDefaultController>();
  }
}

function getConnections() {
  // Use global storage in development to persist across module reloads
  if (typeof global !== "undefined" && global.__sseConnections) {
    return global.__sseConnections;
  }
  return connections;
}

function getTransferConnections() {
  // Use global storage in development to persist across module reloads
  if (typeof global !== "undefined" && global.__sseTransferConnections) {
    return global.__sseTransferConnections;
  }
  return transferConnections;
}

export function getConnectionCount() {
  return getConnections().size;
}

export function getTransferConnectionCount() {
  return getTransferConnections().size;
}

export function addConnection(controller: ReadableStreamDefaultController) {
  const conns = getConnections();
  conns.add(controller);
  console.log(`🔗 SSE connection added. Total connections: ${conns.size}`);
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  const conns = getConnections();
  conns.delete(controller);
  console.log(`❌ SSE connection removed. Total connections: ${conns.size}`);
}

export function addTransferConnection(
  controller: ReadableStreamDefaultController
) {
  const conns = getTransferConnections();
  conns.add(controller);
  console.log(
    `🔗 Transfer SSE connection added. Total transfer connections: ${conns.size}`
  );
}

export function removeTransferConnection(
  controller: ReadableStreamDefaultController
) {
  const conns = getTransferConnections();
  conns.delete(controller);
  console.log(
    `❌ Transfer SSE connection removed. Total transfer connections: ${conns.size}`
  );
}

// Transform backend package data to frontend format
function transformPackageData(backendPackage: any) {
  console.log("🔄 Transforming backend package:", backendPackage);

  // Backend now only sends THB prices
  const transformed = {
    id: backendPackage.id || backendPackage.packageId,
    name: backendPackage.name,
    coins: backendPackage.coinAmount || backendPackage.coins,
    bonusCoins: backendPackage.bonusCoins || 0,
    totalCoins:
      backendPackage.totalCoins ||
      (backendPackage.coinAmount || backendPackage.coins) +
        (backendPackage.bonusCoins || 0),
    price: backendPackage.price, // THB price
    currency: "THB",
    description: backendPackage.description || "",
    isActive:
      backendPackage.isActive !== undefined ? backendPackage.isActive : true,
    createdAt: backendPackage.createdAt,
  };

  console.log("✅ Transformed to frontend format:", transformed);
  console.log("💰 Price: ฿", transformed.price);
  return transformed;
}

// Helper function to broadcast updates to all connected clients
export function broadcastCoinPackageUpdate(type: string, data: any) {
  const conns = getConnections();

  // Transform package data if present
  let transformedData = { ...data };
  if (data.package) {
    transformedData.package = transformPackageData(data.package);
  }

  const message = JSON.stringify({
    type,
    ...transformedData,
    timestamp: Date.now(),
  });

  console.log(`🚀 Broadcasting ${type} to ${conns.size} connections`);
  console.log(`📤 Original data:`, data);
  console.log(`🔄 Transformed data:`, transformedData);
  console.log(`📤 Message content:`, message);

  if (conns.size === 0) {
    console.warn("⚠️ No SSE connections available to broadcast to");
  }

  let sentCount = 0;
  conns.forEach((controller) => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
      sentCount++;
      console.log(`✅ Message sent to connection ${sentCount}`);
    } catch (error) {
      console.error("❌ Error sending SSE message:", error);
      conns.delete(controller);
    }
  });

  console.log(
    `📊 Active connections after broadcast: ${conns.size}, Messages sent: ${sentCount}`
  );
}

// Helper function to broadcast coin transfer updates to all connected clients
export function broadcastCoinTransferUpdate(type: string, data: any) {
  const conns = getTransferConnections();

  const message = JSON.stringify({ type, ...data, timestamp: Date.now() });

  console.log(`🚀 Broadcasting transfer ${type} to ${conns.size} connections`);
  console.log(`📤 Transfer data:`, data);
  console.log(`📤 Message content:`, message);

  if (conns.size === 0) {
    console.warn("⚠️ No transfer SSE connections available to broadcast to");
  }

  let sentCount = 0;
  conns.forEach((controller) => {
    try {
      controller.enqueue(`data: ${message}\n\n`);
      sentCount++;
      console.log(`✅ Transfer message sent to connection ${sentCount}`);
    } catch (error) {
      console.error("❌ Error sending transfer SSE message:", error);
      conns.delete(controller);
    }
  });

  console.log(
    `📊 Active transfer connections after broadcast: ${conns.size}, Messages sent: ${sentCount}`
  );
}
