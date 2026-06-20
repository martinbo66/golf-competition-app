package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Payout;
import com.golfcomp.api.model.PayoutType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PayoutResponse(
    UUID id,
    UUID competitionId,
    UUID roundId,
    UUID eventId,
    String eventName,
    UUID playerId,
    String playerName,
    UUID teamId,
    String teamName,
    PayoutType type,
    BigDecimal amount,
    String note,
    boolean paid,
    Instant paidAt,
    Instant createdAt,
    Instant updatedAt
) {
    public static PayoutResponse from(Payout payout) {
        return new PayoutResponse(
            payout.getId(),
            payout.getCompetition().getId(),
            payout.getRound() != null ? payout.getRound().getId() : null,
            payout.getEvent() != null ? payout.getEvent().getId() : null,
            payout.getEvent() != null ? payout.getEvent().getName() : null,
            payout.getPlayer().getId(),
            payout.getPlayer().getName(),
            payout.getPlayer().getTeam() != null ? payout.getPlayer().getTeam().getId() : null,
            payout.getPlayer().getTeam() != null ? payout.getPlayer().getTeam().getName() : null,
            payout.getType(),
            payout.getAmount(),
            payout.getNote(),
            payout.isPaid(),
            payout.getPaidAt(),
            payout.getCreatedAt(),
            payout.getUpdatedAt()
        );
    }
}
