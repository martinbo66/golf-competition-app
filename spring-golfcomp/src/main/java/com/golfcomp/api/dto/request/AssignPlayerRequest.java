package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignPlayerRequest(
    @NotNull UUID teamId
) {}
