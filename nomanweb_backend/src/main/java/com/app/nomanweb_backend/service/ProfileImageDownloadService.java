package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileImageDownloadService {

    private final FileUploadService fileUploadService;

    public String downloadAndStoreProfileImage(String externalImageUrl, String provider) {
        if (externalImageUrl == null || externalImageUrl.trim().isEmpty()) {
            return null;
        }

        try {
            log.info("Downloading profile image from {}: {}", provider, externalImageUrl);

            // Download image from external URL
            byte[] imageData = downloadImageFromUrl(externalImageUrl);

            if (imageData == null || imageData.length == 0) {
                log.warn("Failed to download image data from: {}", externalImageUrl);
                return null;
            }

            // Create a MultipartFile-like object from the downloaded data
            String filename = generateFilename(provider);
            CustomMultipartFile multipartFile = new CustomMultipartFile(
                    imageData,
                    filename,
                    "image/jpeg");

            // Upload to Cloudinary
            String cloudinaryUrl = fileUploadService.uploadImage(multipartFile, "profile_images");

            log.info("Successfully stored {} profile image in Cloudinary: {}", provider, cloudinaryUrl);
            return cloudinaryUrl;

        } catch (Exception e) {
            log.error("Failed to download and store profile image from {}: {}", provider, externalImageUrl, e);
            return externalImageUrl; // Fallback to original URL
        }
    }

    private byte[] downloadImageFromUrl(String imageUrl) throws IOException {
        URL url = new URL(imageUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        // Set headers to mimic a browser request
        connection.setRequestMethod("GET");
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        connection.setRequestProperty("Accept", "image/*");
        connection.setConnectTimeout(10000); // 10 seconds
        connection.setReadTimeout(10000); // 10 seconds

        try {
            int responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                try (InputStream inputStream = connection.getInputStream()) {
                    return inputStream.readAllBytes();
                }
            } else {
                log.warn("Failed to download image, HTTP response code: {}", responseCode);
                return null;
            }
        } finally {
            connection.disconnect();
        }
    }

    private String generateFilename(String provider) {
        return provider.toLowerCase() + "_profile_" + UUID.randomUUID().toString() + ".jpg";
    }

    // Custom MultipartFile implementation for downloaded images
    private static class CustomMultipartFile implements MultipartFile {
        private final byte[] data;
        private final String filename;
        private final String contentType;

        public CustomMultipartFile(byte[] data, String filename, String contentType) {
            this.data = data;
            this.filename = filename;
            this.contentType = contentType;
        }

        @Override
        public String getName() {
            return "file";
        }

        @Override
        public String getOriginalFilename() {
            return filename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return data == null || data.length == 0;
        }

        @Override
        public long getSize() {
            return data.length;
        }

        @Override
        public byte[] getBytes() throws IOException {
            return data;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return new ByteArrayInputStream(data);
        }

        @Override
        public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
            throw new UnsupportedOperationException("transferTo not supported");
        }
    }
}