package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateRoundRequest(
    @NotNull UUID courseId,
    @NotNull LocalDate playDate
) {}
