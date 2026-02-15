package com.golfcomp.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCourseRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 255) String facility,
    @Size(max = 255) String location
) {}
