package com.alumnexa.controller;

import com.alumnexa.dto.ApiResponse;
import com.alumnexa.entity.MentorshipRequest;
import com.alumnexa.service.MentorshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentorship")
@RequiredArgsConstructor
public class MentorshipController {

    private final MentorshipService mentorshipService;

    @GetMapping("/requests/student/{studentId}")
    public ResponseEntity<ApiResponse<List<MentorshipRequest>>> getStudentRequests(@PathVariable String studentId) {
        List<MentorshipRequest> requests = mentorshipService.getStudentRequests(studentId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/requests/alumni/{alumniId}")
    public ResponseEntity<ApiResponse<List<MentorshipRequest>>> getAlumniRequests(@PathVariable String alumniId) {
        List<MentorshipRequest> requests = mentorshipService.getAlumniRequests(alumniId);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<MentorshipRequest>> createRequest(@RequestBody MentorshipRequest request) {
        MentorshipRequest created = mentorshipService.createRequest(request);
        return ResponseEntity.ok(ApiResponse.success("Mentorship request submitted", created));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse<MentorshipRequest>> updateStatus(
            @PathVariable String id,
            @RequestParam String status) {
        MentorshipRequest updated = mentorshipService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("Request updated", updated));
    }
}
