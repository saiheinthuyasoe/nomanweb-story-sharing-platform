package com.app.nomanweb_backend.dto.refund;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    private UUID storyId;
    private UUID chapterId;
    private String reason;
    private RefundType refundType;

    public enum RefundType {
        STORY_DELETION,
        CHAPTER_DELETION,
        STORY_UNPUBLISH,
        CHAPTER_UNPUBLISH,
        PRICING_CHANGE_TO_FREE,
        PRICING_CHANGE
    }
}