package com.alumnexa.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "opportunities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Opportunity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "posted_by", nullable = false, length = 64)
    private String postedBy;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String location;

    @Column(name = "employment_type", nullable = false)
    private String employmentType;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String skills;

    @Column(name = "experience_required", nullable = false)
    private String experienceRequired;

    @Column(nullable = false)
    private String deadline;

    @Column(name = "application_link", nullable = false)
    private String applicationLink;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
