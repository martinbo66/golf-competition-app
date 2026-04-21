package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.GenerateTeamsRequest;
import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.repository.ScoreRepository;
import com.golfcomp.api.repository.TeamRepository;
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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Multi-Tenant End-to-End Integration Tests")
class MultiTenantEndToEndTest {

    private static final UUID DEFAULT_ORG_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired RoundRepository roundRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired PlayerRepository playerRepository;
    @Autowired ScoreRepository scoreRepository;

    @BeforeEach
    void cleanDatabase() {
        // Clean in FK order to satisfy constraints
        scoreRepository.deleteAll();
        playerRepository.deleteAll();
        teamRepository.deleteAll();
        roundRepository.deleteAll();
        competitionRepository.deleteAll();
        // Remove non-default orgs
        organizationRepository.findAll().stream()
            .filter(org -> !DEFAULT_ORG_ID.equals(org.getId()))
            .forEach(org -> organizationRepository.deleteById(org.getId()));
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private UUID createOrg(String name, String slug) throws Exception {
        String body = mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"slug\":\"" + slug + "\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createCompetition(UUID orgId, String name) throws Exception {
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"startDate\":\"2026-06-01\",\"endDate\":\"2026-06-05\",\"location\":\"Myrtle Beach\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID getCourseId() {
        return courseRepository.findAll().stream()
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("No courses seeded in test DB"))
            .getId();
    }

    private UUID createPlayer(UUID orgId, UUID compId, String name, TalentRating rating) throws Exception {
        CreatePlayerRequest req = new CreatePlayerRequest(name, null, rating, null);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createRound(UUID orgId, UUID compId, UUID courseId, String playDate, int roundNumber) throws Exception {
        CreateRoundRequest req = new CreateRoundRequest(courseId, LocalDate.parse(playDate), roundNumber);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("fullWorkflow_createOrgCompetitionPlayersTeamsScoresLeaderboards")
    void fullWorkflow_createOrgCompetitionPlayersTeamsScoresLeaderboards() throws Exception {
        // 1. Create org
        UUID orgId = createOrg("E2E Golf Club", "e2e-golf-club");

        // 2. Create competition
        UUID compId = createCompetition(orgId, "E2E Championship 2026");

        // 3. Add 4 players with talent ratings A, B, C, D
        UUID playerA = createPlayer(orgId, compId, "Alice A-Rating", TalentRating.A);
        UUID playerB = createPlayer(orgId, compId, "Bob B-Rating", TalentRating.B);
        UUID playerC = createPlayer(orgId, compId, "Carol C-Rating", TalentRating.C);
        UUID playerD = createPlayer(orgId, compId, "Dave D-Rating", TalentRating.D);

        // 4. Generate 2 teams → assert 201 and 2 teams returned
        GenerateTeamsRequest genReq = new GenerateTeamsRequest(2);
        mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/teams/generate", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(genReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.length()").value(2));

        // 5. Get a seeded course ID
        UUID courseId = getCourseId();

        // 6. Create a round
        UUID roundId = createRound(orgId, compId, courseId, "2026-06-02", 1);

        // 7. Enter scores for each of the 4 players
        for (UUID playerId : new UUID[]{playerA, playerB, playerC, playerD}) {
            UpsertScoreRequest scoreReq = new UpsertScoreRequest(playerId, 72);
            mockMvc.perform(put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                        orgId, compId, roundId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(scoreReq)))
                .andExpect(status().isOk());
        }

        // 8. GET player leaderboard → assert non-empty list
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/players",
                    orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThan(0)));

        // 9. GET team leaderboard → assert non-empty list
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/teams",
                    orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    @DisplayName("tenantIsolation_competitionsPrivateToOrg")
    void tenantIsolation_competitionsPrivateToOrg() throws Exception {
        // 1. Create org-a and org-b
        UUID orgAId = createOrg("Isolation Org A", "isolation-org-a");
        UUID orgBId = createOrg("Isolation Org B", "isolation-org-b");

        // 2. Create competition under org-a
        createCompetition(orgAId, "Org A Championship 2026");

        // 3. GET org-b competitions → assert empty list
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions", orgBId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));

        // 4. GET org-a competitions → assert list has 1 competition
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions", orgAId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("tenantIsolation_cascadeDeleteCleansAllData")
    void tenantIsolation_cascadeDeleteCleansAllData() throws Exception {
        long competitionCountBefore = competitionRepository.count();

        // 1. Create org → competition → player → round → score
        UUID orgId = createOrg("Cascade Delete Org", "cascade-delete-org");
        UUID compId = createCompetition(orgId, "Cascade Competition 2026");
        UUID playerId = createPlayer(orgId, compId, "Eve Eagle", TalentRating.A);
        UUID courseId = getCourseId();
        UUID roundId = createRound(orgId, compId, courseId, "2026-06-03", 1);

        UpsertScoreRequest scoreReq = new UpsertScoreRequest(playerId, 72);
        mockMvc.perform(put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgId, compId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreReq)))
            .andExpect(status().isOk());

        long competitionCountDuring = competitionRepository.count();
        assertTrue(competitionCountDuring > competitionCountBefore,
            "Competition count should have increased after creation");

        // 2. Delete the org
        mockMvc.perform(delete("/api/v1/organizations/{orgId}", orgId))
            .andExpect(status().isNoContent());

        // 3. Assert all competitions for that org are gone
        long competitionCountAfter = competitionRepository.count();
        assertTrue(competitionCountAfter < competitionCountDuring,
            "Competition count should decrease after org deletion (cascade)");
    }
}
