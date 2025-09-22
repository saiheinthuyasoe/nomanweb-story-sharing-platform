'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  accountNumber: string;
  bankName: string;
  accountHolderName: string;
  createdAt: string;
  processedAt?: string;
  transferId?: string;
  rejectionReason?: string;
}

interface WithdrawalStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalRejected: number;
  totalAmount: number;
}

interface AutoProcessingStats {
  autoProcessedLast24h: number;
  currentPending: number;
  currentProcessing: number;
  simulationMode: boolean;
}

const WithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [autoStats, setAutoStats] = useState<AutoProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      
      const response = await fetch('/api/admin/withdrawals?page=0&size=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns a Page object, we need to extract the content array
        setWithdrawals(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch withdrawals',
        variant: 'destructive'
      });
    }
  };

  const fetchStats = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      
      const response = await fetch('/api/admin/withdrawals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAutoStats = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      
      const response = await fetch('/api/admin/withdrawals/auto-processing-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutoStats(data);
      }
    } catch (error) {
      console.error('Error fetching auto stats:', error);
    }
  };

  const processWithdrawal = async (withdrawalId: string) => {
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal processed successfully'
        });
        await fetchWithdrawals();
        await fetchStats();
      } else {
        const error = await response.text();
        toast({
          title: 'Error',
          description: `Failed to process withdrawal: ${error}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to process withdrawal',
        variant: 'destructive'
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(withdrawalId);
        return newSet;
      });
    }
  };

  const rejectWithdrawal = async (withdrawalId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setProcessingIds(prev => new Set(prev).add(withdrawalId));
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal rejected successfully'
        });
        await fetchWithdrawals();
        await fetchStats();
      } else {
        const error = await response.text();
        toast({
          title: 'Error',
          description: `Failed to reject withdrawal: ${error}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject withdrawal',
        variant: 'destructive'
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(withdrawalId);
        return newSet;
      });
    }
  };

  const triggerAutoProcessing = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('adminToken='))
        ?.split('=')[1];
      
      const response = await fetch('/api/admin/withdrawals/trigger-auto-processing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Auto-processing triggered successfully'
        });
        await fetchWithdrawals();
        await fetchStats();
        await fetchAutoStats();
      }
    } catch (error) {
      console.error('Error triggering auto-processing:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger auto-processing',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWithdrawals(),
        fetchStats(),
        fetchAutoStats()
      ]);
      setLoading(false);
    };
    
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'default',
      PROCESSING: 'secondary',
      COMPLETED: 'default',
      REJECTED: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (activeTab === 'all') return true;
    return w.status.toLowerCase() === activeTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading withdrawals...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Management</h1>
      </div>



      {/* Auto-Processing Stats */}
      {autoStats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Processing Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">
                {autoStats.autoProcessedLast24h}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Auto-processed (24h)
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">
                {autoStats.currentPending}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Current Pending
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">
                {autoStats.currentProcessing}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Current Processing
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 mb-2">
                {autoStats.simulationMode ? 'Simulation Mode' : 'Live Mode'}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Processing Mode
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                id: "all",
                name: "All",
                icon: ClipboardDocumentListIcon,
              },
              { id: "pending", name: "Pending", icon: ClockIcon },
              { id: "processing", name: "Processing", icon: Cog6ToothIcon },
              { id: "completed", name: "Completed", icon: CheckCircleIcon },
              { id: "rejected", name: "Rejected", icon: XCircleIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  style={activeTab === tab.id ? { borderColor: '#18243c', color: '#18243c' } : {}}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Withdrawals Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-normal">ID</th>
                <th className="text-left p-2 font-normal">User ID</th>
                <th className="text-left p-2 font-normal">Amount</th>
                <th className="text-left p-2 font-normal">Bank Details</th>
                <th className="text-left p-2 font-normal">Status</th>
                <th className="text-left p-2 font-normal">Created</th>
                <th className="text-left p-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-sm">
                    {withdrawal.id.substring(0, 8)}...
                  </td>
                  <td className="p-2 font-mono text-sm">
                    {withdrawal.userId.substring(0, 8)}...
                  </td>
                  <td className="p-2 font-semibold">
                    ${withdrawal.amount.toFixed(2)}
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div>{withdrawal.bankName}</div>
                      <div className="text-gray-600">
                        {withdrawal.accountHolderName}
                      </div>
                      <div className="font-mono text-xs">
                        ***{withdrawal.accountNumber?.slice(-4) || '****'}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    {getStatusBadge(withdrawal.status)}
                  </td>
                  <td className="p-2 text-sm">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2">
                    {withdrawal.status === 'PENDING' && (
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal(withdrawal.id)}
                          disabled={processingIds.has(withdrawal.id)}
                        >
                          {processingIds.has(withdrawal.id) ? 'Processing...' : 'Process'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectWithdrawal(withdrawal.id)}
                          disabled={processingIds.has(withdrawal.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {withdrawal.status === 'REJECTED' && withdrawal.rejectionReason && (
                      <div className="text-sm text-red-600">
                        {withdrawal.rejectionReason}
                      </div>
                    )}
                    {withdrawal.transferId && (
                      <div className="text-xs font-mono text-gray-600">
                        Transfer: {withdrawal.transferId}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No withdrawals found for the selected status.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WithdrawalsPage;