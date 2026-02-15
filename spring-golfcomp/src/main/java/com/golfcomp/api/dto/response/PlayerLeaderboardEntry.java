package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.TalentRating;

import java.util.UUID;

public record PlayerLeaderboardEntry(
    int rank,
    UUID playerId,
    String playerName,
    TalentRating talentRating,
    UUID teamId,
    String teamName,
    int roundsPlayed,
    int totalScore
) {}
