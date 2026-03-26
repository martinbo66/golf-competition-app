package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Size(max = 100) String slug
) {}
