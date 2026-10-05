package com.alumnexa.repository;

import com.alumnexa.entity.Opportunity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpportunityRepository extends JpaRepository<Opportunity, String> {
    List<Opportunity> findByType(String type);
    List<Opportunity> findAllByOrderByCreatedAtDesc();
}
