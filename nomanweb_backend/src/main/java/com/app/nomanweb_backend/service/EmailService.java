package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.User;

public interface EmailService {

    void sendVerificationEmail(User user, String verificationToken);

    void sendPasswordResetEmail(User user, String resetToken);

    void sendWelcomeEmail(User user);

    void sendPasswordChangeNotification(User user);

    void sendEmailChangeNotification(User user, String oldEmail);

    void sendEmailChangeVerificationEmail(User user, String newEmail, String verificationToken);

    void sendCollaborationInvitationEmail(User invitee, User inviter, String chapterTitle, String storyTitle,
            String role, String invitationUrl, String customMessage);

    void sendSocialNotificationEmail(String email, String username, String title, String message);

    void sendContentNotificationEmail(String email, String username, String title, String message);

    void sendSystemNotificationEmail(String email, String username, String title, String message);

    void sendGeneralNotificationEmail(String email, String username, String title, String message);
}