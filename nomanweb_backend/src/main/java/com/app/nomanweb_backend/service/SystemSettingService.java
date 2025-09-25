package com.app.nomanweb_backend.service;

import java.math.BigDecimal;
import java.util.Map;

public interface SystemSettingService {

    String getSetting(String key);

    String getSetting(String key, String defaultValue);

    void setSetting(String key, String value);

    void setSetting(String key, String value, String description);

    // Monetization specific settings
    BigDecimal getPlatformFeePercentage();

    BigDecimal getGiftRecipientPercentage();

    BigDecimal getAuthorEarningsPercentage();

    Integer getMinCoinsForWithdrawal();

    Integer getMaxCoinsForWithdrawal();

    Map<String, String> getAllSettings();
}