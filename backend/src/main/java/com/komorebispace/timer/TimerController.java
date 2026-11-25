package com.komorebispace.timer;

import com.komorebispace.auth.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs")
public class TimerController {

    private final StudyLogRepository studyLogRepository;

    public TimerController(StudyLogRepository studyLogRepository) {
        this.studyLogRepository = studyLogRepository;
    }

    @PostMapping("/save")
    public ResponseEntity<StudyLogDto> saveLog(
            @Valid @RequestBody StudyLogRequest request,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        if (!request.hasValidTimeRange()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end times must form a valid time range");
        }
        if (!request.durationMatchesTimeRange()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duration must match the start and end time range");
        }

        StudyLog studyLog = StudyLog.builder()
                .user(user)
                .category(request.category())
                .durationSeconds(request.durationSeconds())
                .startedAt(request.startedAt())
                .endedAt(request.endedAt())
                .build();

        StudyLog savedLog = studyLogRepository.save(studyLog);

        return ResponseEntity.ok(mapToDto(savedLog));
    }

    @GetMapping
    public ResponseEntity<List<StudyLogDto>> getLogs(
            @RequestParam(required = false, defaultValue = "50") int limit,
            @RequestParam(required = false, defaultValue = "0") int page,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        int pageSize = Math.min(Math.max(limit, 1), 100);
        int pageNumber = Math.max(page, 0);
        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        List<StudyLogDto> dtos = studyLogRepository.findByUserOrderByStartedAtDesc(user, pageable)
                .map(this::mapToDto)
                .getContent();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/today")
    public ResponseEntity<TodaySummaryDto> getTodaySummary(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        Long totalSeconds = studyLogRepository.sumDurationSecondsForUserBetween(user, startOfDay, endOfDay);

        return ResponseEntity.ok(new TodaySummaryDto(totalSeconds != null ? totalSeconds : 0L));
    }

    private StudyLogDto mapToDto(StudyLog log) {
        return new StudyLogDto(
                log.getId(),
                log.getCategory(),
                log.getDurationSeconds(),
                log.getStartedAt(),
                log.getEndedAt()
        );
    }

    public record StudyLogDto(
            Long id,
            String category,
            Integer durationSeconds,
            LocalDateTime startedAt,
            LocalDateTime endedAt
    ) {}

    public record TodaySummaryDto(long totalSeconds) {}
}
