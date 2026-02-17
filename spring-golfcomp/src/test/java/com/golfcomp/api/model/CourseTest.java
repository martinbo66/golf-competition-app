package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CourseTest {

    @Test
    @DisplayName("Should create Course using builder")
    void shouldCreateCourseUsingBuilder() {
        Course course = Course.builder()
                .name("Heathland")
                .facility("Legends")
                .location("Myrtle Beach, SC")
                .build();

        assertEquals("Heathland", course.getName());
        assertEquals("Legends", course.getFacility());
        assertEquals("Myrtle Beach, SC", course.getLocation());
        assertNull(course.getId());
    }

    @Test
    @DisplayName("Should set timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Course course = Course.builder().name("Test Course").build();

        course.onCreate();

        assertNotNull(course.getCreatedAt());
        assertNotNull(course.getUpdatedAt());
        assertEquals(course.getCreatedAt(), course.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update timestamp on onUpdate")
    void shouldUpdateTimestampOnUpdate() throws InterruptedException {
        Course course = Course.builder().name("Test Course").build();
        course.onCreate();
        Instant originalCreatedAt = course.getCreatedAt();

        Thread.sleep(10);
        course.onUpdate();

        assertEquals(originalCreatedAt, course.getCreatedAt());
        assertTrue(course.getUpdatedAt().isAfter(originalCreatedAt)
                || course.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Course with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Course course = new Course();
        assertNull(course.getId());
        assertNull(course.getName());
        assertNull(course.getFacility());
        assertNull(course.getLocation());
    }

    @Test
    @DisplayName("Should create Course with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();

        Course course = new Course(id, "Parkland", "Legends", "SC", now, now);

        assertEquals(id, course.getId());
        assertEquals("Parkland", course.getName());
        assertEquals("Legends", course.getFacility());
        assertEquals("SC", course.getLocation());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Course course = new Course();
        course.setName("Updated");
        course.setFacility("New Facility");
        course.setLocation("New Location");

        assertEquals("Updated", course.getName());
        assertEquals("New Facility", course.getFacility());
        assertEquals("New Location", course.getLocation());
    }
}
