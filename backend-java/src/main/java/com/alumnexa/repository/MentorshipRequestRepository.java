package com.alumnexa.repository;

import com.alumnexa.entity.MentorshipRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorshipRequestRepository extends JpaRepository<MentorshipRequest, String> {
    List<MentorshipRequest> findByStudentId(String studentId);
    List<MentorshipRequest> findByAlumniId(String alumniId);
}
