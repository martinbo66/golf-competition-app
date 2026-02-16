package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Team;

import java.time.LocalDateTime;
import java.util.UUID;

public record TeamResponse(
    UUID id,
    UUID competitionId,
    String name,
    String logoUrl,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static TeamResponse from(Team team) {
        return new TeamResponse(
            team.getId(),
            team.getCompetition().getId(),
            team.getName(),
            team.getLogoUrl(),
            team.getCreatedAt(),
            team.getUpdatedAt()
        );
    }
}
