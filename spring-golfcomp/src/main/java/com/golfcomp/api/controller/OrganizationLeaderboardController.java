package com.golfcomp.api.controller;

import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.PlayerLeaderboardEntry;
import com.golfcomp.api.dto.response.TeamLeaderboardEntry;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.LeaderboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Leaderboards")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}/leaderboards")
public class OrganizationLeaderboardController {

    private final CompetitionService competitionService;
    private final LeaderboardService leaderboardService;

    public OrganizationLeaderboardController(CompetitionService competitionService,
                                             LeaderboardService leaderboardService) {
        this.competitionService = competitionService;
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/players")
    public ResponseEntity<ApiResponse<List<PlayerLeaderboardEntry>>> getPlayerLeaderboard(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(leaderboardService.getPlayerLeaderboard(competitionId)));
    }

    @GetMapping("/teams")
    public ResponseEntity<ApiResponse<List<TeamLeaderboardEntry>>> getTeamLeaderboard(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(leaderboardService.getTeamLeaderboard(competitionId)));
    }
}
