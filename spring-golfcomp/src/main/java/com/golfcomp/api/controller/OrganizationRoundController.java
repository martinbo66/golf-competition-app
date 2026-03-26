package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.UpdateRoundRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.RoundResponse;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.RoundService;
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

@Tag(name = "Rounds")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}/rounds")
public class OrganizationRoundController {

    private final CompetitionService competitionService;
    private final RoundService roundService;

    public OrganizationRoundController(CompetitionService competitionService,
                                       RoundService roundService) {
        this.competitionService = competitionService;
        this.roundService = roundService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoundResponse>> create(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @RequestBody @Valid CreateRoundRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(roundService.create(competitionId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoundResponse>>> findAll(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(roundService.findByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> findById(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(roundService.findById(competitionId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateRoundRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(roundService.update(competitionId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        roundService.delete(competitionId, id);
        return ResponseEntity.noContent().build();
    }
}
