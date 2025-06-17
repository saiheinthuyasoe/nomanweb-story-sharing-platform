package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.FileUploadService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryFileUploadService implements FileUploadService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    // Allowed image types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp");

    // Maximum file size (10MB)
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @PostConstruct
    public void init() {
        Map<String, String> config = new HashMap<>();
        config.put("cloud_name", cloudName);
        config.put("api_key", apiKey);
        config.put("api_secret", apiSecret);
        config.put("secure", "true");

        this.cloudinary = new Cloudinary(config);
        log.info("Cloudinary service initialized with cloud name: {}", cloudName);
    }

    @Override
    public String uploadImage(MultipartFile file, String folder) {
        log.info("Starting image upload to folder: {}", folder);

        // Validate file
        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException("Invalid image file");
        }

        try {
            // Prepare upload options
            Map<String, Object> uploadOptions = ObjectUtils.asMap(
                    "folder", "nomanweb/" + folder,
                    "resource_type", "image",
                    "format", "jpg", // Convert all images to JPG for consistency
                    "quality", "auto:good", // Automatic quality optimization
                    "fetch_format", "auto", // Automatic format selection
                    "flags", "progressive", // Progressive JPEG
                    "width", getMaxWidthForFolder(folder),
                    "height", getMaxHeightForFolder(folder),
                    "crop", "limit" // Don't upscale, only downscale if needed
            );

            // Upload to Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadOptions);
            String imageUrl = (String) uploadResult.get("secure_url");

            log.info("Image uploaded successfully: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return;
        }

        try {
            String publicId = extractPublicIdFromUrl(imageUrl);
            if (publicId != null) {
                Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Image deleted from Cloudinary: {} - Result: {}", publicId, result.get("result"));
            }
        } catch (Exception e) {
            log.error("Failed to delete image from Cloudinary: {}", imageUrl, e);
            // Don't throw exception for deletion failures to avoid breaking the main flow
        }
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("File is null or empty");
            return false;
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("File size too large: {} bytes (max: {} bytes)", file.getSize(), MAX_FILE_SIZE);
            return false;
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            log.warn("Invalid content type: {}", contentType);
            return false;
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            log.warn("No original filename");
            return false;
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");
        if (!allowedExtensions.contains(extension)) {
            log.warn("Invalid file extension: {}", extension);
            return false;
        }

        return true;
    }

    @Override
    public Map<String, Object> getUploadParameters(String folder) {
        // This can be used for direct frontend uploads if needed
        Map<String, Object> params = new HashMap<>();
        params.put("cloud_name", cloudName);
        params.put("api_key", apiKey);
        params.put("folder", "nomanweb/" + folder);
        params.put("resource_type", "image");
        params.put("format", "jpg");
        params.put("quality", "auto:good");

        return params;
    }

    @Override
    public String extractPublicIdFromUrl(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains("cloudinary.com")) {
            return null;
        }

        try {
            // Pattern to extract public ID from Cloudinary URL
            // Example:
            // https://res.cloudinary.com/cloudname/image/upload/v1234567890/nomanweb/profile_images/abc123.jpg
            Pattern pattern = Pattern.compile(".*/(?:v\\d+/)?(.+?)(?:\\.[^.]*)?$");
            Matcher matcher = pattern.matcher(imageUrl);

            if (matcher.find()) {
                return matcher.group(1);
            }
        } catch (Exception e) {
            log.error("Failed to extract public ID from URL: {}", imageUrl, e);
        }

        return null;
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }

    private int getMaxWidthForFolder(String folder) {
        switch (folder.toLowerCase()) {
            case "profile_images":
                return 500; // Profile images max width
            case "story_covers":
                return 800; // Story cover max width
            default:
                return 1200; // Default max width
        }
    }

    private int getMaxHeightForFolder(String folder) {
        switch (folder.toLowerCase()) {
            case "profile_images":
                return 500; // Profile images max height (square)
            case "story_covers":
                return 1200; // Story cover max height
            default:
                return 1200; // Default max height
        }
    }
}