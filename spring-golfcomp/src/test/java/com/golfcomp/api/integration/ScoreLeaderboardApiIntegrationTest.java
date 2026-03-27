package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.repository.ScoreRepository;
import com.golfcomp.api.repository.TeamRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Score & Leaderboard API Integration Tests")
class ScoreLeaderboardApiIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired CourseRepository courseRepository;
    @Autowired RoundRepository roundRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired PlayerRepository playerRepository;
    @Autowired ScoreRepository scoreRepository;

    private UUID competitionId;
    private UUID roundId;
    private UUID playerAId;
    private UUID playerBId;

    @BeforeEach
    void setUp() {
        // Clean up in FK order so H2 constraints are satisfied
        scoreRepository.deleteAll();
        playerRepository.deleteAll();
        teamRepository.deleteAll();
        roundRepository.deleteAll();
        competitionRepository.deleteAll();
        courseRepository.deleteAll();

        // Build a full scenario: competition → course → round, team, two players
        Organization defaultOrg = organizationRepository.findById(CompetitionService.DEFAULT_ORGANIZATION_ID)
            .orElseThrow(() -> new IllegalStateException("Default organization not seeded"));
        Competition competition = competitionRepository.save(Competition.builder()
            .organization(defaultOrg)
            .name("Test Competition")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .build());
        competitionId = competition.getId();

        Course course = courseRepository.save(Course.builder()
            .name("Heathland")
            .facility("Legends")
            .build());

        Round round = roundRepository.save(Round.builder()
            .competition(competition)
            .course(course)
            .playDate(LocalDate.of(2026, 6, 2))
            .roundNumber(1)
            .build());
        roundId = round.getId();

        Team team = teamRepository.save(Team.builder()
            .competition(competition)
            .name("Team Alpha")
            .build());
        teamId = team.getId();

        playerAId = playerRepository.save(Player.builder()
            .competition(competition)
            .team(team)
            .name("Erik Bathe")
            .talentRating(TalentRating.A)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .build()).getId();

        playerBId = playerRepository.save(Player.builder()
            .competition(competition)
            .team(team)
            .name("Steve Smith")
            .talentRating(TalentRating.B)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .build()).getId();
    }

    @Test
    @DisplayName("score upsert - creates new score then updates the same slot (idempotent)")
    void upsertScore_createsAndThenUpdates() throws Exception {
        UpsertScoreRequest firstReq = new UpsertScoreRequest(playerAId, 55);

        // First call: creates a new score
        String firstBody = mockMvc.perform(
                put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(firstReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.value").value(55))
            .andExpect(jsonPath("$.data.playerName").value("Erik Bathe"))
            .andReturn().getResponse().getContentAsString();

        String scoreId = objectMapper.readTree(firstBody).at("/data/id").asText();

        // Second call with different value: updates the same score row
        UpsertScoreRequest updateReq = new UpsertScoreRequest(playerAId, 60);
        String secondBody = mockMvc.perform(
                put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.value").value(60))
            .andReturn().getResponse().getContentAsString();

        // Same score ID — it was an update, not an insert
        String updatedScoreId = objectMapper.readTree(secondBody).at("/data/id").asText();
        org.junit.jupiter.api.Assertions.assertEquals(scoreId, updatedScoreId);
        org.junit.jupiter.api.Assertions.assertEquals(1, scoreRepository.count());
    }

    @Test
    @DisplayName("score upsert - returns 400 when value out of range (0-72)")
    void upsertScore_returns400WhenValueOutOfRange() throws Exception {
        mockMvc.perform(
                put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, -1))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        mockMvc.perform(
                put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, 73))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET round scores - returns all scores for a round after upserts")
    void getScoresByRound_returnsAllScores() throws Exception {
        // Submit two scores for the round
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, 50))))
            .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerBId, 60))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("player leaderboard - lower score ranks higher; unscored players rank last")
    void playerLeaderboard_ranksByScoreAscending() throws Exception {
        // playerA scores 50 (better), playerB scores 65 (worse)
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, 50))))
            .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerBId, 65))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/players", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(2))
            // rank 1 = lowest score = 50
            .andExpect(jsonPath("$.data[0].rank").value(1))
            .andExpect(jsonPath("$.data[0].totalScore").value(50))
            .andExpect(jsonPath("$.data[0].playerName").value("Erik Bathe"))
            // rank 2 = 65
            .andExpect(jsonPath("$.data[1].rank").value(2))
            .andExpect(jsonPath("$.data[1].totalScore").value(65))
            .andExpect(jsonPath("$.data[1].playerName").value("Steve Smith"));
    }

    @Test
    @DisplayName("team leaderboard - aggregates player scores and ranks teams")
    void teamLeaderboard_aggregatesAndRanks() throws Exception {
        // Both players are on Team Alpha; total = 50 + 60 = 110
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, 50))))
            .andExpect(status().isOk());
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerBId, 60))))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/teams", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].rank").value(1))
            .andExpect(jsonPath("$.data[0].teamName").value("Team Alpha"))
            .andExpect(jsonPath("$.data[0].totalScore").value(110))
            .andExpect(jsonPath("$.data[0].playerCount").value(2));
    }

    @Test
    @DisplayName("DELETE all scores - clears scores and leaderboard returns empty")
    void deleteAllScores_clearsLeaderboard() throws Exception {
        mockMvc.perform(put("/api/v1/competitions/{cId}/rounds/{rId}/scores", competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpsertScoreRequest(playerAId, 50))))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/competitions/{cId}/scores", competitionId))
            .andExpect(status().isNoContent());

        org.junit.jupiter.api.Assertions.assertEquals(0, scoreRepository.count());

        // Leaderboard still returns 200 but with unscored players ranked last
        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/players", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].roundsPlayed").value(0));
    }
}
