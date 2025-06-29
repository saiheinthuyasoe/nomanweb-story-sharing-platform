'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Coins, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  UserMinus 
} from 'lucide-react';

interface Gift {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  coinCost: number;
  isActive: boolean;
  createdAt: string;
}

interface SystemSetting {
  key: string;
  value: string;
  description?: string;
}

export default function AdminMonetizationPage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'gifts' | 'settings' | 'coins'>('gifts');
  const [loading, setLoading] = useState(true);

  // Gift form state
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [giftForm, setGiftForm] = useState({
    name: '',
    description: '',
    iconUrl: '',
    coinCost: 0,
    isActive: true,
  });

  // Coin management state
  const [userIdForCoins, setUserIdForCoins] = useState('');
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinDescription, setCoinDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch gifts
      const giftsResponse = await fetch('/api/admin/monetization/gifts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (giftsResponse.ok) {
        const giftsData = await giftsResponse.json();
        setGifts(giftsData);
      }

      // Fetch settings
      const settingsResponse = await fetch('/api/admin/monetization/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGift = async () => {
    try {
      const response = await fetch('/api/admin/monetization/gifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(giftForm),
      });

      if (response.ok) {
        alert('Gift created successfully!');
        setShowGiftForm(false);
        setGiftForm({ name: '', description: '', iconUrl: '', coinCost: 0, isActive: true });
        fetchData();
      } else {
        alert('Failed to create gift');
      }
    } catch (error) {
      console.error('Error creating gift:', error);
      alert('Failed to create gift');
    }
  };

  const handleUpdateGift = async () => {
    if (!editingGift) return;

    try {
      const response = await fetch(`/api/admin/monetization/gifts/${editingGift.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(giftForm),
      });

      if (response.ok) {
        alert('Gift updated successfully!');
        setEditingGift(null);
        setGiftForm({ name: '', description: '', iconUrl: '', coinCost: 0, isActive: true });
        fetchData();
      } else {
        alert('Failed to update gift');
      }
    } catch (error) {
      console.error('Error updating gift:', error);
      alert('Failed to update gift');
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    if (!confirm('Are you sure you want to delete this gift?')) return;

    try {
      const response = await fetch(`/api/admin/monetization/gifts/${giftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('Gift deleted successfully!');
        fetchData();
      } else {
        alert('Failed to delete gift');
      }
    } catch (error) {
      console.error('Error deleting gift:', error);
      alert('Failed to delete gift');
    }
  };

  const handleEditGift = (gift: Gift) => {
    setEditingGift(gift);
    setGiftForm({
      name: gift.name,
      description: gift.description,
      iconUrl: gift.iconUrl,
      coinCost: gift.coinCost,
      isActive: gift.isActive,
    });
    setShowGiftForm(true);
  };

  const handleAddCoins = async () => {
    try {
      const response = await fetch('/api/admin/monetization/coins/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: userIdForCoins,
          amount: coinAmount,
          description: coinDescription,
        }),
      });

      if (response.ok) {
        alert('Coins added successfully!');
        setUserIdForCoins('');
        setCoinAmount(0);
        setCoinDescription('');
      } else {
        alert('Failed to add coins');
      }
    } catch (error) {
      console.error('Error adding coins:', error);
      alert('Failed to add coins');
    }
  };

  const handleDeductCoins = async () => {
    try {
      const response = await fetch('/api/admin/monetization/coins/deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId: userIdForCoins,
          amount: coinAmount,
          description: coinDescription,
        }),
      });

      if (response.ok) {
        alert('Coins deducted successfully!');
        setUserIdForCoins('');
        setCoinAmount(0);
        setCoinDescription('');
      } else {
        alert('Failed to deduct coins');
      }
    } catch (error) {
      console.error('Error deducting coins:', error);
      alert('Failed to deduct coins');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monetization Management</h1>
        <p className="text-gray-600">Manage gifts, settings, and user coins</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 border-b">
          {[
            { key: 'gifts', label: 'Gift Management', icon: Gift },
            { key: 'settings', label: 'System Settings', icon: Settings },
            { key: 'coins', label: 'Coin Management', icon: Coins },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Management Tab */}
      {activeTab === 'gifts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Gift Management</h2>
            <Button
              onClick={() => {
                setEditingGift(null);
                setGiftForm({ name: '', description: '', iconUrl: '', coinCost: 0, isActive: true });
                setShowGiftForm(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Gift
            </Button>
          </div>

          {/* Gift Form */}
          {showGiftForm && (
            <Card>
              <CardHeader>
                <CardTitle>{editingGift ? 'Edit Gift' : 'Create New Gift'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={giftForm.name}
                      onChange={(e) => setGiftForm({ ...giftForm, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Gift name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coin Cost
                    </label>
                    <input
                      type="number"
                      value={giftForm.coinCost}
                      onChange={(e) => setGiftForm({ ...giftForm, coinCost: Number(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={giftForm.description}
                      onChange={(e) => setGiftForm({ ...giftForm, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Gift description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon URL
                    </label>
                    <input
                      type="text"
                      value={giftForm.iconUrl}
                      onChange={(e) => setGiftForm({ ...giftForm, iconUrl: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="/icons/gift.png"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={giftForm.isActive}
                        onChange={(e) => setGiftForm({ ...giftForm, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={editingGift ? handleUpdateGift : handleCreateGift}
                    className="flex-1"
                  >
                    {editingGift ? 'Update Gift' : 'Create Gift'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowGiftForm(false);
                      setEditingGift(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gifts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => (
              <Card key={gift.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{gift.name}</h3>
                    <Badge variant={gift.isActive ? 'default' : 'secondary'}>
                      {gift.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{gift.description}</p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    <span className="font-bold">{gift.coinCost} Coins</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditGift(gift)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteGift(gift.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">System Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Monetization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{key.replace(/_/g, ' ').toUpperCase()}</h4>
                      <p className="text-sm text-gray-600">Current value: {value}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coin Management Tab */}
      {activeTab === 'coins' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Coin Management</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Add/Deduct Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID
                  </label>
                  <input
                    type="text"
                    value={userIdForCoins}
                    onChange={(e) => setUserIdForCoins(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter user UUID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter coin amount"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={coinDescription}
                    onChange={(e) => setCoinDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Reason for transaction"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleAddCoins}
                    className="flex-1 flex items-center gap-2"
                    disabled={!userIdForCoins || coinAmount <= 0}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Coins
                  </Button>
                  <Button
                    onClick={handleDeductCoins}
                    variant="outline"
                    className="flex-1 flex items-center gap-2"
                    disabled={!userIdForCoins || coinAmount <= 0}
                  >
                    <UserMinus className="h-4 w-4" />
                    Deduct Coins
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 