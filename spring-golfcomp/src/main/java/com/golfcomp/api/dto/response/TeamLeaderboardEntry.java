package com.golfcomp.api.dto.response;

import java.util.List;
import java.util.UUID;

public record TeamLeaderboardEntry(
    int rank,
    UUID teamId,
    String teamName,
    int playerCount,
    int totalScore,
    List<PlayerLeaderboardEntry> players
) {}
