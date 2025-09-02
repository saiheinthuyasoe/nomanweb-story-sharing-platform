"use client";

import { useState } from "react";

export default function TestStoryApiPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testStoryApi = async () => {
    setLoading(true);
    setResult("Testing story API...");

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const response = await fetch(
        `${apiUrl}/stories/1aeb8af8-eca5-4cdd-b70e-3236bf6a13f6`
      );
      const data = await response.json();

      console.log("📋 Raw API Response:", data);
      console.log("📋 PricingType:", data.pricingType);

      setResult(
        `Status: ${response.status}\n\nData: ${JSON.stringify(data, null, 2)}`
      );
    } catch (error) {
      console.error("❌ API Error:", error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Story API Test</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={testStoryApi}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Story API"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">API Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
