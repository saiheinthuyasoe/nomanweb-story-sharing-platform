package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.SystemSetting;
import com.app.nomanweb_backend.repository.SystemSettingRepository;
import com.app.nomanweb_backend.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingServiceImpl implements SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    @Override
    public String getSetting(String key) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(null);
    }

    @Override
    public String getSetting(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    @Override
    @Transactional
    public void setSetting(String key, String value) {
        setSetting(key, value, null);
    }

    @Override
    @Transactional
    public void setSetting(String key, String value, String description) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElse(SystemSetting.builder()
                        .settingKey(key)
                        .build());

        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }

        systemSettingRepository.save(setting);
        log.info("Updated system setting: {} = {}", key, value);
    }

    @Override
    public BigDecimal getPlatformFeePercentage() {
        String feeString = getSetting("platform_fee_percentage", "30.00");
        return new BigDecimal(feeString);
    }

    @Override
    public BigDecimal getGiftRecipientPercentage() {
        String percentageString = getSetting("gift_recipient_percentage", "70.00");
        return new BigDecimal(percentageString);
    }

    @Override
    public BigDecimal getAuthorEarningsPercentage() {
        String percentageString = getSetting("author_earnings_percentage", "70.00");
        return new BigDecimal(percentageString);
    }

    @Override
    public Integer getMinCoinsForWithdrawal() {
        String minString = getSetting("min_withdrawal_coins", "100");
        return Integer.parseInt(minString);
    }

    @Override
    public Integer getMaxCoinsForWithdrawal() {
        String maxString = getSetting("max_withdrawal_coins", "10000");
        return Integer.parseInt(maxString);
    }

    @Override
    public Map<String, String> getAllSettings() {
        return systemSettingRepository.findAll().stream()
                .collect(Collectors.toMap(
                        SystemSetting::getSettingKey,
                        SystemSetting::getSettingValue));
    }
}