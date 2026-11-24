package com.komorebispace.analytics;

import com.komorebispace.auth.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // Manual constructor for dependency injection
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @RequestParam(defaultValue = "7") int days,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        if (days < 1 || days > 365) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "days must be between 1 and 365");
        }
        return ResponseEntity.ok(analyticsService.getUserAnalytics(user, days));
    }
}
