package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripeWebhookEvent {

    private String id;

    private String type;

    private Map<String, Object> data;

    private Long created;

    private Boolean livemode;

    private String apiVersion;
}