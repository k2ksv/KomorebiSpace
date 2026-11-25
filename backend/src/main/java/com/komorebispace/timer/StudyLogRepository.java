package com.komorebispace.timer;

import com.komorebispace.auth.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {

    List<StudyLog> findByUserOrderByStartedAtDesc(User user);

    Page<StudyLog> findByUserOrderByStartedAtDesc(User user, Pageable pageable);

    List<StudyLog> findByUserAndStartedAtBetween(User user, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.durationSeconds), 0) FROM StudyLog s WHERE s.user = :user AND s.startedAt >= :start AND s.startedAt <= :end")
    Long sumDurationSecondsForUserBetween(
            @Param("user") User user,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT s.startedAt FROM StudyLog s WHERE s.user = :user ORDER BY s.startedAt DESC")
    List<LocalDateTime> findStartedAtByUser(@Param("user") User user);
}
