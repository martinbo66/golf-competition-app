package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.TeamController;
import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.dto.response.TeamResponse;
import com.golfcomp.api.exception.BusinessRuleException;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.service.TeamService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeamController.class)
@Import(GlobalExceptionHandler.class)
class TeamControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean TeamService teamService;

    private UUID competitionId = UUID.randomUUID();

    private TeamResponse sampleTeam(UUID compId) {
        return new TeamResponse(UUID.randomUUID(), compId, "Bathe's Bombers", null,
            LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    @DisplayName("POST /api/v1/competitions/{id}/teams - returns 201")
    void create_returns201() throws Exception {
        when(teamService.create(eq(competitionId), any())).thenReturn(sampleTeam(competitionId));
        CreateTeamRequest req = new CreateTeamRequest("Bathe's Bombers", null);

        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Bathe's Bombers"));
    }

    @Test
    @DisplayName("POST - returns 409 on duplicate team name")
    void create_returns409OnDuplicate() throws Exception {
        when(teamService.create(eq(competitionId), any()))
            .thenThrow(new BusinessRuleException("DUPLICATE_TEAM_NAME", "Name already exists"));
        CreateTeamRequest req = new CreateTeamRequest("Bathe's Bombers", null);

        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("DUPLICATE_TEAM_NAME"));
    }

    @Test
    @DisplayName("GET /api/v1/competitions/{id}/teams - returns 200 with list")
    void findAll_returns200() throws Exception {
        when(teamService.findByCompetition(competitionId)).thenReturn(List.of(sampleTeam(competitionId)));

        mockMvc.perform(get("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("DELETE /teams/{id} - returns 204")
    void delete_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/competitions/{cId}/teams/{tId}", competitionId, UUID.randomUUID()))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /teams - bulk delete returns 204")
    void deleteAll_returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /teams/{id} - returns 404 when not found")
    void findById_returns404() throws Exception {
        UUID teamId = UUID.randomUUID();
        when(teamService.findById(competitionId, teamId))
            .thenThrow(ResourceNotFoundException.team(teamId));

        mockMvc.perform(get("/api/v1/competitions/{cId}/teams/{tId}", competitionId, teamId))
            .andExpect(status().isNotFound());
    }
}
