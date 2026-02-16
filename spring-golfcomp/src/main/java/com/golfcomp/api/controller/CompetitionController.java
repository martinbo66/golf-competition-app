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

@Tag(name = "Competitions", description = "Manage golf competitions")
@RestController
@RequestMapping("/api/v1/competitions")
public class CompetitionController {

    private final CompetitionService competitionService;

    public CompetitionController(CompetitionService competitionService) {
        this.competitionService = competitionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompetitionResponse>> create(
            @RequestBody @Valid CreateCompetitionRequest request) {
        CompetitionResponse response = competitionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CompetitionResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(competitionService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CompetitionResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CompetitionResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateCompetitionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        competitionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
