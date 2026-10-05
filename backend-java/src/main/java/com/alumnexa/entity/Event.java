package com.alumnexa.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private String time;

    @Column(nullable = false)
    private String location;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String organizer;

    private Integer capacity = 100;

    @Column(name = "registration_deadline", nullable = false)
    private String registrationDeadline;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
