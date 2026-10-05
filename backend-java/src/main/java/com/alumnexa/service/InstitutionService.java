package com.alumnexa.service;

import com.alumnexa.entity.Institution;
import com.alumnexa.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;

    public List<Institution> getAllInstitutions() {
        return institutionRepository.findAll();
    }

    public Institution getInstitutionById(String id) {
        return institutionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Institution not found with id: " + id));
    }

    public Institution registerInstitution(Institution inst) {
        return institutionRepository.save(inst);
    }
}
