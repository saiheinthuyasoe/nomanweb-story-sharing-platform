"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Send, AlertCircle, CheckCircle } from "lucide-react";
import { submitModerationFeedback } from "@/lib/api/chapters";

interface FeedbackSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  moderationMessage: string;
}

export default function FeedbackSubmissionModal({
  isOpen,
  onClose,
  chapterId,
  moderationMessage,
}: FeedbackSubmissionModalProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();

  // Extract chapter and story information from the moderation message
  const extractInfoFromMessage = (message: string) => {
    // Pattern: "Your chapter 'Chapter Title' from story 'Story Title' has been rejected..."
    const match = message.match(/Your chapter '([^']+)' from story '([^']+)' has been rejected/);
    if (match) {
      return {
        chapterTitle: match[1],
        storyTitle: match[2],
      };
    }
    
    // Fallback pattern for different message formats
    const altMatch = message.match(/chapter '([^']+)'.*story '([^']+)'/);
    if (altMatch) {
      return {
        chapterTitle: altMatch[1],
        storyTitle: altMatch[2],
      };
    }
    
    return {
      chapterTitle: "Unknown Chapter",
      storyTitle: "Unknown Story",
    };
  };

  const { chapterTitle, storyTitle } = extractInfoFromMessage(moderationMessage);

  // Extract moderation notes from the message if present
  const extractModerationNotes = (message: string) => {
    const reasonMatch = message.match(/Reason: (.+)$/);
    return reasonMatch ? reasonMatch[1] : undefined;
  };

  const moderationNotes = extractModerationNotes(moderationMessage);

  const submitFeedbackMutation = useMutation({
    mutationFn: (feedbackText: string) =>
      submitModerationFeedback(chapterId, feedbackText),
    onSuccess: () => {
      setIsSubmitted(true);
      // Invalidate notifications to refresh the list
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Failed to submit feedback:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      submitFeedbackMutation.mutate(feedback.trim());
    }
  };

  const handleClose = () => {
    setFeedback("");
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Submit Feedback on Moderation Decision
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Feedback Submitted Successfully
              </h3>
              <p className="text-gray-600">
                Thank you for your feedback. Our moderation team will review it
                and consider it for future decisions.
              </p>
            </div>
          ) : (
            <>
              {/* Chapter Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Chapter Details
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Story:</span> {storyTitle}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Chapter:</span> {chapterTitle}
                </p>
                {moderationNotes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Moderation Notes:
                    </p>
                    <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                      {moderationNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={6}
                    placeholder="Please explain why you believe this moderation decision was incorrect. Be specific about the content in question and provide context that might help our team understand your perspective."
                    required
                    disabled={submitFeedbackMutation.isPending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 10 characters required
                  </p>
                </div>

                {/* Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        Feedback Guidelines
                      </h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Be respectful and constructive in your feedback</li>
                        <li>• Provide specific examples from your content</li>
                        <li>• Explain why you believe the decision was incorrect</li>
                        <li>• Include any relevant context or clarifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {submitFeedbackMutation.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="text-sm text-red-800">
                        Failed to submit feedback. Please try again.
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submitFeedbackMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !feedback.trim() ||
                      feedback.trim().length < 10 ||
                      submitFeedbackMutation.isPending
                    }
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {submitFeedbackMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}