package com.alumnexa.controller;

import com.alumnexa.dto.ApiResponse;
import com.alumnexa.dto.AuthDto;
import com.alumnexa.entity.User;
import com.alumnexa.repository.UserRepository;
import com.alumnexa.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminStats(@RequestParam(required = false) String institutionId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalStudents", userRepository.countByRole("STUDENT"));
        stats.put("totalAlumni", userRepository.countByRole("ALUMNI"));
        stats.put("totalFaculty", userRepository.countByRole("FACULTY"));
        stats.put("pendingVerifications", userRepository.findByVerificationStatus("PENDING").size());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/verifications")
    public ResponseEntity<ApiResponse<List<AuthDto.UserResponse>>> getPendingVerifications(
            @RequestParam(defaultValue = "PENDING") String status) {
        List<User> users = userRepository.findByVerificationStatus(status);
        List<AuthDto.UserResponse> dtos = users.stream()
                .map(authService::mapToUserResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PatchMapping("/verifications/{userId}")
    public ResponseEntity<ApiResponse<AuthDto.UserResponse>> updateVerificationStatus(
            @PathVariable String userId,
            @RequestParam String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setVerificationStatus(status);
        user.setIsVerified("VERIFIED".equalsIgnoreCase(status));
        user = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Verification status updated", authService.mapToUserResponse(user)));
    }
}
