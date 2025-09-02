"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface NotificationPreference {
  id: string;
  type: string;
  enabled: boolean;
  description: string;
}

interface NotificationPreferencesProps {
  userId: string;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/notifications/preferences`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Convert backend response to frontend format
          const preferencesArray: NotificationPreference[] = [
            {
              id: "chapter_moderation",
              type: "CHAPTER_MODERATION",
              enabled: data.notifyChapterModeration || false,
              description:
                "Receive notifications when your chapters are approved or rejected",
            },
            {
              id: "new_follower",
              type: "NEW_FOLLOWER",
              enabled: data.notifyNewFollowers || false,
              description: "Receive notifications when someone follows you",
            },
            {
              id: "new_stories",
              type: "NEW_STORIES",
              enabled: data.notifyNewStories || false,
              description:
                "Receive notifications about new stories from followed authors",
            },
            {
              id: "new_chapters",
              type: "NEW_CHAPTERS",
              enabled: data.notifyNewChapters || false,
              description:
                "Receive notifications when authors you follow publish new chapters",
            },
            {
              id: "likes",
              type: "LIKES",
              enabled: data.notifyLikes || false,
              description:
                "Receive notifications when someone likes your content",
            },
            {
              id: "comments",
              type: "COMMENTS",
              enabled: data.notifyComments || false,
              description:
                "Receive notifications when someone comments on your content",
            },
            {
              id: "system_messages",
              type: "SYSTEM_MESSAGES",
              enabled: data.notifySystemMessages || false,
              description:
                "Receive important system notifications and announcements",
            },
          ];
          setPreferences(preferencesArray);
        } else {
          // If no preferences exist, set default ones
          const defaultPreferencesArray: NotificationPreference[] = [
            {
              id: "chapter_moderation",
              type: "CHAPTER_MODERATION",
              enabled: true,
              description:
                "Receive notifications when your chapters are approved or rejected",
            },
            {
              id: "new_follower",
              type: "NEW_FOLLOWER",
              enabled: true,
              description: "Receive notifications when someone follows you",
            },
            {
              id: "new_stories",
              type: "NEW_STORIES",
              enabled: true,
              description:
                "Receive notifications about new stories from followed authors",
            },
            {
              id: "new_chapters",
              type: "NEW_CHAPTERS",
              enabled: true,
              description:
                "Receive notifications when authors you follow publish new chapters",
            },
            {
              id: "likes",
              type: "LIKES",
              enabled: true,
              description:
                "Receive notifications when someone likes your content",
            },
            {
              id: "comments",
              type: "COMMENTS",
              enabled: true,
              description:
                "Receive notifications when someone comments on your content",
            },
            {
              id: "system_messages",
              type: "SYSTEM_MESSAGES",
              enabled: true,
              description:
                "Receive important system notifications and announcements",
            },
          ];
          setPreferences(defaultPreferencesArray);
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error);
        toast.error("Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  // Update notification preference
  const updatePreference = async (preferenceId: string, enabled: boolean) => {
    setUpdating(preferenceId);
    try {
      const token = localStorage.getItem("token");
      const preference = preferences.find((p) => p.id === preferenceId);
      if (!preference) return;

      // Map frontend preference types to backend field names
      const fieldMapping: { [key: string]: string } = {
        CHAPTER_MODERATION: "notifyChapterModeration",
        NEW_FOLLOWER: "notifyNewFollowers",
        NEW_STORIES: "notifyNewStories",
        NEW_CHAPTERS: "notifyNewChapters",
        LIKES: "notifyLikes",
        COMMENTS: "notifyComments",
        SYSTEM_MESSAGES: "notifySystemMessages",
      };

      const fieldName = fieldMapping[preference.type];
      if (!fieldName) {
        toast.error("Invalid preference type");
        return;
      }

      const response = await fetch(`/api/notifications/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [fieldName]: enabled,
        }),
      });

      if (response.ok) {
        setPreferences((prev) =>
          prev.map((pref) =>
            pref.id === preferenceId ? { ...pref, enabled } : pref
          )
        );
        toast.success("Notification preference updated");
      } else {
        toast.error("Failed to update notification preference");
      }
    } catch (error) {
      console.error("Error updating notification preference:", error);
      toast.error("Failed to update notification preference");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">
          Loading notification preferences...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">
          Notification Preferences
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Choose which notifications you'd like to receive. You can change these
        settings at any time.
      </p>

      <div className="space-y-3">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {preference.type
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                {preference.enabled ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {preference.description}
              </p>
            </div>

            <div className="ml-4">
              <button
                onClick={() =>
                  updatePreference(preference.id, !preference.enabled)
                }
                disabled={updating === preference.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  preference.enabled ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                {updating === preference.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preference.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferences;
