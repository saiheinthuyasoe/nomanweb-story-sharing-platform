package com.app.nomanweb_backend.dto.upload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {

    private boolean success;
    private String message;
    private String imageUrl;
    private String publicId;
    private Long fileSize;
    private String originalFilename;
    private String folder;

    public static FileUploadResponse success(String imageUrl, String publicId, Long fileSize, String originalFilename,
            String folder) {
        return FileUploadResponse.builder()
                .success(true)
                .message("File uploaded successfully")
                .imageUrl(imageUrl)
                .publicId(publicId)
                .fileSize(fileSize)
                .originalFilename(originalFilename)
                .folder(folder)
                .build();
    }

    public static FileUploadResponse error(String message) {
        return FileUploadResponse.builder()
                .success(false)
                .message(message)
                .build();
    }
}