package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateCourseRequest;
import com.golfcomp.api.dto.request.UpdateCourseRequest;
import com.golfcomp.api.dto.response.CourseResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private CourseService courseService;

    private Course course;
    private UUID courseId;

    @BeforeEach
    void setUp() {
        courseId = UUID.randomUUID();
        course = Course.builder()
            .id(courseId)
            .name("Heathland")
            .facility("Legends")
            .location("Myrtle Beach, SC")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("create - saves course and returns response")
    void create_savesAndReturnsResponse() {
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        CreateCourseRequest request = new CreateCourseRequest("Heathland", "Legends", "Myrtle Beach, SC");

        CourseResponse response = courseService.create(request);

        assertNotNull(response);
        assertEquals("Heathland", response.name());
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    @DisplayName("findAll - returns all courses")
    void findAll_returnsAllCourses() {
        when(courseRepository.findAll()).thenReturn(List.of(course));

        List<CourseResponse> result = courseService.findAll();

        assertEquals(1, result.size());
        assertEquals(courseId, result.get(0).id());
    }

    @Test
    @DisplayName("findById - returns course when found")
    void findById_returnsWhenFound() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.findById(courseId);

        assertEquals(courseId, response.id());
    }

    @Test
    @DisplayName("findById - throws ResourceNotFoundException when not found")
    void findById_throwsWhenNotFound() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> courseService.findById(courseId));
    }

    @Test
    @DisplayName("update - updates course fields")
    void update_updatesFields() {
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenReturn(course);
        UpdateCourseRequest request = new UpdateCourseRequest("Parkland", "Legends", "Myrtle Beach, SC");

        CourseResponse response = courseService.update(courseId, request);

        assertNotNull(response);
        verify(courseRepository).save(course);
    }

    @Test
    @DisplayName("delete - deletes when found")
    void delete_deletesWhenFound() {
        when(courseRepository.existsById(courseId)).thenReturn(true);

        courseService.delete(courseId);

        verify(courseRepository).deleteById(courseId);
    }

    @Test
    @DisplayName("delete - throws when not found")
    void delete_throwsWhenNotFound() {
        when(courseRepository.existsById(courseId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> courseService.delete(courseId));
    }
}
