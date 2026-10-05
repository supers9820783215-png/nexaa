package com.alumnexa.controller;

import com.alumnexa.dto.ApiResponse;
import com.alumnexa.entity.Institution;
import com.alumnexa.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Institution>>> getAllInstitutions() {
        List<Institution> institutions = institutionService.getAllInstitutions();
        return ResponseEntity.ok(ApiResponse.success(institutions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Institution>> getInstitutionById(@PathVariable String id) {
        Institution institution = institutionService.getInstitutionById(id);
        return ResponseEntity.ok(ApiResponse.success(institution));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Institution>> registerInstitution(@RequestBody Institution institution) {
        Institution created = institutionService.registerInstitution(institution);
        return ResponseEntity.ok(ApiResponse.success("Institution registered successfully", created));
    }
}
