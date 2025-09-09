import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { FeaturedContent } from '../../services/adminHomepageService';

interface ExpirationAlertsProps {
  featuredContent: FeaturedContent[];
  onExtendExpiration: (itemId: string, days: number) => void;
  onEditExpiration: (item: FeaturedContent) => void;
}

interface ExpiringItem {
  item: FeaturedContent;
  daysUntilExpiration: number;
  urgencyLevel: 'critical' | 'warning' | 'info';
}

const ExpirationAlerts: React.FC<ExpirationAlertsProps> = ({
  featuredContent,
  onExtendExpiration,
  onEditExpiration,
}) => {
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkExpiringContent = () => {
      const now = new Date();
      const expiring: ExpiringItem[] = [];

      featuredContent.forEach((item) => {
        if (!item.endDate || !item.isActive) return;

        const endDate = new Date(item.endDate);
        const timeDiff = endDate.getTime() - now.getTime();
        const daysUntilExpiration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Only show items expiring within 7 days or already expired
        if (daysUntilExpiration <= 7) {
          let urgencyLevel: 'critical' | 'warning' | 'info';
          
          if (daysUntilExpiration <= 0) {
            urgencyLevel = 'critical';
          } else if (daysUntilExpiration <= 2) {
            urgencyLevel = 'critical';
          } else if (daysUntilExpiration <= 5) {
            urgencyLevel = 'warning';
          } else {
            urgencyLevel = 'info';
          }

          expiring.push({
            item,
            daysUntilExpiration,
            urgencyLevel,
          });
        }
      });

      // Sort by urgency and days until expiration
      expiring.sort((a, b) => {
        const urgencyOrder = { critical: 0, warning: 1, info: 2 };
        if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
          return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
        }
        return a.daysUntilExpiration - b.daysUntilExpiration;
      });

      setExpiringItems(expiring);

      // Show toast notifications for critical items (only once per session)
      expiring.forEach((expiringItem) => {
        if (
          expiringItem.urgencyLevel === 'critical' &&
          !dismissedAlerts.has(expiringItem.item.id)
        ) {
          const message = expiringItem.daysUntilExpiration <= 0
            ? `"${expiringItem.item.story.title}" has expired!`
            : `"${expiringItem.item.story.title}" expires in ${expiringItem.daysUntilExpiration} day(s)!`;
          
          toast.error(message, {
            duration: 8000,
            id: `expiration-${expiringItem.item.id}`,
          });
        }
      });
    };

    checkExpiringContent();
    // Check every hour
    const interval = setInterval(checkExpiringContent, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [featuredContent, dismissedAlerts]);

  const dismissAlert = (itemId: string) => {
    setDismissedAlerts(prev => new Set([...prev, itemId]));
  };

  const getAlertStyles = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatExpirationText = (daysUntilExpiration: number) => {
    if (daysUntilExpiration <= 0) {
      return daysUntilExpiration === 0 ? 'Expires today' : `Expired ${Math.abs(daysUntilExpiration)} day(s) ago`;
    }
    return `Expires in ${daysUntilExpiration} day(s)`;
  };

  const visibleItems = expiringItems.filter(item => !dismissedAlerts.has(item.item.id));

  if (!showAlerts || visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Expiration Alerts
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {visibleItems.length}
            </span>
          </div>
          <button
            onClick={() => setShowAlerts(false)}
            className="text-gray-400 hover:text-gray-600"
            title="Hide alerts"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {visibleItems.map(({ item, daysUntilExpiration, urgencyLevel }) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${getAlertStyles(urgencyLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {urgencyLevel === 'critical' ? (
                      <ExclamationTriangleIcon className={`h-5 w-5 ${getIconColor(urgencyLevel)}`} />
                    ) : (
                      <ClockIcon className={`h-5 w-5 ${getIconColor(urgencyLevel)}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <img
                        src={item.story.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=40&h=50&fit=crop"}
                        alt={item.story.title}
                        className="w-8 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.story.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          by {item.story.author.displayName || item.story.author.username}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mt-1">
                      {formatExpirationText(daysUntilExpiration)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      End date: {new Date(item.endDate!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onExtendExpiration(item.id, 7)}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      title="Extend by 7 days"
                    >
                      +7d
                    </button>
                    <button
                      onClick={() => onExtendExpiration(item.id, 14)}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      title="Extend by 14 days"
                    >
                      +14d
                    </button>
                    <button
                      onClick={() => onExtendExpiration(item.id, 30)}
                      className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
                      title="Extend by 30 days"
                    >
                      +30d
                    </button>
                  </div>
                  <button
                    onClick={() => onEditExpiration(item)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => dismissAlert(item.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Dismiss alert"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {visibleItems.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Showing content expiring within 7 days. Alerts refresh every hour.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpirationAlerts;