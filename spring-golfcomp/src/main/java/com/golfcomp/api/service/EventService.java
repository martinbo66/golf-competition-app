package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateEventRequest;
import com.golfcomp.api.dto.request.UpdateEventRequest;
import com.golfcomp.api.dto.response.EventResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Event;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final CompetitionRepository competitionRepository;

    public EventService(EventRepository eventRepository,
                        CompetitionRepository competitionRepository) {
        this.eventRepository = eventRepository;
        this.competitionRepository = competitionRepository;
    }

    @Transactional
    public EventResponse create(UUID competitionId, CreateEventRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> ResourceNotFoundException.competition(competitionId));
        Event event = Event.builder()
            .competition(competition)
            .name(request.name())
            .eventDate(request.eventDate())
            .note(request.note())
            .build();
        return EventResponse.from(eventRepository.save(event));
    }

    public List<EventResponse> findByCompetition(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        return eventRepository.findByCompetitionIdOrderByEventDateAsc(competitionId).stream()
            .map(EventResponse::from)
            .toList();
    }

    public EventResponse findById(UUID competitionId, UUID eventId) {
        return EventResponse.from(loadEventInCompetition(competitionId, eventId));
    }

    @Transactional
    public EventResponse update(UUID competitionId, UUID eventId, UpdateEventRequest request) {
        Event event = loadEventInCompetition(competitionId, eventId);
        event.setName(request.name());
        event.setEventDate(request.eventDate());
        event.setNote(request.note());
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public void delete(UUID competitionId, UUID eventId) {
        Event event = loadEventInCompetition(competitionId, eventId);
        eventRepository.delete(event);
    }

    private Event loadEventInCompetition(UUID competitionId, UUID eventId) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> ResourceNotFoundException.event(eventId));
        if (!event.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.event(eventId);
        }
        return event;
    }
}
