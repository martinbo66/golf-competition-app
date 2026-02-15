package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.AssignPlayerRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.UpdatePlayerRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.PlayerResponse;
import com.golfcomp.api.service.PlayerService;
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

@RestController
@RequestMapping("/api/v1/competitions/{competitionId}/players")
public class PlayerController {

    private final PlayerService playerService;

    public PlayerController(PlayerService playerService) {
        this.playerService = playerService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlayerResponse>> create(
            @PathVariable UUID competitionId,
            @RequestBody @Valid CreatePlayerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(playerService.create(competitionId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlayerResponse>>> findAll(@PathVariable UUID competitionId) {
        return ResponseEntity.ok(ApiResponse.success(playerService.findByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlayerResponse>> findById(
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(playerService.findById(competitionId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlayerResponse>> update(
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePlayerRequest request) {
        return ResponseEntity.ok(ApiResponse.success(playerService.update(competitionId, id, request)));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<PlayerResponse>> assign(
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid AssignPlayerRequest request) {
        return ResponseEntity.ok(ApiResponse.success(playerService.assignToTeam(competitionId, id, request)));
    }

    @PutMapping("/{id}/unassign")
    public ResponseEntity<ApiResponse<PlayerResponse>> unassign(
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(playerService.unassignFromTeam(competitionId, id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        playerService.delete(competitionId, id);
        return ResponseEntity.noContent().build();
    }
}
