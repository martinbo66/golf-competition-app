package com.golfcomp.api.unit;

import com.golfcomp.api.controller.LeaderboardController;
import com.golfcomp.api.dto.response.PlayerLeaderboardEntry;
import com.golfcomp.api.dto.response.TeamLeaderboardEntry;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.service.LeaderboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LeaderboardController.class)
@Import(GlobalExceptionHandler.class)
class LeaderboardControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean LeaderboardService leaderboardService;

    private final UUID competitionId = UUID.randomUUID();

    @Test
    @DisplayName("GET /leaderboards/players - returns 200 with ranked list")
    void getPlayerLeaderboard_returns200() throws Exception {
        PlayerLeaderboardEntry entry = new PlayerLeaderboardEntry(
            1, UUID.randomUUID(), "Erik Bathe", TalentRating.A, null, null, 2, 160);
        when(leaderboardService.getPlayerLeaderboard(competitionId)).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/players", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].rank").value(1))
            .andExpect(jsonPath("$.data[0].playerName").value("Erik Bathe"))
            .andExpect(jsonPath("$.data[0].totalScore").value(160));
    }

    @Test
    @DisplayName("GET /leaderboards/teams - returns 200 with ranked teams")
    void getTeamLeaderboard_returns200() throws Exception {
        TeamLeaderboardEntry entry = new TeamLeaderboardEntry(
            1, UUID.randomUUID(), "Bathe's Bombers", 4, 320, List.of());
        when(leaderboardService.getTeamLeaderboard(competitionId)).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/teams", competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].teamName").value("Bathe's Bombers"))
            .andExpect(jsonPath("$.data[0].totalScore").value(320));
    }

    @Test
    @DisplayName("GET /leaderboards/players - returns 404 when competition not found")
    void getPlayerLeaderboard_returns404() throws Exception {
        when(leaderboardService.getPlayerLeaderboard(competitionId))
            .thenThrow(ResourceNotFoundException.competition(competitionId));

        mockMvc.perform(get("/api/v1/competitions/{id}/leaderboards/players", competitionId))
            .andExpect(status().isNotFound());
    }
}
