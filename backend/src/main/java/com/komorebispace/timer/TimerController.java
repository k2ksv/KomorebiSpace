package com.komorebispace.timer;

import com.komorebispace.auth.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/logs")
public class TimerController {

    private final StudyLogRepository studyLogRepository;

    // Manual constructor for dependency injection
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
    public ResponseEntity<List<StudyLogDto>> getLogs(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        List<StudyLog> logs = studyLogRepository.findByUserOrderByStartedAtDesc(user);
        List<StudyLogDto> dtos = logs.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
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
            java.time.LocalDateTime startedAt,
            java.time.LocalDateTime endedAt
    ) {}
}
