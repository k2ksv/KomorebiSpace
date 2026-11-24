package com.komorebispace.timer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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
        return startedAt != null
                && endedAt != null
                && endedAt.isAfter(startedAt)
                && !endedAt.isAfter(java.time.LocalDateTime.now());
    }

    public boolean durationMatchesTimeRange() {
        if (!hasValidTimeRange()) {
            return false;
        }
        long rangeSeconds = java.time.Duration.between(startedAt, endedAt).getSeconds();
        return rangeSeconds == durationSeconds;
    }
}
