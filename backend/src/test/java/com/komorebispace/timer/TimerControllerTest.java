package com.komorebispace.timer;

import com.komorebispace.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class TimerControllerTest {

    private StudyLogRepository studyLogRepository;
    private TimerController timerController;
    private User testUser;

    @BeforeEach
    void setUp() {
        studyLogRepository = Mockito.mock(StudyLogRepository.class);
        timerController = new TimerController(studyLogRepository);
        testUser = new User(1L, "user@test.com", "testuser", "secret");
    }

    @Test
    void savesValidLog() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusSeconds(300);
        StudyLogRequest request = new StudyLogRequest("DSA", 300, start, now);

        StudyLog savedLog = new StudyLog(10L, testUser, "DSA", 300, start, now);
        when(studyLogRepository.save(any(StudyLog.class))).thenReturn(savedLog);

        ResponseEntity<TimerController.StudyLogDto> response = timerController.saveLog(request, testUser);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("DSA", response.getBody().category());
        assertEquals(300, response.getBody().durationSeconds());
    }

    @Test
    void getLogsReturnsPaginatedResults() {
        LocalDateTime now = LocalDateTime.now();
        StudyLog log1 = new StudyLog(1L, testUser, "DSA", 600, now.minusMinutes(10), now);
        when(studyLogRepository.findByUserOrderByStartedAtDesc(eq(testUser), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(log1)));

        ResponseEntity<List<TimerController.StudyLogDto>> response = timerController.getLogs(4, 0, testUser);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("DSA", response.getBody().get(0).category());
    }

    @Test
    void getTodaySummaryReturnsAggregatedSeconds() {
        when(studyLogRepository.sumDurationSecondsForUserBetween(eq(testUser), any(), any()))
                .thenReturn(7200L);

        ResponseEntity<TimerController.TodaySummaryDto> response = timerController.getTodaySummary(testUser);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(7200L, response.getBody().totalSeconds());
    }
}
