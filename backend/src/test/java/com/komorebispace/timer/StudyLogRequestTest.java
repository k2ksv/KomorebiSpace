package com.komorebispace.timer;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class StudyLogRequestTest {

    @Test
    void acceptsMatchingPastTimeRange() {
        LocalDateTime end = LocalDateTime.now().minusMinutes(1);
        LocalDateTime start = end.minusSeconds(300);
        StudyLogRequest request = new StudyLogRequest("DSA", 300, start, end);

        assertTrue(request.hasValidTimeRange());
        assertTrue(request.durationMatchesTimeRange());
    }

    @Test
    void rejectsDurationMismatch() {
        LocalDateTime end = LocalDateTime.now().minusMinutes(1);
        LocalDateTime start = end.minusSeconds(300);
        StudyLogRequest request = new StudyLogRequest("DSA", 200, start, end);

        assertFalse(request.durationMatchesTimeRange());
    }

    @Test
    void rejectsReversedRange() {
        LocalDateTime end = LocalDateTime.now().minusMinutes(1);
        LocalDateTime start = end.plusMinutes(1);
        StudyLogRequest request = new StudyLogRequest("DSA", 60, start, end);

        assertFalse(request.hasValidTimeRange());
        assertFalse(request.durationMatchesTimeRange());
    }
}
