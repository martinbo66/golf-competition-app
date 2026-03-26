package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Organization;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrganizationResponse(
    UUID id,
    String name,
    String slug,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrganizationResponse from(Organization org) {
        return new OrganizationResponse(
            org.getId(),
            org.getName(),
            org.getSlug(),
            org.getCreatedAt(),
            org.getUpdatedAt()
        );
    }
}
