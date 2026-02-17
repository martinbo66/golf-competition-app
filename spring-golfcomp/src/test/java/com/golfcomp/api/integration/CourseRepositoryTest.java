package com.golfcomp.api.integration;

import com.golfcomp.api.model.Course;
import com.golfcomp.api.repository.CourseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("CourseRepository Integration Tests")
class CourseRepositoryTest {

    @Autowired
    private CourseRepository courseRepository;

    private Course buildCourse(String name) {
        return Course.builder()
                .name(name)
                .facility("Legends")
                .location("Myrtle Beach, SC")
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a course by ID")
    void shouldSaveAndFindById() {
        // Use a unique name that won't conflict with seeded courses
        Course saved = courseRepository.save(buildCourse("TestCourseById"));

        assertNotNull(saved.getId());
        Optional<Course> found = courseRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("TestCourseById", found.get().getName());
    }

    @Test
    @DisplayName("Should find course by name")
    void shouldFindByName() {
        // Use a unique name that won't conflict with seeded courses
        courseRepository.save(buildCourse("TestCourse"));

        Optional<Course> found = courseRepository.findByName("TestCourse");
        assertTrue(found.isPresent());
        assertEquals("TestCourse", found.get().getName());
    }

    @Test
    @DisplayName("Should return empty when name not found")
    void shouldReturnEmptyForMissingName() {
        Optional<Course> found = courseRepository.findByName("NonExistentCourse");
        assertFalse(found.isPresent());
    }

    @Test
    @DisplayName("Should return empty when ID not found")
    void shouldReturnEmptyForMissingId() {
        Optional<Course> found = courseRepository.findById(UUID.randomUUID());
        assertFalse(found.isPresent());
    }

    @Test
    @DisplayName("Should auto-set timestamps on persist")
    void shouldAutoSetTimestampsOnPersist() {
        Course saved = courseRepository.save(buildCourse("Timestamp Test"));

        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}
