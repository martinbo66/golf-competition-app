package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.dto.request.GenerateTeamsRequest;
import com.golfcomp.api.dto.request.UpdateTeamRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.TeamResponse;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.TeamService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Teams")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}/teams")
public class OrganizationTeamController {

    private final CompetitionService competitionService;
    private final TeamService teamService;

    public OrganizationTeamController(CompetitionService competitionService,
                                      TeamService teamService) {
        this.competitionService = competitionService;
        this.teamService = teamService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TeamResponse>> create(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @RequestBody @Valid CreateTeamRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(teamService.create(competitionId, request)));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> generate(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @RequestBody @Valid GenerateTeamsRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(teamService.generateTeams(competitionId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> findAll(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(teamService.findByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamResponse>> findById(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(teamService.findById(competitionId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeamResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateTeamRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(teamService.update(competitionId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        teamService.delete(competitionId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        teamService.deleteAll(competitionId);
        return ResponseEntity.noContent().build();
    }
}
