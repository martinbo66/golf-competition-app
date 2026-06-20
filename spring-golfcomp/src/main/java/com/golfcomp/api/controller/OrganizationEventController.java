package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateEventRequest;
import com.golfcomp.api.dto.request.UpdateEventRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.EventResponse;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.EventService;
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

@Tag(name = "Events")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}/events")
public class OrganizationEventController {

    private final CompetitionService competitionService;
    private final EventService eventService;

    public OrganizationEventController(CompetitionService competitionService,
                                       EventService eventService) {
        this.competitionService = competitionService;
        this.eventService = eventService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> create(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @RequestBody @Valid CreateEventRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(eventService.create(competitionId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> findAll(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(eventService.findByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> findById(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(eventService.findById(competitionId, id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateEventRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(eventService.update(competitionId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID id) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        eventService.delete(competitionId, id);
        return ResponseEntity.noContent().build();
    }
}
