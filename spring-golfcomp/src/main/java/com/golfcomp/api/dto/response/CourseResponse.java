package com.golfcomp.api.dto.response;

import com.golfcomp.api.model.Course;

import java.time.Instant;
import java.util.UUID;

public record CourseResponse(
    UUID id,
    String name,
    String facility,
    String location,
    Instant createdAt,
    Instant updatedAt
) {
    public static CourseResponse from(Course course) {
        return new CourseResponse(
            course.getId(),
            course.getName(),
            course.getFacility(),
            course.getLocation(),
            course.getCreatedAt(),
            course.getUpdatedAt()
        );
    }
}
