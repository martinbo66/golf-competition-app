package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request to record a team-win payout for a round, split evenly among the team's players.
 * The service will create one TEAM_WIN payout per player on the team.
 */
public record TeamWinPayoutRequest(
    @NotNull UUID teamId,
    @NotNull @DecimalMin("0.00") BigDecimal teamAmount
) {}
