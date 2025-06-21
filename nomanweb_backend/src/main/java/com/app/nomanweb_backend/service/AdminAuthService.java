package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.admin.*;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.AdminInvitation;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface AdminAuthService {

    // Admin Authentication
    LoginResponse adminLogin(AdminLoginRequest request);

    LoginResponse adminRegister(AdminRegisterRequest request);

    // Admin Invitation Management
    AdminInvitationResponse createInvitation(AdminInvitationRequest request, UUID currentAdminId);

    AdminInvitationResponse validateInvitation(String invitationToken);

    List<AdminInvitationResponse> getAllInvitations();

    Page<AdminInvitationResponse> getInvitations(Pageable pageable);

    AdminInvitationResponse revokeInvitation(UUID invitationId, UUID currentAdminId);

    // Admin User Management
    void promoteToAdmin(UUID userId, UUID currentAdminId);

    void demoteFromAdmin(UUID userId, UUID currentAdminId);

    List<User> getAllAdmins();

    // Security Methods
    boolean isValidAdminUser(String email);

    void logAdminActivity(String activity, UUID adminId, String details);

    void validateAdminPermissions(UUID adminId, String action);

    // Maintenance
    int cleanupExpiredInvitations();
}