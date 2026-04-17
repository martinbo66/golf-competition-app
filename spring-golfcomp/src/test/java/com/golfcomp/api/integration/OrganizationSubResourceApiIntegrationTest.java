package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.GenerateTeamsRequest;
import com.golfcomp.api.dto.request.UpdatePlayerRequest;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Organization Sub-Resource API Integration Tests")
class OrganizationSubResourceApiIntegrationTest {

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

    private UUID createRound(UUID orgId, UUID compId, UUID courseId, String playDate, int roundNumber) throws Exception {
        CreateRoundRequest req = new CreateRoundRequest(courseId, LocalDate.parse(playDate), roundNumber);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createPlayer(UUID orgId, UUID compId, String name) throws Exception {
        CreatePlayerRequest req = new CreatePlayerRequest(name, null, TalentRating.A, null, null);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    // -------------------------------------------------------------------------
    // Players
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("players - full CRUD roundtrip under org-scoped competition URL")
    void players_fullCrudUnderOrg() throws Exception {
        UUID orgId = createOrg("Players CRUD Club", "players-crud-club");
        UUID compId = createCompetition(orgId, "Players CRUD Competition 2026");

        CreatePlayerRequest createReq = new CreatePlayerRequest(
            "Alice Fairway", null, TalentRating.B, new BigDecimal("50.00"), BigDecimal.ZERO);

        // CREATE
        String body = mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Alice Fairway"))
            .andReturn().getResponse().getContentAsString();

        UUID playerId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // GET list → 1 player
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));

        // GET by id
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Alice Fairway"));

        // UPDATE name
        UpdatePlayerRequest updateReq = new UpdatePlayerRequest(
            "Alice Updated", null, TalentRating.B, new BigDecimal("50.00"), BigDecimal.ZERO);
        mockMvc.perform(put("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Alice Updated"));

        // DELETE → 204
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId))
            .andExpect(status().isNoContent());

        // GET by id after delete → 404
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("players - 404 when competition belongs to a different org")
    void players_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Players Org A", "players-org-a");
        UUID orgB = createOrg("Players Org B", "players-org-b");
        UUID compA = createCompetition(orgA, "Players Org A Competition 2026");

        CreatePlayerRequest req = new CreatePlayerRequest("Bob Bogey", null, TalentRating.C, null, null);
        mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgB, compA)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // Teams
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("teams - generate teams under org-scoped competition URL")
    void teams_createAndGenerateUnderOrg() throws Exception {
        UUID orgId = createOrg("Teams Generate Club", "teams-generate-club");
        UUID compId = createCompetition(orgId, "Teams Generate Competition 2026");

        // Create 4 players with distinct talent ratings for a balanced draft
        CreatePlayerRequest playerA = new CreatePlayerRequest("Player A", null, TalentRating.A, null, null);
        CreatePlayerRequest playerB = new CreatePlayerRequest("Player B", null, TalentRating.B, null, null);
        CreatePlayerRequest playerC = new CreatePlayerRequest("Player C", null, TalentRating.C, null, null);
        CreatePlayerRequest playerD = new CreatePlayerRequest("Player D", null, TalentRating.D, null, null);

        for (CreatePlayerRequest p : new CreatePlayerRequest[]{playerA, playerB, playerC, playerD}) {
            mockMvc.perform(
                    post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(p)))
                .andExpect(status().isCreated());
        }

        // Generate 2 teams via POST /teams/generate
        GenerateTeamsRequest genReq = new GenerateTeamsRequest(2);
        mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/teams/generate", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(genReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.length()").value(2));

        // GET teams list → 2 teams
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/teams", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("teams - 404 when competition belongs to a different org")
    void teams_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Teams Org A", "teams-org-a");
        UUID orgB = createOrg("Teams Org B", "teams-org-b");
        UUID compA = createCompetition(orgA, "Teams Org A Competition 2026");

        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/teams", orgB, compA))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // Rounds
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("rounds - full CRUD roundtrip under org-scoped competition URL")
    void rounds_fullCrudUnderOrg() throws Exception {
        UUID orgId = createOrg("Rounds CRUD Club", "rounds-crud-club");
        UUID compId = createCompetition(orgId, "Rounds CRUD Competition 2026");
        UUID courseId = getCourseId();

        // CREATE round
        CreateRoundRequest createReq = new CreateRoundRequest(courseId, LocalDate.of(2026, 6, 2), 1);
        String body = mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andReturn().getResponse().getContentAsString();

        UUID roundId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // GET list → 1 round
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));

        // DELETE round → 204
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{id}",
                orgId, compId, roundId))
            .andExpect(status().isNoContent());

        // GET list after delete → 0 rounds
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    @DisplayName("rounds - 404 when competition belongs to a different org")
    void rounds_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Rounds Org A", "rounds-org-a");
        UUID orgB = createOrg("Rounds Org B", "rounds-org-b");
        UUID compA = createCompetition(orgA, "Rounds Org A Competition 2026");

        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/rounds", orgB, compA))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // Scores
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("scores - upsert and read under org-scoped competition URL")
    void scores_upsertAndReadUnderOrg() throws Exception {
        UUID orgId = createOrg("Scores CRUD Club", "scores-crud-club");
        UUID compId = createCompetition(orgId, "Scores CRUD Competition 2026");
        UUID playerId = createPlayer(orgId, compId, "Charlie Chip");
        UUID courseId = getCourseId();
        UUID roundId = createRound(orgId, compId, courseId, "2026-06-02", 1);

        // PUT score → 200
        UpsertScoreRequest scoreReq = new UpsertScoreRequest(playerId, 45);
        mockMvc.perform(
                put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgId, compId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.value").value(45));

        // GET scores for round → 1 score with value 45
        mockMvc.perform(
                get("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgId, compId, roundId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].value").value(45));
    }

    @Test
    @DisplayName("scores - 404 when competition belongs to a different org")
    void scores_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Scores Org A", "scores-org-a");
        UUID orgB = createOrg("Scores Org B", "scores-org-b");
        UUID compA = createCompetition(orgA, "Scores Org A Competition 2026");
        UUID playerId = createPlayer(orgA, compA, "Dan Driver");
        UUID courseId = getCourseId();
        UUID roundId = createRound(orgA, compA, courseId, "2026-06-02", 1);

        // PUT score via wrong org → 404
        UpsertScoreRequest scoreReq = new UpsertScoreRequest(playerId, 50);
        mockMvc.perform(
                put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgB, compA, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(scoreReq)))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------
    // Leaderboards
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("leaderboards - returns results under org-scoped competition URL")
    void leaderboards_returnResultsUnderOrg() throws Exception {
        UUID orgId = createOrg("Leaderboard Club", "leaderboard-club");
        UUID compId = createCompetition(orgId, "Leaderboard Competition 2026");

        UUID playerOne = createPlayer(orgId, compId, "Eve Eagle");
        UUID playerTwo = createPlayer(orgId, compId, "Frank Fairway");

        UUID courseId = getCourseId();
        UUID roundId = createRound(orgId, compId, courseId, "2026-06-03", 1);

        // Submit scores for both players
        mockMvc.perform(
                put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgId, compId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerOne, 48))))
            .andExpect(status().isOk());
        mockMvc.perform(
                put("/api/v1/organizations/{orgId}/competitions/{compId}/rounds/{roundId}/scores",
                    orgId, compId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerTwo, 52))))
            .andExpect(status().isOk());

        // GET player leaderboard → 200, non-empty
        mockMvc.perform(
                get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/players",
                    orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));

        // GET team leaderboard → 200
        mockMvc.perform(
                get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/teams",
                    orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("leaderboards - 404 when competition belongs to a different org")
    void leaderboards_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Leaderboard Org A", "leaderboard-org-a");
        UUID orgB = createOrg("Leaderboard Org B", "leaderboard-org-b");
        UUID compA = createCompetition(orgA, "Leaderboard Org A Competition 2026");

        // GET player leaderboard via wrong org → 404
        mockMvc.perform(
                get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/players",
                    orgB, compA))
            .andExpect(status().isNotFound());

        // GET team leaderboard via wrong org → 404
        mockMvc.perform(
                get("/api/v1/organizations/{orgId}/competitions/{compId}/leaderboards/teams",
                    orgB, compA))
            .andExpect(status().isNotFound());
    }
}
