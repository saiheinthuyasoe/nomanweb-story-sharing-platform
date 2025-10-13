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

    @Value("${moderation.api.url:https://saiheinthuyasoe-offensive-language-detector.hf.space/predict}")
    private String moderationApiUrl;

    @Value("${moderation.offensive.threshold:0.8}")
    private double offensiveThreshold;

    @Value("${moderation.auto.approve.threshold:0.5}")
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
            log.info("Raw API Response: {}", responseBody);
            JsonNode root = objectMapper.readTree(responseBody);
            log.info("Parsed JSON Root: {}", root.toString());

            // Parse all probabilities first
            Map<String, Double> allProbabilities = new HashMap<>();
            
            // First try to get from "all_probabilities" field (if API returns nested structure)
            JsonNode probabilitiesNode = root.get("all_probabilities");
            log.info("Probabilities Node: {}", probabilitiesNode);
            
            if (probabilitiesNode != null) {
                probabilitiesNode.fields().forEachRemaining(entry -> {
                    allProbabilities.put(entry.getKey(), entry.getValue().asDouble());
                });
            } else {
                // If no nested structure, parse probabilities directly from root
                // Look for known probability fields: hate_speech, offensive_language, neither
                if (root.has("hate_speech")) {
                    allProbabilities.put("Hate Speech", root.get("hate_speech").asDouble());
                }
                if (root.has("offensive_language")) {
                    allProbabilities.put("Offensive", root.get("offensive_language").asDouble());
                }
                if (root.has("neither")) {
                    allProbabilities.put("Normal", root.get("neither").asDouble());
                }
                
                // Handle the case where API returns confidence/confidence_score
                // In this case, we need to interpret the response differently
                if (root.has("confidence") || root.has("confidence_score")) {
                    double confidence = root.has("confidence") ? 
                        root.get("confidence").asDouble() : 
                        root.get("confidence_score").asDouble();
                    
                    log.info("API returned confidence score: {}", confidence);
                    
                    // Based on confidence score, create category probabilities
                    // High confidence (>0.8) suggests the content is in the predicted category
                    // We need to determine what category this confidence refers to
                    
                    // Check if there's a predicted_class or similar field
                    String predictedClass = "normal";
                    if (root.has("predicted_class")) {
                        predictedClass = root.get("predicted_class").asText().toLowerCase();
                    } else if (root.has("prediction")) {
                        predictedClass = root.get("prediction").asText().toLowerCase();
                    } else if (root.has("label")) {
                        predictedClass = root.get("label").asText().toLowerCase();
                    }
                    
                    // Create probabilities based on the prediction
                    if (predictedClass.contains("hate") || predictedClass.contains("hate_speech")) {
                        allProbabilities.put("Hate Speech", confidence);
                        allProbabilities.put("Offensive", Math.max(0.0, (1.0 - confidence) * 0.3));
                        allProbabilities.put("Normal", Math.max(0.0, 1.0 - confidence - allProbabilities.get("Offensive")));
                    } else if (predictedClass.contains("offensive")) {
                        allProbabilities.put("Offensive", confidence);
                        allProbabilities.put("Hate Speech", Math.max(0.0, (1.0 - confidence) * 0.2));
                        allProbabilities.put("Normal", Math.max(0.0, 1.0 - confidence - allProbabilities.get("Hate Speech")));
                    } else {
                        // Default to normal/safe content
                        allProbabilities.put("Normal", confidence);
                        allProbabilities.put("Offensive", Math.max(0.0, (1.0 - confidence) * 0.4));
                        allProbabilities.put("Hate Speech", Math.max(0.0, (1.0 - confidence) * 0.2));
                    }
                } else {
                    // Also check for any other numeric fields that might be probabilities
                    root.fields().forEachRemaining(entry -> {
                        if (entry.getValue().isNumber() && 
                            !allProbabilities.containsKey(entry.getKey()) &&
                            entry.getValue().asDouble() >= 0.0 && 
                            entry.getValue().asDouble() <= 1.0) {
                            allProbabilities.put(entry.getKey(), entry.getValue().asDouble());
                        }
                    });
                }
            }
            log.info("Parsed allProbabilities: {}", allProbabilities);

            // Find the category with the highest probability (correct classification)
            String actualPredictedCategory = "Normal";
            double highestProbability = 0.0;

            for (Map.Entry<String, Double> entry : allProbabilities.entrySet()) {
                if (entry.getValue() > highestProbability) {
                    highestProbability = entry.getValue();
                    actualPredictedCategory = entry.getKey();
                }
            }

            // Use the highest probability as confidence score
            double confidence = highestProbability;

            // Determine if content is offensive based on the actual highest probability category
            boolean isOffensive = actualPredictedCategory.equals("Offensive") || 
                                actualPredictedCategory.equals("Hate Speech") ||
                                actualPredictedCategory.toLowerCase().contains("offensive") ||
                                actualPredictedCategory.toLowerCase().contains("hate");

            String details = String.format("Category: %s, Confidence: %.3f", actualPredictedCategory, confidence);

            log.info("AI Moderation Result - Highest Category: {}, Confidence: {:.3f}, IsOffensive: {}",
                    actualPredictedCategory, confidence, isOffensive);

            if (isOffensive) {
                return ContentModerationResult.offensive(confidence, "detected", details, actualPredictedCategory,
                        allProbabilities);
            } else {
                return ContentModerationResult.safe(confidence, "detected", details, actualPredictedCategory,
                        allProbabilities);
            }

        } catch (Exception e) {
            log.error("Error parsing API response: ", e);
            return ContentModerationResult.error("Failed to parse API response: " + e.getMessage());
        }
    }
}