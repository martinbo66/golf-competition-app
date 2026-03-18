package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.UpdateRoundRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.RoundResponse;
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

@Tag(name = "Rounds", description = "Manage competition rounds")
@RestController
@RequestMapping("/api/v1/competitions/{competitionId}/rounds")
public class RoundController {

    private final RoundService roundService;

    public RoundController(RoundService roundService) {
        this.roundService = roundService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoundResponse>> create(
            @PathVariable UUID competitionId,
            @RequestBody @Valid CreateRoundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(roundService.create(competitionId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoundResponse>>> findAll(@PathVariable UUID competitionId) {
        return ResponseEntity.ok(ApiResponse.success(roundService.findByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> findById(
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(roundService.findById(competitionId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> update(
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateRoundRequest request) {
        return ResponseEntity.ok(ApiResponse.success(roundService.update(competitionId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        roundService.delete(competitionId, id);
        return ResponseEntity.noContent().build();
    }
}
