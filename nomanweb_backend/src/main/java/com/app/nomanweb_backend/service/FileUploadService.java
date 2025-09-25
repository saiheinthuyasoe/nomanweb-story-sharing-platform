package com.app.nomanweb_backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface FileUploadService {

    /**
     * Upload an image to cloud storage
     * 
     * @param file   The image file to upload
     * @param folder The folder to store the image in (e.g., "profile_images",
     *               "story_covers")
     * @return The uploaded image URL
     */
    String uploadImage(MultipartFile file, String folder);

    /**
     * Delete an image from cloud storage
     * 
     * @param imageUrl The URL of the image to delete
     */
    void deleteImage(String imageUrl);

    /**
     * Validate if the uploaded file is a valid image
     * 
     * @param file The file to validate
     * @return true if valid image, false otherwise
     */
    boolean isValidImageFile(MultipartFile file);

    /**
     * Get upload parameters for direct frontend upload (optional)
     * 
     * @param folder The folder to upload to
     * @return Map containing upload parameters
     */
    Map<String, Object> getUploadParameters(String folder);

    /**
     * Extract public ID from Cloudinary URL for deletion
     * 
     * @param imageUrl The Cloudinary image URL
     * @return The public ID of the image
     */
    String extractPublicIdFromUrl(String imageUrl);
}