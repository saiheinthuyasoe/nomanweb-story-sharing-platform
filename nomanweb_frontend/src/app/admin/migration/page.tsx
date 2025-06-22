'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MigrationStats {
  totalExternalImages: number;
  googleImages: number;
  lineImages: number;
  facebookImages: number;
  needsMigration: boolean;
}

interface MigrationResult {
  totalUsers: number;
  successCount: number;
  failureCount: number;
  message: string;
}

export default function MigrationPage() {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkOAuthImages = async () => {
    setChecking(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/check-oauth-images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check OAuth images');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setChecking(false);
    }
  };

  const migrateOAuthImages = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/migrate-oauth-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      const data = await response.json();
      setResult(data);
      
      // Refresh stats after migration
      await checkOAuthImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">OAuth Image Migration</h1>
        <p className="text-gray-600">
          Migrate external OAuth profile images to Cloudinary to prevent rate limiting issues
        </p>
      </div>

      {/* Check Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Current Status</h2>
          </div>
          <Button
            onClick={checkOAuthImages}
            disabled={checking}
            variant="outline"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Status'
            )}
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalExternalImages}</div>
              <div className="text-sm text-blue-800">Total External Images</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{stats.googleImages}</div>
              <div className="text-sm text-red-800">Google Images</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.lineImages}</div>
              <div className="text-sm text-green-800">LINE Images</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.facebookImages}</div>
              <div className="text-sm text-purple-800">Facebook Images</div>
            </div>
          </div>
        )}

        {stats && !stats.needsMigration && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">All profile images are already migrated!</span>
          </div>
        )}
      </Card>

      {/* Migration Card */}
      {stats && stats.needsMigration && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Download className="w-6 h-6 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold">Run Migration</h2>
            </div>
          </div>

          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-yellow-800">
                <p className="font-medium mb-1">Before running migration:</p>
                <ul className="text-sm space-y-1 list-disc list-inside ml-4">
                  <li>This will download external OAuth images and store them in Cloudinary</li>
                  <li>The process may take several minutes depending on the number of images</li>
                  <li>Users will continue to see their images during migration</li>
                  <li>Failed migrations will keep the original external URL as fallback</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={migrateOAuthImages}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating Images...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Migration
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Results Card */}
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
            Migration Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{result.totalUsers}</div>
              <div className="text-sm text-blue-800">Total Processed</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
              <div className="text-sm text-green-800">Successful</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{result.failureCount}</div>
              <div className="text-sm text-red-800">Failed</div>
            </div>
          </div>

          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800">{result.message}</p>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-6 border-red-300 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </Card>
      )}
    </div>
  );
} 