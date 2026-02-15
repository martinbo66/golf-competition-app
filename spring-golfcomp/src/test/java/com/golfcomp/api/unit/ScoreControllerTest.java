package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.ScoreController;
import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.dto.response.ScoreResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.service.ScoreService;
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

@WebMvcTest(ScoreController.class)
@Import(GlobalExceptionHandler.class)
class ScoreControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean ScoreService scoreService;

    private final UUID competitionId = UUID.randomUUID();
    private final UUID roundId = UUID.randomUUID();

    private ScoreResponse sampleScore() {
        return new ScoreResponse(UUID.randomUUID(), competitionId, roundId, UUID.randomUUID(),
            "Erik Bathe", 85, Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("PUT /rounds/{roundId}/scores - returns 200 with score")
    void upsert_returns200() throws Exception {
        UUID playerId = UUID.randomUUID();
        when(scoreService.upsert(eq(competitionId), eq(roundId), any())).thenReturn(sampleScore());
        UpsertScoreRequest req = new UpsertScoreRequest(playerId, 85);

        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.value").value(85));
    }

    @Test
    @DisplayName("PUT /scores - returns 400 when score out of range")
    void upsert_returns400OnInvalidScore() throws Exception {
        UpsertScoreRequest req = new UpsertScoreRequest(UUID.randomUUID(), 200);

        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /rounds/{roundId}/scores - returns 200 with list")
    void findByRound_returns200() throws Exception {
        when(scoreService.findByRound(competitionId, roundId)).thenReturn(List.of(sampleScore()));

        mockMvc.perform(get("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("DELETE /scores - returns 204")
    void deleteAll_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/competitions/{cId}/scores", competitionId))
            .andExpect(status().isNoContent());
    }
}
