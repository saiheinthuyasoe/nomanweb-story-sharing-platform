package com.app.nomanweb_backend.dto.auth;

import com.app.nomanweb_backend.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {

    private User user;
    private String token;
    private String refreshToken;
}