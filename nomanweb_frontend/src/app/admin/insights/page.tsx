"use client";

import React from "react";
import { toast } from "react-hot-toast";
import BookInsightsDashboard from "@/components/admin/BookInsightsDashboard";
import { adminHomepageService } from "@/services/adminHomepageService";
import { BookInsight } from "@/services/bookInsightsService";

export default function AdminInsightsPage() {
  const handleAddToSection = async (
    book: BookInsight,
    sectionType: string,
    duration: number = 0
  ) => {
    try {
      await adminHomepageService.addToFeaturedContent(
        book.id,
        sectionType,
        duration
      );
      toast.success(
        `"${book.title}" added to ${sectionType} section successfully!`
      );
    } catch (error) {
      console.error("Error adding book to section:", error);
      toast.error("Failed to add book to section");
      throw error; // Re-throw to let the dashboard handle the error state
    }
  };

  return (
    <div className="p-6">
      <BookInsightsDashboard onAddToSection={handleAddToSection} />
    </div>
  );
}
