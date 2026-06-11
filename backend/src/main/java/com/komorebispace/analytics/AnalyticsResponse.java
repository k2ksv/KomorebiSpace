package com.komorebispace.analytics;

import java.util.List;

public record AnalyticsResponse(
        long totalDurationSeconds,
        long totalSessions,
        double averageSessionDurationSeconds,
        int currentStreak,
        List<DailyFocusDto> dailyTrend,
        List<CategoryFocusDto> categoryDistribution
) {}

record DailyFocusDto(
        String date,
        long durationSeconds
) {}

record CategoryFocusDto(
        String category,
        long durationSeconds
) {}
