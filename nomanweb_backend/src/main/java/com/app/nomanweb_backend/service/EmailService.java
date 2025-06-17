package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.User;

public interface EmailService {

    void sendVerificationEmail(User user, String verificationToken);

    void sendPasswordResetEmail(User user, String resetToken);

    void sendWelcomeEmail(User user);

    void sendPasswordChangeNotification(User user);
}