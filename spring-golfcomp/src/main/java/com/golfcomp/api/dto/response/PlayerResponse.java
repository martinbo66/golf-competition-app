package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.TalentRating;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PlayerResponse(
    UUID id,
    UUID competitionId,
    UUID teamId,
    String teamName,
    String name,
    String nickname,
    TalentRating talentRating,
    BigDecimal entryFee,
    BigDecimal winnings,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static PlayerResponse from(Player player) {
        return new PlayerResponse(
            player.getId(),
            player.getCompetition().getId(),
            player.getTeam() != null ? player.getTeam().getId() : null,
            player.getTeam() != null ? player.getTeam().getName() : null,
            player.getName(),
            player.getNickname(),
            player.getTalentRating(),
            player.getEntryFee(),
            player.getWinnings(),
            player.getCreatedAt(),
            player.getUpdatedAt()
        );
    }
}
