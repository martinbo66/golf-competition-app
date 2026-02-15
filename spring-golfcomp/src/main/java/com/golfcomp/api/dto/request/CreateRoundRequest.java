package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRoundRequest(
    @NotNull UUID courseId,
    @NotNull LocalDate playDate,
    @NotNull @Min(1) Integer roundNumber
) {}
