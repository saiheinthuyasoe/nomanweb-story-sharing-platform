package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueAnalyticsResponse {
    private BigDecimal totalEarnings;
    private BigDecimal totalChapterSales;
    private BigDecimal totalGiftEarnings;
    private BigDecimal currentMonthEarnings;
    private BigDecimal lastMonthEarnings;
    private List<DailyRevenue> dailyRevenue;
    private List<TopEarningChapter> topChapters;
    private List<RecentGift> recentGifts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyRevenue {
        private LocalDate date;
        private BigDecimal amount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopEarningChapter {
        private String chapterTitle;
        private String storyTitle;
        private BigDecimal totalRevenue;
        private Long purchaseCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentGift {
        private String senderName;
        private String giftName;
        private BigDecimal earnings;
        private String storyTitle;
        private String message;
    }
}