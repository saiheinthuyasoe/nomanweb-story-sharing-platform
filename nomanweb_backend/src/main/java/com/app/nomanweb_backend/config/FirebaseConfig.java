package com.app.nomanweb_backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-key:firebase-service-account.json}")
    private String serviceAccountKeyPath;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials = getFirebaseCredentials();

                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();

                FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK initialized successfully");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin SDK", e);
            // Don't throw exception to allow app to start without Firebase
            log.warn("Firebase OAuth will not be available");
        }
    }

    private GoogleCredentials getFirebaseCredentials() throws IOException {
        // Option 1: Try to load from external file path (for Render, Docker, and other
        // deployments)
        if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isEmpty()) {
            // Check if it's an absolute path (external file)
            if (serviceAccountKeyPath.startsWith("/") || serviceAccountKeyPath.contains(":")) {
                if (Files.exists(Paths.get(serviceAccountKeyPath))) {
                    log.info("Loading Firebase credentials from external file: {}", serviceAccountKeyPath);
                    return GoogleCredentials.fromStream(new FileInputStream(serviceAccountKeyPath));
                } else {
                    log.warn("External Firebase service account file not found: {}", serviceAccountKeyPath);
                }
            } else {
                // Check common deployment secret file locations
                String[] commonPaths = {
                        // Render secret files
                        "/etc/secrets/" + serviceAccountKeyPath,
                        "/opt/render/project/secrets/" + serviceAccountKeyPath,
                        // Docker secrets
                        "/run/secrets/" + serviceAccountKeyPath,
                        // Kubernetes secrets
                        "/var/secrets/" + serviceAccountKeyPath,
                        // Heroku and other platforms
                        "/app/secrets/" + serviceAccountKeyPath,
                        // Generic /tmp location
                        "/tmp/" + serviceAccountKeyPath,
                        // Current working directory
                        "./" + serviceAccountKeyPath,
                        // Project root
                        "../" + serviceAccountKeyPath
                };

                for (String path : commonPaths) {
                    if (Files.exists(Paths.get(path))) {
                        log.info("Loading Firebase credentials from deployment secret file: {}", path);
                        return GoogleCredentials.fromStream(new FileInputStream(path));
                    }
                }

                // Option 2: Try to load from classpath (for development and packaged resources)
                try {
                    ClassPathResource resource = new ClassPathResource(serviceAccountKeyPath);
                    if (resource.exists() && resource.isReadable()) {
                        log.info("Loading Firebase credentials from classpath: {}", serviceAccountKeyPath);
                        return GoogleCredentials.fromStream(resource.getInputStream());
                    }
                } catch (Exception e) {
                    log.warn("Firebase service account key not found in classpath: {} - {}", serviceAccountKeyPath,
                            e.getMessage());
                }

                // Option 2b: Try alternative classpath locations
                String[] classpathPaths = {
                        "config/" + serviceAccountKeyPath,
                        "secrets/" + serviceAccountKeyPath,
                        "firebase/" + serviceAccountKeyPath,
                        "credentials/" + serviceAccountKeyPath
                };

                for (String cpPath : classpathPaths) {
                    try {
                        ClassPathResource resource = new ClassPathResource(cpPath);
                        if (resource.exists() && resource.isReadable()) {
                            log.info("Loading Firebase credentials from classpath: {}", cpPath);
                            return GoogleCredentials.fromStream(resource.getInputStream());
                        }
                    } catch (Exception e) {
                        // Continue to next path
                        log.debug("Classpath location not found: {}", cpPath);
                    }
                }
            }
        }

        // Option 3: Try environment variable containing JSON content
        String firebaseJson = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");
        if (firebaseJson != null && !firebaseJson.trim().isEmpty()) {
            try {
                log.info("Loading Firebase credentials from environment variable FIREBASE_SERVICE_ACCOUNT_JSON");
                return GoogleCredentials.fromStream(
                        new java.io.ByteArrayInputStream(firebaseJson.getBytes()));
            } catch (Exception e) {
                log.warn("Failed to parse Firebase credentials from environment variable: {}", e.getMessage());
            }
        }

        // Option 4: Try alternative environment variables for file paths
        String[] envVars = {
                "FIREBASE_SERVICE_ACCOUNT_KEY",
                "FIREBASE_CREDENTIALS_PATH",
                "GOOGLE_APPLICATION_CREDENTIALS",
                "FIREBASE_CONFIG_PATH"
        };

        for (String envVar : envVars) {
            String envPath = System.getenv(envVar);
            if (envPath != null && !envPath.trim().isEmpty() && Files.exists(Paths.get(envPath))) {
                try {
                    log.info("Loading Firebase credentials from environment variable {}: {}", envVar, envPath);
                    return GoogleCredentials.fromStream(new FileInputStream(envPath));
                } catch (Exception e) {
                    log.warn("Failed to load Firebase credentials from {}: {}", envPath, e.getMessage());
                }
            }
        }

        // Option 5: Use default credentials (for Google Cloud, App Engine, Compute
        // Engine)
        try {
            log.info("Attempting to use default Google credentials (ADC)");
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException e) {
            log.warn("Default Google credentials not available: {}", e.getMessage());
            throw new IOException("No Firebase credentials found. Please configure one of the following:\n" +
                    "1. Set firebase.service-account-key property to file path\n" +
                    "2. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable with JSON content\n" +
                    "3. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable with file path\n" +
                    "4. Place firebase-service-account.json in classpath\n" +
                    "5. Use Google Cloud default credentials (ADC)", e);
        }
    }
}