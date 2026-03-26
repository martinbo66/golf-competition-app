package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.request.UpdateCompetitionRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.CompetitionResponse;
import com.golfcomp.api.service.CompetitionService;
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

@Tag(name = "Organization Competitions", description = "Manage competitions within an organization")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions")
public class OrganizationCompetitionController {

    private final CompetitionService competitionService;

    public OrganizationCompetitionController(CompetitionService competitionService) {
        this.competitionService = competitionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompetitionResponse>> create(
            @PathVariable UUID orgId,
            @RequestBody @Valid CreateCompetitionRequest request) {
        CompetitionResponse response = competitionService.create(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompetitionResponse>>> findAll(@PathVariable UUID orgId) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.findAll(orgId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompetitionResponse>> findById(
            @PathVariable UUID orgId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.findById(orgId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompetitionResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCompetitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.update(orgId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID id) {
        competitionService.delete(orgId, id);
        return ResponseEntity.noContent().build();
    }
}
