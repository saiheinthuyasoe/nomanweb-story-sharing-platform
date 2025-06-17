package com.app.nomanweb_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;

@Configuration
@Getter
public class TypesenseConfig {

    @Value("${typesense.host:localhost}")
    private String host;

    @Value("${typesense.port:8108}")
    private int port;

    @Value("${typesense.protocol:http}")
    private String protocol;

    @Value("${typesense.api-key:your-typesense-api-key}")
    private String apiKey;

    @Value("${typesense.connection-timeout:5000}")
    private int connectionTimeout;

    @Value("${typesense.read-timeout:5000}")
    private int readTimeout;

    // TODO: Implement Typesense client bean once correct dependency is available
    // The Typesense Java client API may vary depending on the version
    // This configuration provides the necessary properties for manual client setup

    public String getTypesenseUrl() {
        return protocol + "://" + host + ":" + port;
    }
}