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
        Course saved = courseRepository.save(buildCourse("Heathland"));

        assertNotNull(saved.getId());
        Optional<Course> found = courseRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Heathland", found.get().getName());
    }

    @Test
    @DisplayName("Should find course by name")
    void shouldFindByName() {
        courseRepository.save(buildCourse("Parkland"));

        Optional<Course> found = courseRepository.findByName("Parkland");
        assertTrue(found.isPresent());
        assertEquals("Parkland", found.get().getName());
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
