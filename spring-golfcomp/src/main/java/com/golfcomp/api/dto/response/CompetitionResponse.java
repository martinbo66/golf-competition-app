package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Competition;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record CompetitionResponse(
    UUID id,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    String location,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static CompetitionResponse from(Competition competition) {
        return new CompetitionResponse(
            competition.getId(),
            competition.getName(),
            competition.getStartDate(),
            competition.getEndDate(),
            competition.getLocation(),
            competition.getCreatedAt(),
            competition.getUpdatedAt()
        );
    }
}
