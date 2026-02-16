package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateCourseRequest;
import com.golfcomp.api.dto.request.UpdateCourseRequest;
import com.golfcomp.api.dto.response.CourseResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CourseService {

    private final CourseRepository courseRepository;

    public CourseService(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @Transactional
    public CourseResponse create(CreateCourseRequest request) {
        Course course = Course.builder()
            .name(request.name())
            .facility(request.facility())
            .location(request.location())
            .build();
        return CourseResponse.from(courseRepository.save(course));
    }

    public List<CourseResponse> findAll() {
        return courseRepository.findAll().stream()
            .map(CourseResponse::from)
            .toList();
    }

    public CourseResponse findById(UUID id) {
        return courseRepository.findById(id)
            .map(CourseResponse::from)
            .orElseThrow(() -> ResourceNotFoundException.course(id));
    }

    @Transactional
    public CourseResponse update(UUID id, UpdateCourseRequest request) {
        Course course = courseRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.course(id));
        course.setName(request.name());
        course.setFacility(request.facility());
        course.setLocation(request.location());
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public void delete(UUID id) {
        if (!courseRepository.existsById(id)) {
            throw ResourceNotFoundException.course(id);
        }
        courseRepository.deleteById(id);
    }
}
