package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Round;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RoundResponse(
    UUID id,
    UUID competitionId,
    CourseResponse course,
    LocalDate playDate,
    Integer roundNumber,
    Instant createdAt,
    Instant updatedAt
) {
    public static RoundResponse from(Round round) {
        return new RoundResponse(
            round.getId(),
            round.getCompetition().getId(),
            CourseResponse.from(round.getCourse()),
            round.getPlayDate(),
            round.getRoundNumber(),
            round.getCreatedAt(),
            round.getUpdatedAt()
        );
    }
}
