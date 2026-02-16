package com.golfcomp.api.dto.request;

import com.golfcomp.api.model.TalentRating;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdatePlayerRequest(
    @NotBlank @Size(max = 100) String name,
    @NotNull TalentRating talentRating,
    @DecimalMin("0.00") BigDecimal entryFee,
    @DecimalMin("0.00") BigDecimal winnings
) {}
