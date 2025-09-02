package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.moderation.ContentModerationResult;

public interface ContentModerationService {

    /**
     * Analyze content for offensive material using AI detection
     * 
     * @param content The text content to analyze
     * @return ContentModerationResult containing analysis results
     */
    ContentModerationResult analyzeContent(String content);

    /**
     * Extract plain text from HTML content for analysis
     * 
     * @param htmlContent The HTML content to convert
     * @return Plain text without HTML tags
     */
    String extractTextFromHtml(String htmlContent);

    /**
     * Check if content is considered offensive based on AI analysis
     * 
     * @param content The text content to check
     * @return true if content is flagged as offensive
     */
    boolean isContentOffensive(String content);

    /**
     * Automatically moderate chapter content using AI analysis
     * 
     * @param title The chapter title
     * @param content The chapter content
     * @return ContentModerationResult with AI decision and reasoning
     */
    ContentModerationResult moderateChapterContent(String title, String content);

    /**
     * Determine if content should be automatically approved based on AI analysis
     * 
     * @param moderationResult The AI analysis result
     * @return true if content should be auto-approved
     */
    boolean shouldAutoApprove(ContentModerationResult moderationResult);
}