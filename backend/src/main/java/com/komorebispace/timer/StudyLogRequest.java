package com.komorebispace.timer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Duration;
import java.time.LocalDateTime;

public record StudyLogRequest(
        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Duration is required")
        @Min(value = 1, message = "Duration must be at least 1 second")
        Integer durationSeconds,

        @NotNull(message = "Start time is required")
        LocalDateTime startedAt,

        @NotNull(message = "End time is required")
        LocalDateTime endedAt
) {
    public boolean hasValidTimeRange() {
        if (startedAt == null || endedAt == null) {
            return false;
        }
        // Allow a 60-second grace window to absorb client-server clock skew / latency
        LocalDateTime maxAllowedEnd = LocalDateTime.now().plusSeconds(60);
        return endedAt.isAfter(startedAt) && !endedAt.isAfter(maxAllowedEnd);
    }

    public boolean durationMatchesTimeRange() {
        if (!hasValidTimeRange()) {
            return false;
        }
        long rangeSeconds = Duration.between(startedAt, endedAt).getSeconds();
        // Allow up to a 2-second tolerance for rounding differences
        return Math.abs(rangeSeconds - durationSeconds) <= 2;
    }
}
