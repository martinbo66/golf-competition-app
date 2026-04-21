package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record MarkPayoutPaidRequest(
    @NotNull Boolean paid
) {}
