package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.AssignPlayerRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Team & Player API Integration Tests")
class TeamPlayerApiIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired OrganizationRepository organizationRepository;

    private UUID competitionId;

    private Organization defaultOrg() {
        return organizationRepository.findById(CompetitionService.DEFAULT_ORGANIZATION_ID)
                .orElseThrow(() -> new IllegalStateException("Default organization not seeded"));
    }

    @BeforeEach
    void setUp() {
        competitionRepository.deleteAll();
        courseRepository.deleteAll();

        // Seed a competition directly — not testing competition creation here
        Competition competition = Competition.builder()
            .organization(defaultOrg())
            .name("Test Competition")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .build();
        competitionId = competitionRepository.save(competition).getId();
    }

    @Test
    @DisplayName("team CRUD - create, list, update, delete with real DB")
    void teamCrudRoundtrip() throws Exception {
        CreateTeamRequest createReq = new CreateTeamRequest("Bathe's Bombers", null);

        // CREATE
        String body = mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.name").value("Bathe's Bombers"))
            .andExpect(jsonPath("$.data.competitionId").value(competitionId.toString()))
            .andReturn().getResponse().getContentAsString();

        UUID teamId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // LIST
        mockMvc.perform(get("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));

        // DELETE
        mockMvc.perform(delete("/api/v1/competitions/{cId}/teams/{tId}", competitionId, teamId))
            .andExpect(status().isNoContent());

        // VERIFY GONE
        mockMvc.perform(get("/api/v1/competitions/{cId}/teams/{tId}", competitionId, teamId))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("team name uniqueness - DB enforces no duplicate names within a competition")
    void createTeam_returns409OnDuplicateName() throws Exception {
        CreateTeamRequest req = new CreateTeamRequest("Bathe's Bombers", null);

        // First creation succeeds
        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated());

        // Duplicate name in same competition returns 409
        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("DUPLICATE_TEAM_NAME"));
    }

    @Test
    @DisplayName("player assign and unassign - persists team membership through real DB")
    void assignAndUnassignPlayer() throws Exception {
        // Create a team
        String teamBody = mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTeamRequest("Team Alpha", null))))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        UUID teamId = UUID.fromString(objectMapper.readTree(teamBody).at("/data/id").asText());

        // Create a player (unassigned)
        String playerBody = mockMvc.perform(post("/api/v1/competitions/{id}/players", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new CreatePlayerRequest("Erik Bathe", null, TalentRating.A, null, null))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.teamId").doesNotExist())
            .andReturn().getResponse().getContentAsString();
        UUID playerId = UUID.fromString(objectMapper.readTree(playerBody).at("/data/id").asText());

        // ASSIGN to team
        mockMvc.perform(put("/api/v1/competitions/{cId}/players/{pId}/assign", competitionId, playerId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AssignPlayerRequest(teamId))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.teamId").value(teamId.toString()))
            .andExpect(jsonPath("$.data.teamName").value("Team Alpha"));

        // Re-fetch to confirm persistence
        mockMvc.perform(get("/api/v1/competitions/{cId}/players/{pId}", competitionId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.teamId").value(teamId.toString()));

        // UNASSIGN
        mockMvc.perform(put("/api/v1/competitions/{cId}/players/{pId}/unassign", competitionId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.teamId").doesNotExist());

        // Re-fetch to confirm unassignment persisted
        mockMvc.perform(get("/api/v1/competitions/{cId}/players/{pId}", competitionId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.teamId").doesNotExist());
    }

    @Test
    @DisplayName("bulk delete all teams - 204 and list returns empty")
    void deleteAllTeams_clearsTeamsList() throws Exception {
        // Create two teams
        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTeamRequest("Team A", null))))
            .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/competitions/{id}/teams", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTeamRequest("Team B", null))))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(jsonPath("$.data.length()").value(2));

        // Bulk delete
        mockMvc.perform(delete("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/competitions/{id}/teams", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("player create - 400 when talentRating is missing")
    void createPlayer_returns400WhenRatingMissing() throws Exception {
        mockMvc.perform(post("/api/v1/competitions/{id}/players", competitionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Erik\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
