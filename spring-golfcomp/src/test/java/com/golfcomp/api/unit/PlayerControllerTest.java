package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.PlayerController;
import com.golfcomp.api.dto.request.AssignPlayerRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.response.PlayerResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.service.PlayerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PlayerController.class)
@Import(GlobalExceptionHandler.class)
class PlayerControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean PlayerService playerService;

    private final UUID competitionId = UUID.randomUUID();

    private PlayerResponse samplePlayer() {
        return new PlayerResponse(UUID.randomUUID(), competitionId, null, null,
            "Erik Bathe", TalentRating.A, BigDecimal.ZERO, BigDecimal.ZERO,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /players - returns 201 with player")
    void create_returns201() throws Exception {
        when(playerService.create(eq(competitionId), any())).thenReturn(samplePlayer());
        CreatePlayerRequest req = new CreatePlayerRequest("Erik Bathe", TalentRating.A, null, null);

        mockMvc.perform(post("/api/v1/competitions/{id}/players", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Erik Bathe"))
            .andExpect(jsonPath("$.data.talentRating").value("A"));
    }

    @Test
    @DisplayName("POST /players - returns 400 on blank name")
    void create_returns400OnBlankName() throws Exception {
        CreatePlayerRequest req = new CreatePlayerRequest("", TalentRating.A, null, null);

        mockMvc.perform(post("/api/v1/competitions/{id}/players", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /players - returns 200 with list")
    void findAll_returns200() throws Exception {
        when(playerService.findByCompetition(competitionId)).thenReturn(List.of(samplePlayer()));

        mockMvc.perform(get("/api/v1/competitions/{id}/players", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("PUT /players/{id}/assign - returns 200 with updated player")
    void assign_returns200() throws Exception {
        UUID playerId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        PlayerResponse assigned = new PlayerResponse(playerId, competitionId, teamId, "Team A",
            "Erik Bathe", TalentRating.A, BigDecimal.ZERO, BigDecimal.ZERO,
            LocalDateTime.now(), LocalDateTime.now());
        when(playerService.assignToTeam(eq(competitionId), eq(playerId), any())).thenReturn(assigned);
        AssignPlayerRequest req = new AssignPlayerRequest(teamId);

        mockMvc.perform(put("/api/v1/competitions/{cId}/players/{pId}/assign", competitionId, playerId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.teamName").value("Team A"));
    }

    @Test
    @DisplayName("PUT /players/{id}/unassign - returns 200")
    void unassign_returns200() throws Exception {
        UUID playerId = UUID.randomUUID();
        when(playerService.unassignFromTeam(competitionId, playerId)).thenReturn(samplePlayer());

        mockMvc.perform(put("/api/v1/competitions/{cId}/players/{pId}/unassign", competitionId, playerId))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /players/{id} - returns 204")
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/competitions/{cId}/players/{pId}", competitionId, UUID.randomUUID()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /players/{id} - returns 404 when not found")
    void findById_returns404() throws Exception {
        UUID playerId = UUID.randomUUID();
        when(playerService.findById(competitionId, playerId))
            .thenThrow(ResourceNotFoundException.player(playerId));

        mockMvc.perform(get("/api/v1/competitions/{cId}/players/{pId}", competitionId, playerId))
            .andExpect(status().isNotFound());
    }
}
