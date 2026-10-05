package com.alumnexa.service;

import com.alumnexa.entity.Opportunity;
import com.alumnexa.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OpportunityService {

    private final OpportunityRepository opportunityRepository;

    public List<Opportunity> getAllOpportunities(String type) {
        if (type != null && !type.trim().isEmpty()) {
            return opportunityRepository.findByType(type.toUpperCase());
        }
        return opportunityRepository.findAllByOrderByCreatedAtDesc();
    }

    public Opportunity getOpportunityById(String id) {
        return opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Opportunity not found with id: " + id));
    }

    public Opportunity createOpportunity(Opportunity opp) {
        if (opp.getId() == null || opp.getId().trim().isEmpty()) {
            opp.setId("opp-" + UUID.randomUUID().toString().substring(0, 8));
        }
        opp.setCreatedAt(LocalDateTime.now());
        return opportunityRepository.save(opp);
    }

    public void deleteOpportunity(String id) {
        opportunityRepository.deleteById(id);
    }
}
