package com.app.nomanweb_backend.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class FirebaseService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Custom class to hold token info when Firebase Admin SDK is not available
    public static class GoogleTokenInfo {
        private final JsonNode tokenInfo;

        public GoogleTokenInfo(JsonNode tokenInfo) {
            this.tokenInfo = tokenInfo;
        }

        public String getSubject() {
            return tokenInfo.get("sub").asText();
        }

        public String getEmail() {
            return tokenInfo.has("email") ? tokenInfo.get("email").asText() : null;
        }

        public String getName() {
            return tokenInfo.has("name") ? tokenInfo.get("name").asText() : null;
        }

        public String getPicture() {
            return tokenInfo.has("picture") ? tokenInfo.get("picture").asText() : null;
        }

        public boolean isEmailVerified() {
            return tokenInfo.has("email_verified") && tokenInfo.get("email_verified").asBoolean();
        }
    }

    // Return either FirebaseToken or GoogleTokenInfo
    public Object verifyGoogleToken(String idToken) {
        try {
            // Try Firebase Admin SDK first
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            log.info("Successfully verified Google token for user: {}", decodedToken.getEmail());
            return decodedToken;
        } catch (Exception e) {
            log.warn("Firebase Admin SDK not available, using Google tokeninfo API for verification");
            return verifyTokenWithGoogleAPI(idToken);
        }
    }

    private GoogleTokenInfo verifyTokenWithGoogleAPI(String idToken) {
        try {
            // Use Google's tokeninfo endpoint for verification
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            String response = restTemplate.getForObject(url, String.class);

            JsonNode tokenInfo = objectMapper.readTree(response);

            return new GoogleTokenInfo(tokenInfo);
        } catch (Exception e) {
            log.error("Failed to verify Google token with Google API", e);
            throw new RuntimeException("Invalid Google token");
        }
    }

    public String extractGoogleId(Object token) {
        if (token instanceof GoogleTokenInfo) {
            return ((GoogleTokenInfo) token).getSubject();
        }
        return ((FirebaseToken) token).getUid();
    }

    public String extractEmail(Object token) {
        if (token instanceof GoogleTokenInfo) {
            return ((GoogleTokenInfo) token).getEmail();
        }
        return ((FirebaseToken) token).getEmail();
    }

    public String extractName(Object token) {
        if (token instanceof GoogleTokenInfo) {
            return ((GoogleTokenInfo) token).getName();
        }
        return (String) ((FirebaseToken) token).getClaims().get("name");
    }

    public String extractPicture(Object token) {
        if (token instanceof GoogleTokenInfo) {
            return ((GoogleTokenInfo) token).getPicture();
        }
        return (String) ((FirebaseToken) token).getClaims().get("picture");
    }

    public boolean isEmailVerified(Object token) {
        if (token instanceof GoogleTokenInfo) {
            return ((GoogleTokenInfo) token).isEmailVerified();
        }
        Boolean emailVerified = (Boolean) ((FirebaseToken) token).getClaims().get("email_verified");
        return emailVerified != null && emailVerified;
    }
}