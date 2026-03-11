package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request body for auto-generating teams using the snake draft algorithm.
 */
public record GenerateTeamsRequest(
    @Min(value = 2, message = "At least 2 teams required")
    @Max(value = 32, message = "At most 32 teams allowed")
    int numberOfTeams
) {}
