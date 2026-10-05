package com.alumnexa.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alumni_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlumniProfile {

    @Id
    @Column(length = 64)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    @Column(nullable = false)
    private String course;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private String industry;

    @Column(nullable = false)
    private String location;

    private Integer experience = 0;

    @Column(columnDefinition = "TEXT")
    private String skills;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String linkedin;
    private String portfolio;

    @Column(name = "mentoring_available")
    private Boolean mentoringAvailable = true;

    @Column(name = "verification_status", length = 50)
    private String verificationStatus = "PENDING";
}
