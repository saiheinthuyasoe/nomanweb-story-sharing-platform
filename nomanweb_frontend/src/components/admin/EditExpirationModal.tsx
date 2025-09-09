"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { XMarkIcon, ClockIcon } from "@heroicons/react/24/outline";
import { adminHomepageService, FeaturedContent } from "../../services/adminHomepageService";
import DatePicker from "../ui/DatePicker";

interface EditExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  featuredContent: FeaturedContent;
  onUpdate: (updatedContent: FeaturedContent) => void;
}

const EditExpirationModal: React.FC<EditExpirationModalProps> = ({
  isOpen,
  onClose,
  featuredContent,
  onUpdate,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>("");

  useEffect(() => {
    if (isOpen && featuredContent) {
      // Set dates as Date objects
      const start = featuredContent.startDate
        ? new Date(featuredContent.startDate)
        : new Date();
      const end = featuredContent.endDate
        ? new Date(featuredContent.endDate)
        : null;
      
      setStartDate(start);
      setEndDate(end);
      setSelectedDuration("");
    }
  }, [isOpen, featuredContent]);

  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    if (duration && startDate) {
      const durationDays = parseInt(duration);
      const end = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      setEndDate(end);
    } else if (duration === "permanent") {
      setEndDate(null);
    }
  };

  const handleExtend = (days: number) => {
    if (endDate) {
      const newEnd = new Date(endDate.getTime() + days * 24 * 60 * 60 * 1000);
      setEndDate(newEnd);
    } else if (startDate) {
      const newEnd = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      setEndDate(newEnd);
    }
    setSelectedDuration("");
  };

  const handleSave = async () => {
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    try {
      setLoading(true);
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate ? endDate.toISOString() : null;

      // Call the API to update duration
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/featured-content/${featuredContent.id}/duration?startDate=${encodeURIComponent(formattedStartDate)}${formattedEndDate ? `&endDate=${encodeURIComponent(formattedEndDate)}` : ''}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the featured content object
      const updatedContent = {
        ...featuredContent,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      };

      onUpdate(updatedContent);
      toast.success("Expiration date updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating expiration date:", error);
      toast.error("Failed to update expiration date");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Expiration Date
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Story Info */}
          <div className="flex items-center space-x-3">
            <img
              src={featuredContent.story.coverImageUrl || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=60&h=80&fit=crop"}
              alt={featuredContent.story.title}
              className="w-12 h-16 object-cover rounded"
            />
            <div>
              <h4 className="font-medium text-gray-900">
                {featuredContent.story.title}
              </h4>
              <p className="text-sm text-gray-500">
                {featuredContent.story.author.displayName || featuredContent.story.author.username}
              </p>
            </div>
          </div>

          {/* Quick Duration Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDurationChange("7")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                7 days
              </button>
              <button
                onClick={() => handleDurationChange("14")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                14 days
              </button>
              <button
                onClick={() => handleDurationChange("30")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                30 days
              </button>
              <button
                onClick={() => handleDurationChange("permanent")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Permanent
              </button>
            </div>
          </div>

          {/* Extension Options */}
          {endDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend Current Expiration
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExtend(7)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  +7 days
                </button>
                <button
                  onClick={() => handleExtend(14)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  +14 days
                </button>
                <button
                  onClick={() => handleExtend(30)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  +30 days
                </button>
              </div>
            </div>
          )}

          {/* Custom Date Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                showTime={true}
                placeholder="Select start date and time"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional - leave empty for permanent)
              </label>
              <DatePicker
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  setSelectedDuration("");
                }}
                showTime={true}
                placeholder="Select end date and time"
                minDate={startDate || undefined}
                className="w-full"
              />
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>
                {endDate
                  ? `Expires: ${endDate.toLocaleString()}`
                  : "Permanent (no expiration)"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpirationModal;