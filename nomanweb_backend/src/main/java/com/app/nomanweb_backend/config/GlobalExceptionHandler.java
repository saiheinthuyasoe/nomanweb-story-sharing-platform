package com.app.nomanweb_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            log.error("Validation error - Field: {}, Message: {}, Rejected value: {}",
                    fieldName, errorMessage, ((FieldError) error).getRejectedValue());
        });

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Validation failed");
        response.put("errors", errors);

        log.error("Validation failed with {} errors", errors.size());
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        String message = ex.getMessage();
        
        // Log the exception for debugging
        log.error("RuntimeException caught: {}", message, ex);
        
        // Determine appropriate HTTP status based on the error message
        HttpStatus status;
        if (message != null) {
            if (message.contains("already purchased") || 
                message.contains("already have access")) {
                status = HttpStatus.CONFLICT; // 409
            } else if (message.contains("Insufficient coins")) {
                status = HttpStatus.PAYMENT_REQUIRED; // 402
            } else if (message.contains("not found") || 
                      message.contains("User not found") ||
                      message.contains("Story not found")) {
                status = HttpStatus.NOT_FOUND; // 404
            } else if (message.contains("Authors can read")) {
                status = HttpStatus.FORBIDDEN; // 403
            } else {
                status = HttpStatus.BAD_REQUEST; // 400
            }
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR; // 500
            message = "An unexpected error occurred";
        }
        
        response.put("error", message);
        response.put("status", status.value());
        
        return ResponseEntity.status(status).body(response);
    }
}