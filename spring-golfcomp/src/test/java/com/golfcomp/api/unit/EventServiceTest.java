package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateEventRequest;
import com.golfcomp.api.dto.request.UpdateEventRequest;
import com.golfcomp.api.dto.response.EventResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Event;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.EventRepository;
import com.golfcomp.api.service.EventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock private EventRepository eventRepository;
    @Mock private CompetitionRepository competitionRepository;

    @InjectMocks
    private EventService eventService;

    private Competition competition;
    private Event event;
    private UUID competitionId;
    private UUID eventId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        event = Event.builder()
            .id(eventId)
            .competition(competition)
            .name("Putting Competition")
            .eventDate(LocalDate.of(2026, 6, 3))
            .note("Worth $20")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("create - saves event under competition")
    void create_savesEvent() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(eventRepository.save(any(Event.class))).thenReturn(event);
        CreateEventRequest request = new CreateEventRequest(
            "Putting Competition", LocalDate.of(2026, 6, 3), "Worth $20");

        EventResponse response = eventService.create(competitionId, request);

        assertNotNull(response);
        assertEquals(competitionId, response.competitionId());
        assertEquals("Putting Competition", response.name());
    }

    @Test
    @DisplayName("create - throws when competition not found")
    void create_throwsWhenCompetitionNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());
        CreateEventRequest request = new CreateEventRequest("Longest Drive", LocalDate.now(), null);

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.create(competitionId, request));
    }

    @Test
    @DisplayName("findByCompetition - returns events ordered by date")
    void findByCompetition_returnsEvents() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(eventRepository.findByCompetitionIdOrderByEventDateAsc(competitionId))
            .thenReturn(List.of(event));

        List<EventResponse> result = eventService.findByCompetition(competitionId);

        assertEquals(1, result.size());
        assertEquals("Putting Competition", result.get(0).name());
    }

    @Test
    @DisplayName("findByCompetition - throws when competition not found")
    void findByCompetition_throwsWhenNotFound() {
        when(competitionRepository.existsById(competitionId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.findByCompetition(competitionId));
    }

    @Test
    @DisplayName("findById - returns event when found in correct competition")
    void findById_returnsEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        EventResponse response = eventService.findById(competitionId, eventId);

        assertNotNull(response);
        assertEquals(eventId, response.id());
    }

    @Test
    @DisplayName("findById - throws when event not found")
    void findById_throwsWhenNotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.findById(competitionId, eventId));
    }

    @Test
    @DisplayName("findById - throws when event belongs to different competition")
    void findById_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.findById(otherId, eventId));
    }

    @Test
    @DisplayName("update - updates name and date when event belongs to competition")
    void update_updatesEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenReturn(event);
        UpdateEventRequest request = new UpdateEventRequest(
            "Longest Drive", LocalDate.of(2026, 6, 4), "Updated");

        EventResponse response = eventService.update(competitionId, eventId, request);

        assertNotNull(response);
        assertEquals("Longest Drive", event.getName());
        assertEquals(LocalDate.of(2026, 6, 4), event.getEventDate());
        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("update - throws when event not found")
    void update_throwsWhenNotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());
        UpdateEventRequest request = new UpdateEventRequest("X", LocalDate.now(), null);

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.update(competitionId, eventId, request));
    }

    @Test
    @DisplayName("update - throws when event belongs to different competition")
    void update_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        UpdateEventRequest request = new UpdateEventRequest("X", LocalDate.now(), null);

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.update(otherId, eventId, request));
    }

    @Test
    @DisplayName("delete - removes event when it belongs to competition")
    void delete_removesEvent() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        eventService.delete(competitionId, eventId);

        verify(eventRepository).delete(event);
    }

    @Test
    @DisplayName("delete - throws when event not found")
    void delete_throwsWhenNotFound() {
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.delete(competitionId, eventId));
    }

    @Test
    @DisplayName("delete - throws when event belongs to different competition")
    void delete_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThrows(ResourceNotFoundException.class,
            () -> eventService.delete(otherId, eventId));
    }
}
