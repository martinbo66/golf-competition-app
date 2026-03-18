package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.RoundController;
import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.UpdateRoundRequest;
import com.golfcomp.api.dto.response.CourseResponse;
import com.golfcomp.api.dto.response.RoundResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.service.RoundService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoundController.class)
@Import(GlobalExceptionHandler.class)
class RoundControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean RoundService roundService;

    private final UUID competitionId = UUID.randomUUID();

    private RoundResponse sampleRound() {
        CourseResponse course = new CourseResponse(UUID.randomUUID(), "Heathland", null, null,
            Instant.now(), Instant.now());
        return new RoundResponse(UUID.randomUUID(), competitionId, course,
            LocalDate.of(2026, 6, 2), 1, Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("POST /rounds - returns 201")
    void create_returns201() throws Exception {
        when(roundService.create(eq(competitionId), any())).thenReturn(sampleRound());
        CreateRoundRequest req = new CreateRoundRequest(UUID.randomUUID(), LocalDate.of(2026, 6, 2), 1);

        mockMvc.perform(post("/api/v1/competitions/{id}/rounds", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.roundNumber").value(1));
    }

    @Test
    @DisplayName("GET /rounds - returns 200 with ordered list")
    void findAll_returns200() throws Exception {
        when(roundService.findByCompetition(competitionId)).thenReturn(List.of(sampleRound()));

        mockMvc.perform(get("/api/v1/competitions/{id}/rounds", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /rounds/{id} - returns 404 when round not found")
    void findById_returns404() throws Exception {
        UUID roundId = UUID.randomUUID();
        when(roundService.findById(competitionId, roundId))
            .thenThrow(ResourceNotFoundException.round(roundId));

        mockMvc.perform(get("/api/v1/competitions/{cId}/rounds/{rId}", competitionId, roundId))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /rounds/{id} - returns 200 with updated round")
    void update_returns200() throws Exception {
        UUID roundId = UUID.randomUUID();
        when(roundService.update(eq(competitionId), eq(roundId), any())).thenReturn(sampleRound());
        UpdateRoundRequest req = new UpdateRoundRequest(UUID.randomUUID(), LocalDate.of(2026, 7, 1));

        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.roundNumber").value(1));
    }

    @Test
    @DisplayName("PUT /rounds/{id} - returns 404 when round not found")
    void update_returns404() throws Exception {
        UUID roundId = UUID.randomUUID();
        when(roundService.update(eq(competitionId), eq(roundId), any()))
            .thenThrow(ResourceNotFoundException.round(roundId));
        UpdateRoundRequest req = new UpdateRoundRequest(UUID.randomUUID(), LocalDate.of(2026, 7, 1));

        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /rounds/{id} - returns 204")
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/competitions/{cId}/rounds/{rId}", competitionId, UUID.randomUUID()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /rounds/{id} - returns 200 with round")
    void findById_returns200() throws Exception {
        UUID roundId = UUID.randomUUID();
        when(roundService.findById(competitionId, roundId)).thenReturn(sampleRound());

        mockMvc.perform(get("/api/v1/competitions/{cId}/rounds/{rId}", competitionId, roundId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.roundNumber").value(1));
    }
}
