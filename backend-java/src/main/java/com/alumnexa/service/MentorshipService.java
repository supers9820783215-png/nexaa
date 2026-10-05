package com.alumnexa.service;

import com.alumnexa.entity.MentorshipRequest;
import com.alumnexa.repository.MentorshipRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorshipService {

    private final MentorshipRequestRepository mentorshipRequestRepository;

    public List<MentorshipRequest> getStudentRequests(String studentId) {
        return mentorshipRequestRepository.findByStudentId(studentId);
    }

    public List<MentorshipRequest> getAlumniRequests(String alumniId) {
        return mentorshipRequestRepository.findByAlumniId(alumniId);
    }

    public MentorshipRequest createRequest(MentorshipRequest request) {
        if (request.getId() == null || request.getId().trim().isEmpty()) {
            request.setId("mnt-" + UUID.randomUUID().toString().substring(0, 8));
        }
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        return mentorshipRequestRepository.save(request);
    }

    public MentorshipRequest updateStatus(String requestId, String status) {
        MentorshipRequest req = mentorshipRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Mentorship request not found: " + requestId));
        req.setStatus(status);
        req.setUpdatedAt(LocalDateTime.now());
        return mentorshipRequestRepository.save(req);
    }
}
