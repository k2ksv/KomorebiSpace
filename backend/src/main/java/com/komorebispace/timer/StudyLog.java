package com.komorebispace.timer;

import com.komorebispace.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_logs")
public class StudyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category;

    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Constructors
    public StudyLog() {}

    public StudyLog(Long id, User user, String category, Integer durationSeconds, LocalDateTime startedAt, LocalDateTime endedAt) {
        this(id, user, category, durationSeconds, startedAt, endedAt, Instant.now());
    }

    public StudyLog(Long id, User user, String category, Integer durationSeconds, LocalDateTime startedAt, LocalDateTime endedAt, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.category = category;
        this.durationSeconds = durationSeconds;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    // Builder
    public static StudyLogBuilder builder() {
        return new StudyLogBuilder();
    }

    public static class StudyLogBuilder {
        private Long id;
        private User user;
        private String category;
        private Integer durationSeconds;
        private LocalDateTime startedAt;
        private LocalDateTime endedAt;
        private Instant createdAt;

        public StudyLogBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public StudyLogBuilder user(User user) {
            this.user = user;
            return this;
        }

        public StudyLogBuilder category(String category) {
            this.category = category;
            return this;
        }

        public StudyLogBuilder durationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
            return this;
        }

        public StudyLogBuilder startedAt(LocalDateTime startedAt) {
            this.startedAt = startedAt;
            return this;
        }

        public StudyLogBuilder endedAt(LocalDateTime endedAt) {
            this.endedAt = endedAt;
            return this;
        }

        public StudyLogBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public StudyLog build() {
            return new StudyLog(id, user, category, durationSeconds, startedAt, endedAt, createdAt);
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
