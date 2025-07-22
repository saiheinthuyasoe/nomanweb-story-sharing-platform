'use client';

import React, { useState } from 'react';
import { Gift, Coins } from 'lucide-react';
import EnhancedGiftModal from '@/components/monetization/EnhancedGiftModal';

export default function TestGiftSystemPage() {
  const [showGiftModal, setShowGiftModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gift System Test</h1>
          <p className="text-gray-600 mb-6">
            Test the enhanced gift system with emoji gifts and custom amounts
          </p>
          
          <button
            onClick={() => setShowGiftModal(true)}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Gift className="w-5 h-5" />
            <span>Test Gift Modal</span>
          </button>
        </div>

        {/* Gift Modal */}
        <EnhancedGiftModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          recipientId="test-recipient-id"
          recipientName="Test Author"
          onGiftSent={() => {
            console.log('Gift sent successfully!');
          }}
        />
      </div>
    </div>
  );
} 