package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.CoinPackage;
import com.app.nomanweb_backend.service.CoinPackageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coins")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class CoinPackageController {

    private final CoinPackageService coinPackageService;

    // Get active coin packages for public use (buy-coins page)
    @GetMapping("/packages")
    public ResponseEntity<List<Map<String, Object>>> getActivePackages() {
        try {
            log.info("Public request for active coin packages");

            List<CoinPackage> packages = coinPackageService.getActivePackages();
            List<Map<String, Object>> response = packages.stream()
                    .map(this::convertCoinPackageToMap)
                    .collect(Collectors.toList());

            log.info("Returning {} active coin packages", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting active coin packages", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, Object> convertCoinPackageToMap(CoinPackage coinPackage) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", coinPackage.getId().toString());
        map.put("name", coinPackage.getName());
        map.put("coins", coinPackage.getCoinAmount()); // Base coins only
        map.put("bonusCoins", coinPackage.getBonusCoins());
        map.put("totalCoins", coinPackage.getTotalCoins()); // Base + bonus
        map.put("price", coinPackage.getPriceThb().doubleValue()); // THB price
        map.put("currency", "THB");
        map.put("description", coinPackage.getDescription());
        map.put("isActive", coinPackage.getIsActive());
        map.put("createdAt", coinPackage.getCreatedAt());
        return map;
    }
}