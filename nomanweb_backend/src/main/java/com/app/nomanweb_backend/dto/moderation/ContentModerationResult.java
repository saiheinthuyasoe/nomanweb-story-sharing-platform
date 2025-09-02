package com.app.nomanweb_backend.dto.moderation;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContentModerationResult {

    private boolean isOffensive;
    private double confidenceScore;
    private String detectedLanguage;
    private String analysisDetails;
    private String errorMessage;
    private String predictedCategory;
    private Map<String, Double> allProbabilities;

    public static ContentModerationResult offensive(double confidenceScore, String detectedLanguage, String details, String predictedCategory, Map<String, Double> allProbabilities) {
        return new ContentModerationResult(true, confidenceScore, detectedLanguage, details, null, predictedCategory, allProbabilities);
    }

    public static ContentModerationResult safe(double confidenceScore, String detectedLanguage, String details, String predictedCategory, Map<String, Double> allProbabilities) {
        return new ContentModerationResult(false, confidenceScore, detectedLanguage, details, null, predictedCategory, allProbabilities);
    }

    public static ContentModerationResult error(String errorMessage) {
        return new ContentModerationResult(false, 0.0, null, null, errorMessage, null, null);
    }
}