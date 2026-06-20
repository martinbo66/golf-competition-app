package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreatePayoutRequest;
import com.golfcomp.api.dto.request.MarkPayoutPaidRequest;
import com.golfcomp.api.dto.request.TeamWinPayoutRequest;
import com.golfcomp.api.dto.request.UpdatePayoutRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.PayoutResponse;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.PayoutService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Payouts")
@RestController
@RequestMapping("/api/v1/organizations/{orgId}/competitions/{competitionId}")
public class OrganizationPayoutController {

    private final CompetitionService competitionService;
    private final PayoutService payoutService;

    public OrganizationPayoutController(CompetitionService competitionService,
                                        PayoutService payoutService) {
        this.competitionService = competitionService;
        this.payoutService = payoutService;
    }

    @GetMapping("/payouts")
    public ResponseEntity<ApiResponse<List<PayoutResponse>>> findByCompetition(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.findByCompetition(competitionId)));
    }

    @GetMapping("/rounds/{roundId}/payouts")
    public ResponseEntity<ApiResponse<List<PayoutResponse>>> findByRound(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID roundId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.findByRound(competitionId, roundId)));
    }

    @PostMapping("/rounds/{roundId}/payouts")
    public ResponseEntity<ApiResponse<PayoutResponse>> create(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID roundId,
            @RequestBody @Valid CreatePayoutRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.create(competitionId, roundId, request)));
    }

    @PostMapping("/rounds/{roundId}/payouts/team-win")
    public ResponseEntity<ApiResponse<List<PayoutResponse>>> recordTeamWin(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID roundId,
            @RequestBody @Valid TeamWinPayoutRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.recordTeamWin(competitionId, roundId, request)));
    }

    @GetMapping("/events/{eventId}/payouts")
    public ResponseEntity<ApiResponse<List<PayoutResponse>>> findByEvent(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID eventId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.findByEvent(competitionId, eventId)));
    }

    @PostMapping("/events/{eventId}/payouts")
    public ResponseEntity<ApiResponse<PayoutResponse>> createForEvent(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID eventId,
            @RequestBody @Valid CreatePayoutRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.createForEvent(competitionId, eventId, request)));
    }

    @PutMapping("/payouts/{payoutId}")
    public ResponseEntity<ApiResponse<PayoutResponse>> update(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID payoutId,
            @RequestBody @Valid UpdatePayoutRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(payoutService.update(competitionId, payoutId, request)));
    }

    @PatchMapping("/payouts/{payoutId}/paid")
    public ResponseEntity<ApiResponse<PayoutResponse>> setPaid(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID payoutId,
            @RequestBody @Valid MarkPayoutPaidRequest request) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        return ResponseEntity.ok(ApiResponse.success(
            payoutService.setPaid(competitionId, payoutId, request.paid())));
    }

    @DeleteMapping("/payouts/{payoutId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID orgId,
            @PathVariable UUID competitionId,
            @PathVariable UUID payoutId) {
        competitionService.verifyOrganizationOwnership(orgId, competitionId);
        payoutService.delete(competitionId, payoutId);
        return ResponseEntity.noContent().build();
    }
}
