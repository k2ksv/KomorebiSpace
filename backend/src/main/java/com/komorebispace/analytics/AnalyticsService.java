package com.komorebispace.analytics;

import com.komorebispace.auth.User;
import com.komorebispace.timer.StudyLog;
import com.komorebispace.timer.StudyLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final StudyLogRepository studyLogRepository;

    public AnalyticsService(StudyLogRepository studyLogRepository) {
        this.studyLogRepository = studyLogRepository;
    }

    public AnalyticsResponse getUserAnalytics(User user, int daysLimit) {
        LocalDateTime startDateTime = LocalDateTime.now().minusDays(daysLimit).with(LocalTime.MIN);
        LocalDateTime endDateTime = LocalDateTime.now().with(LocalTime.MAX);

        List<StudyLog> logs = studyLogRepository.findByUserAndStartedAtBetween(user, startDateTime, endDateTime);

        // Fetch lightweight timestamps for streak calculation to avoid loading all entity objects into memory
        List<LocalDateTime> startedAtTimestamps = studyLogRepository.findStartedAtByUser(user);

        long totalDurationSeconds = logs.stream().mapToLong(StudyLog::getDurationSeconds).sum();
        long totalSessions = logs.size();
        double averageDuration = totalSessions > 0 ? (double) totalDurationSeconds / totalSessions : 0;

        // Daily trend
        Map<LocalDate, Long> dailyMap = logs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getStartedAt().toLocalDate(),
                        Collectors.summingLong(StudyLog::getDurationSeconds)
                ));

        List<DailyFocusDto> dailyTrend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = daysLimit - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            long seconds = dailyMap.getOrDefault(date, 0L);
            dailyTrend.add(new DailyFocusDto(date.format(formatter), seconds));
        }

        // Category distribution
        Map<String, Long> categoryMap = logs.stream()
                .collect(Collectors.groupingBy(
                        StudyLog::getCategory,
                        Collectors.summingLong(StudyLog::getDurationSeconds)
                ));

        List<CategoryFocusDto> categoryDistribution = categoryMap.entrySet().stream()
                .map(entry -> new CategoryFocusDto(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // Streak calculation
        int currentStreak = calculateStreak(startedAtTimestamps);

        return new AnalyticsResponse(
                totalDurationSeconds,
                totalSessions,
                averageDuration,
                currentStreak,
                dailyTrend,
                categoryDistribution
        );
    }

    private int calculateStreak(List<LocalDateTime> timestamps) {
        if (timestamps == null || timestamps.isEmpty()) {
            return 0;
        }

        Set<LocalDate> uniqueDates = timestamps.stream()
                .map(LocalDateTime::toLocalDate)
                .collect(Collectors.toCollection(TreeSet::new)); // Ascending order

        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        if (!uniqueDates.contains(today) && !uniqueDates.contains(yesterday)) {
            return 0;
        }

        int streak = 0;
        LocalDate checkDate = uniqueDates.contains(today) ? today : yesterday;

        while (uniqueDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return streak;
    }
}
