package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateEventRequest(
    @NotBlank @Size(max = 255) String name,
    @NotNull LocalDate eventDate,
    @Size(max = 200) String note
) {}
