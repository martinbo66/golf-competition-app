package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Score;

import java.time.Instant;
import java.util.UUID;

public record ScoreResponse(
    UUID id,
    UUID competitionId,
    UUID roundId,
    UUID playerId,
    String playerName,
    Integer value,
    Instant createdAt,
    Instant updatedAt
) {
    public static ScoreResponse from(Score score) {
        return new ScoreResponse(
            score.getId(),
            score.getCompetition().getId(),
            score.getRound().getId(),
            score.getPlayer().getId(),
            score.getPlayer().getName(),
            score.getValue(),
            score.getCreatedAt(),
            score.getUpdatedAt()
        );
    }
}
