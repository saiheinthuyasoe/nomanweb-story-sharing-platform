package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.moderation.ContentModerationResult;
import com.app.nomanweb_backend.service.ContentModerationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ContentModerationServiceImpl implements ContentModerationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${moderation.api.url:https://arkar1431-language-detector.hf.space/predict}")
    private String moderationApiUrl;

    @Value("${moderation.offensive.threshold:0.7}")
    private double offensiveThreshold;

    @Value("${moderation.auto.approve.threshold:0.8}")
    private double autoApproveThreshold;

    public ContentModerationServiceImpl() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public ContentModerationResult analyzeContent(String content) {
        try {
            // Extract plain text from HTML if needed
            String plainText = extractTextFromHtml(content);

            if (plainText == null || plainText.trim().isEmpty()) {
                return ContentModerationResult.safe(0.0, "unknown", "Empty content", "normal", new HashMap<>());
            }

            // Prepare request payload
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("text", plainText);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(
                    moderationApiUrl,
                    HttpMethod.POST,
                    request,
                    String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return parseApiResponse(response.getBody());
            } else {
                log.error("API call failed with status: {}", response.getStatusCode());
                return ContentModerationResult.error("API call failed: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error analyzing content: ", e);
            return ContentModerationResult.error("Analysis failed: " + e.getMessage());
        }
    }

    @Override
    public String extractTextFromHtml(String htmlContent) {
        if (htmlContent == null) {
            return null;
        }

        try {
            // Use Jsoup to parse HTML and extract text
            return Jsoup.parse(htmlContent).text();
        } catch (Exception e) {
            log.warn("Failed to parse HTML content, using as plain text: ", e);
            return htmlContent;
        }
    }

    @Override
    public boolean isContentOffensive(String content) {
        ContentModerationResult result = analyzeContent(content);
        return result.isOffensive() && result.getConfidenceScore() >= offensiveThreshold;
    }

    @Override
    public ContentModerationResult moderateChapterContent(String title, String content) {
        try {
            // Combine title and content for comprehensive analysis
            String combinedContent = (title != null ? title + "\n\n" : "") + (content != null ? content : "");

            if (combinedContent.trim().isEmpty()) {
                return ContentModerationResult.safe(1.0, "unknown", "Empty content - auto-approved", "normal",
                        new HashMap<>());
            }

            // Analyze the combined content
            ContentModerationResult result = analyzeContent(combinedContent);

            // Add AI moderation decision details
            String aiDecision = shouldAutoApprove(result) ? "AUTO-APPROVED" : "AUTO-REJECTED";
            String enhancedDetails = String.format("AI Decision: %s | %s", aiDecision, result.getAnalysisDetails());

            return new ContentModerationResult(
                    result.isOffensive(),
                    result.getConfidenceScore(),
                    result.getDetectedLanguage(),
                    enhancedDetails,
                    result.getErrorMessage(),
                    result.getPredictedCategory(),
                    result.getAllProbabilities());

        } catch (Exception e) {
            log.error("Error in AI chapter moderation: ", e);
            return ContentModerationResult.error("AI moderation failed: " + e.getMessage());
        }
    }

    @Override
    public boolean shouldAutoApprove(ContentModerationResult moderationResult) {
        if (moderationResult.getErrorMessage() != null) {
            // If there's an error, default to manual review (return false)
            return false;
        }

        // Check if the predicted category is any problematic content type
        String category = moderationResult.getPredictedCategory();
        if (category != null) {
            String lowerCategory = category.toLowerCase();
            boolean isProblematicContent = lowerCategory.contains("offensive") ||
                    lowerCategory.contains("hate") ||
                    lowerCategory.contains("religious") ||
                    lowerCategory.contains("political");

            if (isProblematicContent) {
                log.info("Auto-rejecting content with category: {} (confidence: {:.3f})",
                        category, moderationResult.getConfidenceScore());
                return false; // Auto-reject all problematic content
            }
        }

        // Auto-approve only if content is flagged as safe (normal category)
        // If isOffensive is true, always reject
        if (moderationResult.isOffensive()) {
            log.info("Auto-rejecting offensive content with category: {} (confidence: {:.3f})",
                    category, moderationResult.getConfidenceScore());
            return false;
        }

        // Only auto-approve if category is explicitly "normal" or safe
        boolean shouldApprove = category != null && category.toLowerCase().equals("normal");

        log.info("Auto-approval decision: {} for category: {} (offensive: {}, confidence: {:.3f})",
                shouldApprove, category, moderationResult.isOffensive(), moderationResult.getConfidenceScore());

        return shouldApprove;
    }

    private ContentModerationResult parseApiResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            // Parse response from new Hugging Face endpoint format
            boolean isOffensive = root.get("is_offensive").asBoolean();
            double confidenceScore = root.get("confidence_score").asDouble();
            String predictedCategory = root.get("predicted_category").asText();

            // Parse probabilities (support both old and new format)
            Map<String, Double> allProbabilities = new HashMap<>();
            JsonNode probabilitiesNode = root.get("probabilities");
            if (probabilitiesNode == null) {
                probabilitiesNode = root.get("all_probabilities"); // Fallback to old format
            }

            if (probabilitiesNode != null) {
                probabilitiesNode.fields().forEachRemaining(entry -> {
                    allProbabilities.put(entry.getKey(), entry.getValue().asDouble());
                });
            }

            String details = String.format("Category: %s, Confidence: %.3f", predictedCategory, confidenceScore);

            log.info("AI Moderation Result - Category: {}, Confidence: {:.3f}, IsOffensive: {}",
                    predictedCategory, confidenceScore, isOffensive);

            if (isOffensive) {
                return ContentModerationResult.offensive(confidenceScore, "detected", details, predictedCategory,
                        allProbabilities);
            } else {
                return ContentModerationResult.safe(confidenceScore, "detected", details, predictedCategory,
                        allProbabilities);
            }

        } catch (Exception e) {
            log.error("Error parsing API response: ", e);
            return ContentModerationResult.error("Failed to parse API response: " + e.getMessage());
        }
    }
}