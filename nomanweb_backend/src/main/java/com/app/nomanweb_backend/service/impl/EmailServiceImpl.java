package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.email.from}")
    private String fromEmail;

    @Override
    public void sendVerificationEmail(User user, String verificationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Verify Your Email Address");

            String verificationUrl = frontendUrl + "/verify-email?token=" + verificationToken;
            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "Welcome to NoManWeb! Please verify your email address by clicking the link below:\n\n" +
                            "%s\n\n" +
                            "This link will expire in 48 hours.\n\n" +
                            "If you didn't create an account with NoManWeb, please ignore this email.\n\n" +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                    verificationUrl);

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send verification email");
        }
    }

    @Override
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Password Reset Request");

            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "You requested a password reset for your NoManWeb account. Click the link below to reset your password:\n\n"
                            +
                            "%s\n\n" +
                            "This link will expire in 24 hours.\n\n" +
                            "If you didn't request a password reset, please ignore this email and your password will remain unchanged.\n\n"
                            +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                    resetUrl);

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send password reset email");
        }
    }

    @Override
    public void sendWelcomeEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("Welcome to NoManWeb!");

            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "Welcome to NoManWeb! Your email has been verified and your account is now active.\n\n" +
                            "You can now:\n" +
                            "- Create and publish your stories\n" +
                            "- Follow your favorite authors\n" +
                            "- Earn coins through your content\n" +
                            "- Join our vibrant community\n\n" +
                            "Start your storytelling journey: %s\n\n" +
                            "Happy writing!\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                    frontendUrl + "/dashboard");

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Welcome email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", user.getEmail(), e);
        }
    }

    @Override
    public void sendPasswordChangeNotification(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Password Changed");

            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "Your NoManWeb account password has been successfully changed.\n\n" +
                            "If you didn't make this change, please contact our support team immediately.\n\n" +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Password change notification sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password change notification to: {}", user.getEmail(), e);
        }
    }

    @Override
    public void sendEmailChangeNotification(User user, String oldEmail) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(oldEmail);
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Email Address Changed");

            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "Your NoManWeb account email address has been successfully changed from %s to %s.\n\n" +
                            "If you didn't make this change, please contact our support team immediately.\n\n" +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                    oldEmail,
                    user.getEmail());

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Email change notification sent to old email: {}", oldEmail);
        } catch (Exception e) {
            log.error("Failed to send email change notification to: {}", oldEmail, e);
        }
    }

    @Override
    public void sendEmailChangeVerificationEmail(User user, String newEmail, String verificationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(newEmail);
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Verify Your New Email Address");

            String verificationUrl = frontendUrl + "/verify-email-change?token=" + verificationToken;
            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "You requested to change your NoManWeb account email address to this email.\n\n" +
                            "Please click the link below to verify this email address:\n\n" +
                            "%s\n\n" +
                            "This link will expire in 24 hours.\n\n" +
                            "If you didn't request this change, please ignore this email and your email address will remain unchanged.\n\n"
                            +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    user.getDisplayName() != null ? user.getDisplayName() : user.getUsername(),
                    verificationUrl);

            message.setText(emailBody);
            mailSender.send(message);

            log.info("Email change verification email sent to: {}", newEmail);
        } catch (Exception e) {
            log.error("Failed to send email change verification email to: {}", newEmail, e);
            throw new RuntimeException("Failed to send email change verification email");
        }
    }

    @Override
    public void sendCollaborationInvitationEmail(User invitee, User inviter, String chapterTitle, String storyTitle,
            String role, String invitationUrl, String customMessage) {
        try {
            log.info("Starting to send collaboration invitation email to: {}", invitee.getEmail());

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(invitee.getEmail());
            message.setFrom(fromEmail);
            message.setSubject("NoManWeb - Collaboration Invitation - " + chapterTitle);

            String emailBody = String.format(
                    "Hello %s,\n\n" +
                            "%s has invited you to collaborate on the chapter \"%s\" from the story \"%s\".\n\n" +
                            "Role: %s\n\n" +
                            "%s\n\n" +
                            "Click here to accept the invitation: %s\n\n" +
                            "This invitation will expire in 7 days.\n\n" +
                            "Best regards,\n" +
                            "The NoManWeb Team",
                    invitee.getDisplayName() != null ? invitee.getDisplayName() : invitee.getUsername(),
                    inviter != null ? inviter.getDisplayName() : "Someone",
                    chapterTitle,
                    storyTitle,
                    role,
                    customMessage != null && !customMessage.trim().isEmpty()
                            ? "Message from inviter: " + customMessage + "\n\n"
                            : "",
                    invitationUrl);

            message.setText(emailBody);

            log.info("Email message prepared:");
            log.info("  - To: {}", invitee.getEmail());
            log.info("  - From: {}", fromEmail);
            log.info("  - Subject: {}", message.getSubject());
            log.info("  - Body length: {} characters", emailBody.length());

            mailSender.send(message);

            log.info("Collaboration invitation email sent successfully to: {} for chapter: {}", invitee.getEmail(),
                    chapterTitle);
        } catch (Exception e) {
            log.error("Failed to send collaboration invitation email to: {} for chapter: {}", invitee.getEmail(),
                    chapterTitle, e);
            // Re-throw the exception so the calling code can handle it
            throw new RuntimeException("Failed to send collaboration invitation email", e);
        }
    }
}