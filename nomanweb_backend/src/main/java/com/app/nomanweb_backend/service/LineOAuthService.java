package com.app.nomanweb_backend.service;

import lombok.Data;

public interface LineOAuthService {

    LineProfile getUserProfile(String accessToken);

    @Data
    class LineProfile {
        private String userId;
        private String displayName;
        private String pictureUrl;
        private String statusMessage;
    }
}