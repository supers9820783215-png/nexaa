package com.alumnexa.repository;

import com.alumnexa.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByInstitutionId(String institutionId);
    List<Event> findAllByOrderByCreatedAtDesc();
}
