"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { XMarkIcon, ClockIcon, CheckIcon } from "@heroicons/react/24/outline";
import { FeaturedContent } from "../../services/adminHomepageService";
import DatePicker from "../ui/DatePicker";

interface BulkExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: FeaturedContent[];
  onUpdate: (updatedItems: FeaturedContent[]) => void;
}

const BulkExpirationModal: React.FC<BulkExpirationModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onUpdate,
}) => {
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [updateMode, setUpdateMode] = useState<"set" | "extend">("set");

  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    if (duration === "permanent") {
      setEndDate(null);
    } else if (duration) {
      const durationDays = parseInt(duration);
      const now = new Date();
      const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      setEndDate(end);
    }
  };

  const handleExtend = (days: number) => {
    const now = new Date();
    const extension = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    setEndDate(extension);
    setSelectedDuration("");
  };

  const handleBulkUpdate = async () => {
    if (updateMode === "set" && !endDate && selectedDuration !== "permanent") {
      toast.error("Please select an expiration date or choose permanent");
      return;
    }

    if (updateMode === "extend" && !endDate) {
      toast.error("Please select an extension period");
      return;
    }

    try {
      setLoading(true);
      const updatedItems: FeaturedContent[] = [];

      // Process each selected item
      for (const item of selectedItems) {
        let newEndDate: string | null = null;

        if (updateMode === "set") {
          newEndDate = endDate ? endDate.toISOString() : null;
        } else if (updateMode === "extend" && endDate) {
          // Extend from current end date or now if no end date
          const baseDate = item.endDate ? new Date(item.endDate) : new Date();
          const extensionMs = endDate.getTime() - new Date().getTime();
          const newDate = new Date(baseDate.getTime() + extensionMs);
          newEndDate = newDate.toISOString();
        }

        // Call API to update each item
        const startDate = item.startDate || new Date().toISOString();
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
          }/api/admin/featured-content/${
            item.id
          }/duration?startDate=${encodeURIComponent(startDate)}${
            newEndDate ? `&endDate=${encodeURIComponent(newEndDate)}` : ""
          }`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update ${item.story.title}`);
        }

        // Update the item
        updatedItems.push({
          ...item,
          endDate: newEndDate,
        });
      }

      onUpdate(updatedItems);
      toast.success(`Successfully updated ${updatedItems.length} items`);
      onClose();
    } catch (error) {
      console.error("Error updating expiration dates:", error);
      toast.error("Failed to update some items");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEndDate(null);
    setSelectedDuration("");
    setUpdateMode("set");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Bulk Update Expiration Dates ({selectedItems.length} items)
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Items Preview */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Selected Items:
            </h4>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 border-b border-gray-100 last:border-b-0"
                >
                  <img
                    src={
                      item.story.coverImageUrl ||
                      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=40&h=50&fit=crop"
                    }
                    alt={item.story.title}
                    className="w-8 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.story.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.endDate
                        ? `Expires: ${new Date(
                            item.endDate
                          ).toLocaleDateString()}`
                        : "Permanent"}
                    </p>
                  </div>
                  <CheckIcon className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Update Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="set"
                  checked={updateMode === "set"}
                  onChange={(e) =>
                    setUpdateMode(e.target.value as "set" | "extend")
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Set new expiration date
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="extend"
                  checked={updateMode === "extend"}
                  onChange={(e) =>
                    setUpdateMode(e.target.value as "set" | "extend")
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Extend current expiration
                </span>
              </label>
            </div>
          </div>

          {/* Quick Duration Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {updateMode === "set" ? "Quick Duration" : "Extension Period"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDurationChange("7")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {updateMode === "set" ? "7 days" : "+7 days"}
              </button>
              <button
                onClick={() => handleDurationChange("14")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {updateMode === "set" ? "14 days" : "+14 days"}
              </button>
              <button
                onClick={() => handleDurationChange("30")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {updateMode === "set" ? "30 days" : "+30 days"}
              </button>
              {updateMode === "set" && (
                <button
                  onClick={() => handleDurationChange("permanent")}
                  className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Permanent
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {updateMode === "set"
                ? "Custom Expiration Date (Optional - leave empty for permanent)"
                : "Custom Extension Period"}
            </label>
            <DatePicker
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setSelectedDuration("");
              }}
              showTime={true}
              placeholder={
                updateMode === "set"
                  ? "Select expiration date and time"
                  : "Select extension period"
              }
              minDate={updateMode === "set" ? new Date() : undefined}
              className="w-full"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>
                {updateMode === "set"
                  ? endDate
                    ? `New expiration: ${endDate.toLocaleString()}`
                    : selectedDuration === "permanent"
                    ? "Will be set to permanent (no expiration)"
                    : "No expiration date selected"
                  : endDate
                  ? `Will extend by: ${Math.ceil(
                      (endDate.getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )} days`
                  : "No extension period selected"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={
              loading ||
              (updateMode === "set" &&
                !endDate &&
                selectedDuration !== "permanent") ||
              (updateMode === "extend" && !endDate)
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : `Update ${selectedItems.length} Items`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkExpirationModal;
