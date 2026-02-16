package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.CompetitionController;
import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.response.CompetitionResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CompetitionController.class)
@Import(GlobalExceptionHandler.class)
class CompetitionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean CompetitionService competitionService;

    private CompetitionResponse sampleResponse() {
        UUID id = UUID.randomUUID();
        return new CompetitionResponse(id, "2026 Bathe Golf",
            LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5),
            "Myrtle Beach", LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /api/v1/competitions - returns 201 with competition")
    void create_returns201() throws Exception {
        when(competitionService.create(any())).thenReturn(sampleResponse());
        CreateCompetitionRequest req = new CreateCompetitionRequest(
            "2026 Bathe Golf", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5), null);

        mockMvc.perform(post("/api/v1/competitions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("2026 Bathe Golf"));
    }

    @Test
    @DisplayName("POST /api/v1/competitions - returns 400 on blank name")
    void create_returns400OnBlankName() throws Exception {
        CreateCompetitionRequest req = new CreateCompetitionRequest(
            "", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5), null);

        mockMvc.perform(post("/api/v1/competitions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /api/v1/competitions - returns 200 with list")
    void findAll_returns200() throws Exception {
        when(competitionService.findAll()).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/competitions"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].name").value("2026 Bathe Golf"));
    }

    @Test
    @DisplayName("GET /api/v1/competitions/{id} - returns 404 when not found")
    void findById_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(competitionService.findById(id)).thenThrow(ResourceNotFoundException.competition(id));

        mockMvc.perform(get("/api/v1/competitions/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("DELETE /api/v1/competitions/{id} - returns 204")
    void delete_returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/competitions/{id}", id))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/v1/competitions/{id} - returns 404 when not found")
    void delete_returns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(ResourceNotFoundException.competition(id)).when(competitionService).delete(eq(id));

        mockMvc.perform(delete("/api/v1/competitions/{id}", id))
            .andExpect(status().isNotFound());
    }
}
