package com.alumnexa.service;

import com.alumnexa.entity.Event;
import com.alumnexa.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public List<Event> getAllEvents(String institutionId) {
        if (institutionId != null && !institutionId.trim().isEmpty()) {
            return eventRepository.findByInstitutionId(institutionId);
        }
        return eventRepository.findAllByOrderByCreatedAtDesc();
    }

    public Event getEventById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
    }

    public Event createEvent(Event event) {
        if (event.getId() == null || event.getId().trim().isEmpty()) {
            event.setId("evt-" + UUID.randomUUID().toString().substring(0, 8));
        }
        event.setCreatedAt(LocalDateTime.now());
        return eventRepository.save(event);
    }

    public void deleteEvent(String id) {
        eventRepository.deleteById(id);
    }
}
