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
            log.debug("Parsing API response: {}", responseBody);
            JsonNode root = objectMapper.readTree(responseBody);

            // Handle Hugging Face Spaces response format
            JsonNode dataNode = root.get("data");
            if (dataNode != null && dataNode.isArray() && dataNode.size() > 0) {
                // Hugging Face Spaces format: {"data": [{"label": "...", "confidences": [...]}]}
                JsonNode firstResult = dataNode.get(0);
                
                if (firstResult.has("label")) {
                    String label = firstResult.get("label").asText();
                    boolean isOffensive = "OFFENSIVE".equalsIgnoreCase(label) || "offensive".equalsIgnoreCase(label);
                    
                    // Extract confidence score
                    double confidenceScore = 0.5; // Default
                    Map<String, Double> allProbabilities = new HashMap<>();
                    
                    JsonNode confidencesNode = firstResult.get("confidences");
                    if (confidencesNode != null && confidencesNode.isArray()) {
                        for (JsonNode confidence : confidencesNode) {
                            String confLabel = confidence.get("label").asText();
                            double confScore = confidence.get("confidence").asDouble();
                            allProbabilities.put(confLabel, confScore);
                            
                            // Use the confidence score of the predicted label
                            if (confLabel.equalsIgnoreCase(label)) {
                                confidenceScore = confScore;
                            }
                        }
                    }
                    
                    String details = String.format("Category: %s, Confidence: %.3f", label, confidenceScore);
                    
                    log.info("AI Moderation Result - Category: {}, Confidence: {:.3f}, IsOffensive: {}",
                            label, confidenceScore, isOffensive);
                    
                    if (isOffensive) {
                        return ContentModerationResult.offensive(confidenceScore, "detected", details, label,
                                allProbabilities);
                    } else {
                        return ContentModerationResult.safe(confidenceScore, "detected", details, label,
                                allProbabilities);
                    }
                }
            }

            // Fallback: Try to parse custom format (backward compatibility)
            JsonNode isOffensiveNode = root.get("is_offensive");
            JsonNode confidenceScoreNode = root.get("confidence_score");
            JsonNode predictedCategoryNode = root.get("predicted_category");

            if (isOffensiveNode != null && confidenceScoreNode != null) {
                boolean isOffensive = isOffensiveNode.asBoolean();
                double confidenceScore = confidenceScoreNode.asDouble();
                String predictedCategory = predictedCategoryNode != null ? predictedCategoryNode.asText() : "unknown";

                // Parse probabilities (support both old and new format)
                Map<String, Double> allProbabilities = new HashMap<>();
                JsonNode probabilitiesNode = root.get("probabilities");
                if (probabilitiesNode == null) {
                    probabilitiesNode = root.get("all_probabilities"); // Fallback to old format
                }

                if (probabilitiesNode != null) {
                    probabilitiesNode.fields().forEachRemaining(entry -> {
                        JsonNode valueNode = entry.getValue();
                        if (valueNode != null && !valueNode.isNull()) {
                            allProbabilities.put(entry.getKey(), valueNode.asDouble());
                        }
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
            }

            // If we can't parse the response, log it and return an error
            log.error("Unable to parse API response format: {}", responseBody);
            return ContentModerationResult.error("Unsupported API response format");

        } catch (Exception e) {
            log.error("Error parsing API response: ", e);
            return ContentModerationResult.error("Failed to parse API response: " + e.getMessage());
        }
    }
}