package com.app.nomanweb_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Getter
@Slf4j
public class TypesenseConfig {

    @Value("${typesense.host:dlqusyr19k8hmv73p-1.a1.typesense.net}")
    private String host;

    @Value("${typesense.port:443}")
    private int port;

    @Value("${typesense.protocol:https}")
    private String protocol;

    @Value("${typesense.api-key:Vcbj2pB65IOURbr3HNu7Q6rxzeIdiR0E}")
    private String apiKey;

    @Value("${typesense.connection-timeout:5000}")
    private int connectionTimeout;

    @Value("${typesense.read-timeout:5000}")
    private int readTimeout;

    public String getTypesenseUrl() {
        return protocol + "://" + host + ":" + port;
    }

    // Collection names constants
    public static final String STORIES_COLLECTION = "stories";
    public static final String CHAPTERS_COLLECTION = "chapters";
    public static final String USERS_COLLECTION = "users";

    // TODO: Add Typesense client bean once we confirm the correct API structure
    // For now, we'll implement a basic HTTP client approach in SearchServiceImpl
}