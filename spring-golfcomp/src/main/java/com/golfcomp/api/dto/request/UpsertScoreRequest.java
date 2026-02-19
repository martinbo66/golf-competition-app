package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpsertScoreRequest(
    @NotNull UUID playerId,
    @NotNull @Min(0) @Max(72) Integer value
) {}
