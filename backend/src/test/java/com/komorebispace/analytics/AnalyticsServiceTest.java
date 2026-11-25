package com.komorebispace.analytics;

import com.komorebispace.auth.User;
import com.komorebispace.timer.StudyLog;
import com.komorebispace.timer.StudyLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class AnalyticsServiceTest {

    private StudyLogRepository studyLogRepository;
    private AnalyticsService analyticsService;
    private User testUser;

    @BeforeEach
    void setUp() {
        studyLogRepository = Mockito.mock(StudyLogRepository.class);
        analyticsService = new AnalyticsService(studyLogRepository);
        testUser = new User(1L, "user@test.com", "testuser", "secret");
    }

    @Test
    void calculatesAnalyticsAndStreakCorrectly() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yesterday = now.minusDays(1);
        LocalDateTime twoDaysAgo = now.minusDays(2);

        StudyLog logToday = new StudyLog(1L, testUser, "DSA", 3600, now.minusHours(2), now.minusHours(1));
        StudyLog logYesterday = new StudyLog(2L, testUser, "Web Development", 1800, yesterday.minusHours(3), yesterday.minusHours(2));

        when(studyLogRepository.findByUserAndStartedAtBetween(eq(testUser), any(), any()))
                .thenReturn(List.of(logToday, logYesterday));

        when(studyLogRepository.findStartedAtByUser(testUser))
                .thenReturn(List.of(now, yesterday, twoDaysAgo));

        AnalyticsResponse response = analyticsService.getUserAnalytics(testUser, 7);

        assertNotNull(response);
        assertEquals(5400L, response.totalDurationSeconds());
        assertEquals(2, response.totalSessions());
        assertEquals(2700.0, response.averageSessionDurationSeconds());
        assertEquals(3, response.currentStreak());
        assertEquals(2, response.categoryDistribution().size());
        assertEquals(7, response.dailyTrend().size());
    }

    @Test
    void returnsZeroStreakWhenNoRecentLogs() {
        LocalDateTime fiveDaysAgo = LocalDateTime.now().minusDays(5);
        when(studyLogRepository.findByUserAndStartedAtBetween(eq(testUser), any(), any()))
                .thenReturn(List.of());

        when(studyLogRepository.findStartedAtByUser(testUser))
                .thenReturn(List.of(fiveDaysAgo));

        AnalyticsResponse response = analyticsService.getUserAnalytics(testUser, 7);

        assertEquals(0, response.currentStreak());
        assertEquals(0, response.totalDurationSeconds());
        assertEquals(0, response.totalSessions());
    }
}
