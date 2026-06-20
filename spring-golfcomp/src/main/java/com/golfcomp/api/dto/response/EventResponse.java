package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Event;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EventResponse(
    UUID id,
    UUID competitionId,
    String name,
    LocalDate eventDate,
    String note,
    Instant createdAt,
    Instant updatedAt
) {
    public static EventResponse from(Event event) {
        return new EventResponse(
            event.getId(),
            event.getCompetition().getId(),
            event.getName(),
            event.getEventDate(),
            event.getNote(),
            event.getCreatedAt(),
            event.getUpdatedAt()
        );
    }
}
