package com.golfcomp.api.dto.request;

import com.golfcomp.api.model.PayoutType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatePayoutRequest(
    @NotNull UUID playerId,
    @NotNull PayoutType type,
    @NotNull @DecimalMin("0.00") BigDecimal amount,
    @Size(max = 200) String note
) {}
