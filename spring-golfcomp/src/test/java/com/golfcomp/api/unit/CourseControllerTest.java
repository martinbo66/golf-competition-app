package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.CourseController;
import com.golfcomp.api.dto.request.CreateCourseRequest;
import com.golfcomp.api.dto.request.UpdateCourseRequest;
import com.golfcomp.api.dto.response.CourseResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.service.CourseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)
@Import(GlobalExceptionHandler.class)
class CourseControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean CourseService courseService;

    private CourseResponse sampleCourse() {
        return new CourseResponse(UUID.randomUUID(), "Heathland", "Legends", "Myrtle Beach, SC",
            Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("POST /api/v1/courses - returns 201 with course")
    void create_returns201() throws Exception {
        when(courseService.create(any())).thenReturn(sampleCourse());
        CreateCourseRequest req = new CreateCourseRequest("Heathland", "Legends", "Myrtle Beach, SC");

        mockMvc.perform(post("/api/v1/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Heathland"));
    }

    @Test
    @DisplayName("GET /api/v1/courses - returns 200 with list")
    void findAll_returns200() throws Exception {
        when(courseService.findAll()).thenReturn(List.of(sampleCourse()));

        mockMvc.perform(get("/api/v1/courses"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/courses/{id} - returns 404 when not found")
    void findById_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(courseService.findById(id)).thenThrow(ResourceNotFoundException.course(id));

        mockMvc.perform(get("/api/v1/courses/{id}", id))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/v1/courses/{id} - returns 204")
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/courses/{id}", UUID.randomUUID()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/v1/courses/{id} - returns 200 with course")
    void findById_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(courseService.findById(id)).thenReturn(sampleCourse());

        mockMvc.perform(get("/api/v1/courses/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Heathland"));
    }

    @Test
    @DisplayName("PUT /api/v1/courses/{id} - returns 200 with updated course")
    void update_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(courseService.update(eq(id), any())).thenReturn(sampleCourse());
        UpdateCourseRequest req = new UpdateCourseRequest("Updated Name", "Legends", "Myrtle Beach, SC");

        mockMvc.perform(put("/api/v1/courses/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Heathland"));
    }
}
