'use client'

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Types
interface Transaction {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  type: 'purchase' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'bonus' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  date: string;
  description?: string;
  reference?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CoinManagementPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    totalIssued: 0,
    totalPurchases: 0,
    totalWithdrawals: 0
  });
  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Coin packages state
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    coins: '',
    price: '',
    currency: 'THB',
    description: '',
    isActive: true
  });
  const [packageLoading, setPackageLoading] = useState(false);

  // Transaction details state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Coin transfer state
  const [transferForm, setTransferForm] = useState({
    userIdentifier: '',
    amount: '',
    type: 'transfer' as 'transfer' | 'withdraw',
    reason: ''
  });
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
      fetchTransactionStats();
    } else if (activeTab === 'packages') {
      fetchCoinPackages();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [transactionFilters]);

  // Transaction functions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      
      if (transactionFilters.search) params.append('search', transactionFilters.search);
      if (transactionFilters.type) params.append('type', transactionFilters.type);
      if (transactionFilters.status) params.append('status', transactionFilters.status);
      if (transactionFilters.dateFrom) params.append('dateFrom', transactionFilters.dateFrom);
      if (transactionFilters.dateTo) params.append('dateTo', transactionFilters.dateTo);

      const response = await fetch(`/api/admin/coins/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else {
        // Mock data for development
        setTransactions([
          {
            id: '1',
            user: { id: '1', username: 'john_doe', email: 'john@example.com' },
            type: 'purchase',
            amount: 100,
            status: 'completed',
            date: '2024-01-20T10:30:00Z',
            description: 'Coin package purchase',
            reference: 'TXN001',
            balanceBefore: 1000,
            balanceAfter: 1100
          },
          {
            id: '2',
            user: { id: '2', username: 'jane_smith', email: 'jane@example.com' },
            type: 'transfer_in',
            amount: 50,
            status: 'completed',
            date: '2024-01-19T15:45:00Z',
            description: 'Admin transfer',
            reference: 'TXN002',
            balanceBefore: 1000,
            balanceAfter: 1050
          },
          {
            id: '3',
            user: { id: '3', username: 'bob_wilson', email: 'bob@example.com' },
            type: 'withdrawal',
            amount: 25,
            status: 'pending',
            date: '2024-01-18T09:15:00Z',
            description: 'User withdrawal request',
            reference: 'TXN003',
            balanceBefore: 1000,
            balanceAfter: 975
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coins/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setTransactionStats(stats);
      } else {
        // Mock data
        setTransactionStats({
          totalIssued: 50000,
          totalPurchases: 35000,
          totalWithdrawals: 8500
        });
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  // Coin package functions
  const fetchCoinPackages = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/coins/packages', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const packages = await response.json();
        setCoinPackages(packages);
      } else {
        // Mock data
        // Mock data fallback - this should not be reached with real backend
        setCoinPackages([
          {
            id: '1',
            name: 'Starter Pack',
            coins: 100, 
            price: 350,
            currency: 'THB',
            description: 'Perfect for new readers',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Premium Pack',
            coins: 575, // 500 + 75 bonus
            price: 1400,
            currency: 'THB',
            description: 'Best value for regular readers',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Ultimate Pack',
            coins: 1200, // 1000 + 200 bonus
            price: 2450,
            currency: 'THB',
            description: 'For the most dedicated readers',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching coin packages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transfer functions
  const handleTransfer = async () => {
    if (!transferForm.userIdentifier || !transferForm.amount || !transferForm.reason) {
      alert('Please fill in all required fields: User Identifier, Amount, and Reason');
      return;
    }

    // Validate amount
    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    setTransferLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        alert('Admin token not found. Please login again.');
        return;
      }

      const response = await fetch('/api/admin/coins/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIdentifier: transferForm.userIdentifier,
          amount: amount,
          type: transferForm.type,
          reason: transferForm.reason
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const action = transferForm.type === 'transfer' ? 'transferred' : 'withdrawn';
        const message = `✅ Coins ${action} successfully!\n\n` +
                       `User: ${result.user?.username || result.userIdentifier}\n` +
                       `Email: ${result.user?.email || 'N/A'}\n` +
                       `Amount: ${amount} coins\n` +
                       `New Balance: ${result.newBalance} coins\n` +
                       `Transaction ID: ${result.transactionId}`;
        
        alert(message);
        
        // Reset form
        setTransferForm({
          userIdentifier: '',
          amount: '',
          type: 'transfer',
          reason: ''
        });
        
        // Refresh transactions if on that tab
        if (activeTab === 'transactions') {
          fetchTransactions();
          fetchTransactionStats();
        }
      } else {
        const errorMessage = result.error || 'Failed to process transfer';
        alert(`❌ Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error processing transfer:', error);
      alert('❌ Network error: Failed to process transfer. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
      case 'earning':
        return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
      case 'refund':
        return <ArrowUpIcon className="w-4 h-4 text-green-600" />;
      case 'bonus':
        return <ArrowUpIcon className="w-4 h-4 text-purple-600" />;
      case 'penalty':
        return <ArrowDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <CurrencyDollarIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.cancelled}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency = 'THB') => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Package management functions
  const handlePackageSubmit = async () => {
    if (!packageForm.name || !packageForm.coins || !packageForm.price) {
      alert('Please fill in all required fields');
      return;
    }

    setPackageLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        alert('Admin token not found. Please login again.');
        return;
      }
      
      console.log('Submitting package:', packageForm);
      const method = editingPackage ? 'PUT' : 'POST';
      const url = editingPackage 
        ? `/api/admin/coins/packages/${editingPackage.id}` 
        : '/api/admin/coins/packages';

      const requestBody: any = {
        name: packageForm.name,
        coins: parseInt(packageForm.coins),
        price: parseFloat(packageForm.price),
        currency: packageForm.currency,
        description: packageForm.description,
        isActive: packageForm.isActive
      };

      // Add ID for PUT requests
      if (editingPackage) {
        requestBody.id = editingPackage.id;
      }

      console.log('Making request to:', url, 'with method:', method);
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        alert(`Package ${editingPackage ? 'updated' : 'created'} successfully!`);
        setShowPackageModal(false);
        setEditingPackage(null);
        setPackageForm({
          name: '',
          coins: '',
          price: '',
          currency: 'THB',
          description: '',
          isActive: true
        });
        fetchCoinPackages();
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          alert(`Error: ${error.message || error.error || 'Failed to save package'}`);
        } catch (e) {
          alert(`Error: ${errorText || 'Failed to save package'}`);
        }
      }
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    } finally {
      setPackageLoading(false);
    }
  };

  const handleEditPackage = (pkg: CoinPackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      coins: pkg.coins.toString(),
      price: pkg.price.toString(),
      currency: pkg.currency,
      description: pkg.description || '',
      isActive: pkg.isActive
    });
    setShowPackageModal(true);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/coins/packages?id=${packageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Package deleted successfully!');
        fetchCoinPackages();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to delete package'}`);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Failed to delete package');
    }
  };

  const resetPackageModal = () => {
    setShowPackageModal(false);
    setEditingPackage(null);
    setPackageForm({
      name: '',
      coins: '',
      price: '',
      currency: 'THB',
      description: '',
      isActive: true
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CurrencyDollarIcon className="w-8 h-8 mr-3 text-yellow-600" />
          Coin Management
        </h1>
        <p className="text-gray-600 mt-2">Manage coin transactions, packages, and transfers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'transactions', name: 'Transactions', icon: CurrencyDollarIcon },
              { id: 'packages', name: 'Coin Packages', icon: PlusIcon },
              { id: 'transfer', name: 'Coin Transfer', icon: ArrowUpIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Coins Issued</p>
                  <p className="text-2xl font-semibold text-gray-900">{transactionStats.totalIssued.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowUpIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-semibold text-gray-900">{transactionStats.totalPurchases.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowDownIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Withdrawals</p>
                  <p className="text-2xl font-semibold text-gray-900">{transactionStats.totalWithdrawals.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={transactionFilters.search}
                    onChange={(e) => setTransactionFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={transactionFilters.type}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="purchase">Purchase</option>
                  <option value="earning">Earning</option>
                  <option value="refund">Refund</option>
                  <option value="bonus">Bonus</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={transactionFilters.status}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={transactionFilters.dateFrom}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={transactionFilters.dateTo}
                  onChange={(e) => setTransactionFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={fetchTransactions}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setTransactionFilters({ search: '', type: '', status: '', dateFrom: '', dateTo: '' });
                  fetchTransactions();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No transactions found</td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.user.username}</div>
                            <div className="text-sm text-gray-500">{transaction.user.email}</div>
                            <div className="text-xs text-gray-400">ID: {transaction.user.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTypeIcon(transaction.type)}
                            <span className="ml-2 text-sm text-gray-900 capitalize">{transaction.type.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.amount} coins
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 truncate max-w-32" title={transaction.description}>
                              {transaction.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="text-xs text-gray-500">Before: {transaction.balanceBefore || 'N/A'}</div>
                            <div className="text-xs text-gray-500">After: {transaction.balanceAfter || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Coin Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Coin Packages</h2>
            <button
              onClick={() => {
                setEditingPackage(null);
                setPackageForm({
                  name: '',
                  coins: '',
                  price: '',
                  currency: 'USD',
                  description: '',
                  isActive: true
                });
                setShowPackageModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Package
            </button>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : coinPackages.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500">No coin packages found</div>
            ) : (
              coinPackages.map((pkg) => (
                <div key={pkg.id} className={`bg-white rounded-lg shadow-lg p-6 border-2 ${pkg.isActive ? 'border-green-200' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coins:</span>
                      <span className="font-medium">{pkg.coins.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">{formatCurrency(pkg.price, pkg.currency)}</span>
                    </div>
                    
                  </div>
                  
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Coin Transfer Tab */}
      {activeTab === 'transfer' && (
        <div className="space-y-6">
          {/* Transfer Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">Coin Transfer & Withdrawal</h2>
                <p className="text-sm text-gray-600">Transfer coins to users or withdraw coins from user accounts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">User Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username or email (e.g., john_doe or john@example.com)"
                    value={transferForm.userIdentifier}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, userIdentifier: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the user's username or email address</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Transaction Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter coin amount"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">🪙</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the number of coins to transfer</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferForm.type}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, type: e.target.value as 'transfer' | 'withdraw' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="transfer">➕ Transfer Coins (Add to User)</option>
                    <option value="withdraw">➖ Withdraw Coins (Remove from User)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {transferForm.type === 'transfer' 
                      ? 'Add coins to user account (BONUS transaction type)'
                      : 'Remove coins from user account (PENALTY transaction type)'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Enter detailed reason for this transaction (e.g., 'Compensation for service issue', 'Bonus for loyal user', 'Penalty for violation')"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be recorded in the transaction log</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleTransfer}
                disabled={transferLoading}
                className={`flex-1 px-6 py-3 rounded-lg font-medium flex items-center justify-center ${
                  transferForm.type === 'transfer'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {transferLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {transferForm.type === 'transfer' ? (
                      <ArrowUpIcon className="w-4 h-4 mr-2" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 mr-2" />
                    )}
                    {transferForm.type === 'transfer' ? 'Transfer Coins' : 'Withdraw Coins'}
                  </>
                )}
              </button>
              
              <button
                onClick={() => setTransferForm({ userIdentifier: '', amount: '', type: 'transfer', reason: '' })}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium"
              >
                Clear Form
              </button>
            </div>

            {/* Information Panel */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>All transactions are logged with admin ID for audit purposes</li>
                      <li>Transfer creates a BONUS transaction type</li>
                      <li>Withdrawal creates a PENALTY transaction type</li>
                      <li>User balance is automatically updated</li>
                      <li>Transaction history is preserved in the database</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin Package Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPackage ? 'Edit Coin Package' : 'Add New Coin Package'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name *</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter package name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Coins *</label>
                  <input
                    type="number"
                    value={packageForm.coins}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, coins: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (THB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="350"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={packageForm.currency}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="THB">THB (Thai Baht)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Package description..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Package</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={resetPackageModal}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                disabled={packageLoading}
              >
                Cancel
              </button>
              <button
                onClick={handlePackageSubmit}
                disabled={packageLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {packageLoading ? 'Saving...' : (editingPackage ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedTransaction.reference || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.user.username}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedTransaction.user.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <div className="flex items-center mt-1">
                    {getTypeIcon(selectedTransaction.type)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">
                      {selectedTransaction.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedTransaction.amount} coins</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.date)}</p>
                </div>
              </div>

              {selectedTransaction.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setSelectedTransaction(null);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 