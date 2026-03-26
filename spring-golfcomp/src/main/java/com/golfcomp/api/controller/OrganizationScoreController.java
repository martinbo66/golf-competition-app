package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.ScoreResponse;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.ScoreService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Scores")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}")
public class OrganizationScoreController {

    private final CompetitionService competitionService;
    private final ScoreService scoreService;

    public OrganizationScoreController(CompetitionService competitionService,
                                       ScoreService scoreService) {
        this.competitionService = competitionService;
        this.scoreService = scoreService;
    }

    @PutMapping("/rounds/{roundId}/scores")
    public ResponseEntity<ApiResponse<ScoreResponse>> upsert(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID roundId,
            @RequestBody @Valid UpsertScoreRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(scoreService.upsert(competitionId, roundId, request)));
    }

    @GetMapping("/rounds/{roundId}/scores")
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> findByRound(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID roundId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(scoreService.findByRound(competitionId, roundId)));
    }

    @DeleteMapping("/scores")
    public ResponseEntity<Void> deleteAll(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        scoreService.deleteAllByCompetition(competitionId);
        return ResponseEntity.noContent().build();
    }
}
