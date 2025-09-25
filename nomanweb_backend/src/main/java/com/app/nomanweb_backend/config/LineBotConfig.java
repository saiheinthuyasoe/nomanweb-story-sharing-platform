package com.app.nomanweb_backend.config;

import com.linecorp.bot.client.LineMessagingClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@Slf4j
public class LineBotConfig {

    @Value("${line.bot.channel-token}")
    private String channelToken;

    @Value("${line.bot.channel-secret}")
    private String channelSecret;

    @Bean
    public LineMessagingClient lineMessagingClient() {
        if (!StringUtils.hasText(channelToken)) {
            log.warn("LINE Bot channel token is not configured. LINE messaging will be disabled.");
            return null;
        }

        try {
            LineMessagingClient client = LineMessagingClient.builder(channelToken).build();
            log.info("LINE Bot messaging client initialized successfully");
            return client;
        } catch (Exception e) {
            log.error("Failed to initialize LINE Bot messaging client: {}", e.getMessage(), e);
            return null;
        }
    }
}