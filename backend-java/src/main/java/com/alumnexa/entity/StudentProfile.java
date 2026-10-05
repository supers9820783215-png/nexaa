package com.alumnexa.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @Column(length = 64)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(nullable = false)
    private String course;

    @Column(nullable = false)
    private String department;

    @Column(name = "current_year", nullable = false)
    private String currentYear;

    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String interests;

    @Column(name = "career_goal", columnDefinition = "TEXT")
    private String careerGoal;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String linkedin;
    private String github;
    private String portfolio;
    private String resume;
}
