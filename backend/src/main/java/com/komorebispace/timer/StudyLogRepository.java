package com.komorebispace.timer;

import com.komorebispace.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {
    List<StudyLog> findByUserOrderByStartedAtDesc(User user);
    List<StudyLog> findByUserAndStartedAtBetween(User user, LocalDateTime start, LocalDateTime end);
}
