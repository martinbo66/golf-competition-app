package com.golfcomp.api.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.controller.OrganizationPayoutController;
import com.golfcomp.api.dto.request.CreatePayoutRequest;
import com.golfcomp.api.dto.request.MarkPayoutPaidRequest;
import com.golfcomp.api.dto.request.TeamWinPayoutRequest;
import com.golfcomp.api.dto.request.UpdatePayoutRequest;
import com.golfcomp.api.dto.response.PayoutResponse;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.PayoutType;
import com.golfcomp.api.service.CompetitionService;
import com.golfcomp.api.service.PayoutService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrganizationPayoutController.class)
@Import(GlobalExceptionHandler.class)
class PayoutControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean CompetitionService competitionService;
    @MockitoBean PayoutService payoutService;

    private final UUID orgId = UUID.randomUUID();
    private final UUID competitionId = UUID.randomUUID();
    private final UUID roundId = UUID.randomUUID();
    private final UUID payoutId = UUID.randomUUID();
    private final UUID playerId = UUID.randomUUID();

    private static final String BASE = "/api/v1/organizations/{orgId}/competitions/{compId}";

    private PayoutResponse samplePayout(PayoutType type, BigDecimal amount) {
        return new PayoutResponse(
            UUID.randomUUID(), competitionId, roundId, playerId,
            "Alice Smith", null, null,
            type, amount, "note",
            false, null,
            Instant.now(), Instant.now());
    }

    // ─── GET /payouts ────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /payouts - returns 200 with competition payout list")
    void findByCompetition_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        when(payoutService.findByCompetition(competitionId))
            .thenReturn(List.of(samplePayout(PayoutType.GREENIE, BigDecimal.valueOf(25))));

        mockMvc.perform(get(BASE + "/payouts", orgId, competitionId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].type").value("GREENIE"));
    }

    // ─── GET /rounds/{roundId}/payouts ───────────────────────────────────────

    @Test
    @DisplayName("GET /rounds/{roundId}/payouts - returns 200 with round payout list")
    void findByRound_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        when(payoutService.findByRound(competitionId, roundId))
            .thenReturn(List.of(samplePayout(PayoutType.TEAM_WIN, BigDecimal.valueOf(40))));

        mockMvc.perform(get(BASE + "/rounds/{roundId}/payouts", orgId, competitionId, roundId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[0].type").value("TEAM_WIN"));
    }

    @Test
    @DisplayName("GET /rounds/{roundId}/payouts - returns 404 when round not found")
    void findByRound_returns404() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        when(payoutService.findByRound(competitionId, roundId))
            .thenThrow(ResourceNotFoundException.round(roundId));

        mockMvc.perform(get(BASE + "/rounds/{roundId}/payouts", orgId, competitionId, roundId))
            .andExpect(status().isNotFound());
    }

    // ─── POST /rounds/{roundId}/payouts ──────────────────────────────────────

    @Test
    @DisplayName("POST /rounds/{roundId}/payouts - returns 200 with created payout")
    void create_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        PayoutResponse created = samplePayout(PayoutType.GREENIE, BigDecimal.valueOf(30));
        when(payoutService.create(eq(competitionId), eq(roundId), any())).thenReturn(created);

        CreatePayoutRequest req = new CreatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.valueOf(30), "Hole 7");

        mockMvc.perform(post(BASE + "/rounds/{roundId}/payouts", orgId, competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.type").value("GREENIE"))
            .andExpect(jsonPath("$.data.amount").value(30));
    }

    @Test
    @DisplayName("POST /rounds/{roundId}/payouts - returns 400 when playerId is null")
    void create_returns400OnMissingPlayerId() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(any(), any());
        String invalidJson = "{\"type\":\"GREENIE\",\"amount\":30}";

        mockMvc.perform(post(BASE + "/rounds/{roundId}/payouts", orgId, competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    // ─── POST /rounds/{roundId}/payouts/team-win ─────────────────────────────

    @Test
    @DisplayName("POST /rounds/{roundId}/payouts/team-win - returns 200 with list of payouts")
    void recordTeamWin_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        UUID teamId = UUID.randomUUID();
        List<PayoutResponse> splits = List.of(
            samplePayout(PayoutType.TEAM_WIN, BigDecimal.valueOf(40)),
            samplePayout(PayoutType.TEAM_WIN, BigDecimal.valueOf(40)));
        when(payoutService.recordTeamWin(eq(competitionId), eq(roundId), any())).thenReturn(splits);

        TeamWinPayoutRequest req = new TeamWinPayoutRequest(teamId, BigDecimal.valueOf(80));

        mockMvc.perform(post(BASE + "/rounds/{roundId}/payouts/team-win", orgId, competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    @DisplayName("POST /rounds/{roundId}/payouts/team-win - returns 400 when teamId is null")
    void recordTeamWin_returns400OnMissingTeamId() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(any(), any());
        String invalidJson = "{\"teamAmount\":80}";

        mockMvc.perform(post(BASE + "/rounds/{roundId}/payouts/team-win", orgId, competitionId, roundId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    // ─── PUT /payouts/{payoutId} ──────────────────────────────────────────────

    @Test
    @DisplayName("PUT /payouts/{payoutId} - returns 200 with updated payout")
    void update_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        PayoutResponse updated = samplePayout(PayoutType.TEAM_WIN, BigDecimal.valueOf(50));
        when(payoutService.update(eq(competitionId), eq(payoutId), any())).thenReturn(updated);

        UpdatePayoutRequest req = new UpdatePayoutRequest(
            playerId, PayoutType.TEAM_WIN, BigDecimal.valueOf(50), null);

        mockMvc.perform(put(BASE + "/payouts/{payoutId}", orgId, competitionId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.type").value("TEAM_WIN"))
            .andExpect(jsonPath("$.data.amount").value(50));
    }

    @Test
    @DisplayName("PUT /payouts/{payoutId} - returns 404 when payout not found")
    void update_returns404() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        when(payoutService.update(eq(competitionId), eq(payoutId), any()))
            .thenThrow(new ResourceNotFoundException("Payout not found with id: " + payoutId));

        UpdatePayoutRequest req = new UpdatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.TEN, null);

        mockMvc.perform(put(BASE + "/payouts/{payoutId}", orgId, competitionId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound());
    }

    // ─── PATCH /payouts/{payoutId}/paid ───────────────────────────────────────

    @Test
    @DisplayName("PATCH /payouts/{payoutId}/paid - returns 200 with updated payout")
    void setPaid_returns200() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        PayoutResponse updated = new PayoutResponse(
            payoutId, competitionId, roundId, playerId,
            "Alice Smith", null, null,
            PayoutType.GREENIE, BigDecimal.valueOf(25), "note",
            true, Instant.now(),
            Instant.now(), Instant.now());
        when(payoutService.setPaid(eq(competitionId), eq(payoutId), eq(true))).thenReturn(updated);

        MarkPayoutPaidRequest req = new MarkPayoutPaidRequest(true);

        mockMvc.perform(patch(BASE + "/payouts/{payoutId}/paid", orgId, competitionId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.paid").value(true))
            .andExpect(jsonPath("$.data.paidAt").exists());
    }

    @Test
    @DisplayName("PATCH /payouts/{payoutId}/paid - returns 400 when paid field missing")
    void setPaid_returns400OnMissingPaid() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(any(), any());
        String invalidJson = "{}";

        mockMvc.perform(patch(BASE + "/payouts/{payoutId}/paid", orgId, competitionId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /payouts/{payoutId}/paid - returns 404 when payout not found")
    void setPaid_returns404() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        when(payoutService.setPaid(eq(competitionId), eq(payoutId), eq(true)))
            .thenThrow(new ResourceNotFoundException("Payout not found with id: " + payoutId));

        MarkPayoutPaidRequest req = new MarkPayoutPaidRequest(true);

        mockMvc.perform(patch(BASE + "/payouts/{payoutId}/paid", orgId, competitionId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound());
    }

    // ─── DELETE /payouts/{payoutId} ───────────────────────────────────────────

    @Test
    @DisplayName("DELETE /payouts/{payoutId} - returns 204")
    void delete_returns204() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);

        mockMvc.perform(delete(BASE + "/payouts/{payoutId}", orgId, competitionId, payoutId))
            .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /payouts/{payoutId} - returns 404 when payout not found")
    void delete_returns404() throws Exception {
        doNothing().when(competitionService).verifyOrganizationOwnership(orgId, competitionId);
        doThrow(new ResourceNotFoundException("Payout not found with id: " + payoutId))
            .when(payoutService).delete(competitionId, payoutId);

        mockMvc.perform(delete(BASE + "/payouts/{payoutId}", orgId, competitionId, payoutId))
            .andExpect(status().isNotFound());
    }
}
