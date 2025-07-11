package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.admin.AdminLoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.User;

import java.util.List;
import java.util.UUID;

public interface AdminAuthService {

    // Admin Authentication
    LoginResponse adminLogin(AdminLoginRequest request);

    // Admin User Management
    void promoteToAdmin(UUID userId, UUID currentAdminId);

    void demoteFromAdmin(UUID userId, UUID currentAdminId);

    List<User> getAllAdmins();

    // Security Methods
    boolean isValidAdminUser(String email);

    void logAdminActivity(String activity, UUID adminId, String details);

    void validateAdminPermissions(UUID adminId, String action);
}