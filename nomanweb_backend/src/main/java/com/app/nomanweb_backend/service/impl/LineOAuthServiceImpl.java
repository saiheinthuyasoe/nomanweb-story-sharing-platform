package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.LineOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LineOAuthServiceImpl implements LineOAuthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String LINE_PROFILE_API = "https://api.line.me/v2/profile";

    @Override
    public LineProfile getUserProfile(String accessToken) {
        try {
            log.info("Getting LINE user profile with access token length: {}", accessToken.length());
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            log.info("Calling LINE Profile API: {}", LINE_PROFILE_API);
            ResponseEntity<Map> response = restTemplate.exchange(
                    LINE_PROFILE_API,
                    HttpMethod.GET,
                    entity,
                    Map.class);

            log.info("LINE API Response status: {}", response.getStatusCode());
            log.debug("LINE API Response body: {}", response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();

                LineProfile profile = new LineProfile();
                profile.setUserId((String) body.get("userId"));
                profile.setDisplayName((String) body.get("displayName"));
                profile.setPictureUrl((String) body.get("pictureUrl"));
                profile.setStatusMessage((String) body.get("statusMessage"));

                log.info("Successfully retrieved LINE profile for user: {}", profile.getUserId());
                log.debug("Profile details - Display Name: {}, Picture URL: {}", profile.getDisplayName(), profile.getPictureUrl());
                
                return profile;
            } else {
                log.error("LINE API returned non-success status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to get LINE profile");
            }
        } catch (Exception e) {
            log.error("Failed to retrieve LINE user profile", e);
            throw new RuntimeException("Failed to retrieve LINE user profile");
        }
    }
}