package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.auth.LoginResponse;

public interface OAuthService {

    LoginResponse authenticateWithGoogle(String idToken);

    LoginResponse authenticateWithLine(String accessToken);

    void linkGoogleAccount(String userId, String idToken);

    void linkLineAccount(String userId, String accessToken);
}