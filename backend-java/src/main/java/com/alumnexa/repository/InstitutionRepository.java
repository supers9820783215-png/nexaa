package com.alumnexa.repository;

import com.alumnexa.entity.Institution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, String> {
    List<Institution> findByNameContainingIgnoreCase(String name);
}
