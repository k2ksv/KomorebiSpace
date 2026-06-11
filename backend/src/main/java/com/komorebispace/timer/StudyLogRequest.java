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
) {}
