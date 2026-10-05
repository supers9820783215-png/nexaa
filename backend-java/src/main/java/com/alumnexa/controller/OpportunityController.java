package com.alumnexa.controller;

import com.alumnexa.dto.ApiResponse;
import com.alumnexa.entity.Opportunity;
import com.alumnexa.service.OpportunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
public class OpportunityController {

    private final OpportunityService opportunityService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Opportunity>>> getOpportunities(@RequestParam(required = false) String type) {
        List<Opportunity> opportunities = opportunityService.getAllOpportunities(type);
        return ResponseEntity.ok(ApiResponse.success(opportunities));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Opportunity>> getOpportunityById(@PathVariable String id) {
        Opportunity opp = opportunityService.getOpportunityById(id);
        return ResponseEntity.ok(ApiResponse.success(opp));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Opportunity>> createOpportunity(@RequestBody Opportunity opp) {
        Opportunity created = opportunityService.createOpportunity(opp);
        return ResponseEntity.ok(ApiResponse.success("Opportunity posted successfully", created));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOpportunity(@PathVariable String id) {
        opportunityService.deleteOpportunity(id);
        return ResponseEntity.ok(ApiResponse.success("Opportunity deleted successfully", null));
    }
}
