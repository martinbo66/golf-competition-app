package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreateEventRequest;
import com.golfcomp.api.dto.request.CreatePayoutRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.model.PayoutType;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.EventRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.repository.PayoutRepository;
import com.golfcomp.api.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Organization Event API Integration Tests")
class OrganizationEventApiIntegrationTest {

    private static final UUID DEFAULT_ORG_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired EventRepository eventRepository;
    @Autowired PayoutRepository payoutRepository;
    @Autowired PlayerRepository playerRepository;

    @BeforeEach
    void cleanDatabase() {
        payoutRepository.deleteAll();
        playerRepository.deleteAll();
        eventRepository.deleteAll();
        competitionRepository.deleteAll();
        organizationRepository.findAll().stream()
            .filter(org -> !DEFAULT_ORG_ID.equals(org.getId()))
            .forEach(org -> organizationRepository.deleteById(org.getId()));
    }

    private UUID createOrg(String name, String slug) throws Exception {
        String body = mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"slug\":\"" + slug + "\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createCompetition(UUID orgId, String name) throws Exception {
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"startDate\":\"2026-06-01\",\"endDate\":\"2026-06-05\",\"location\":\"Myrtle Beach\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createEvent(UUID orgId, UUID compId, String name, String date) throws Exception {
        CreateEventRequest req = new CreateEventRequest(name, LocalDate.parse(date), null);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/events", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createPlayer(UUID orgId, UUID compId, String name) throws Exception {
        CreatePlayerRequest req = new CreatePlayerRequest(name, null, TalentRating.A, null);
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions/{compId}/players", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    @Test
    @DisplayName("events - full CRUD roundtrip under org-scoped competition URL")
    void events_fullCrudUnderOrg() throws Exception {
        UUID orgId = createOrg("Events CRUD Club", "events-crud-club");
        UUID compId = createCompetition(orgId, "Events CRUD Competition 2026");

        CreateEventRequest createReq = new CreateEventRequest(
            "Putting Competition", LocalDate.of(2026, 6, 2), "Worth $20");
        String body = mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/events", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Putting Competition"))
            .andReturn().getResponse().getContentAsString();
        UUID eventId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // GET list → 1 event
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/events", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));

        // UPDATE
        CreateEventRequest updateReq = new CreateEventRequest(
            "Longest Drive", LocalDate.of(2026, 6, 3), null);
        mockMvc.perform(put("/api/v1/organizations/{orgId}/competitions/{compId}/events/{id}",
                orgId, compId, eventId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Longest Drive"));

        // DELETE → 204
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{compId}/events/{id}",
                orgId, compId, eventId))
            .andExpect(status().isNoContent());

        // GET by id after delete → 404
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/events/{id}",
                orgId, compId, eventId))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("events - 404 when competition belongs to a different org")
    void events_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgA = createOrg("Events Org A", "events-org-a");
        UUID orgB = createOrg("Events Org B", "events-org-b");
        UUID compA = createCompetition(orgA, "Events Org A Competition 2026");

        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/events", orgB, compA))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("event payout - awarded to a player and counts toward winnings once paid")
    void eventPayout_countsTowardWinningsWhenPaid() throws Exception {
        UUID orgId = createOrg("Event Payout Club", "event-payout-club");
        UUID compId = createCompetition(orgId, "Event Payout Competition 2026");
        UUID eventId = createEvent(orgId, compId, "Putting Competition", "2026-06-02");
        UUID playerId = createPlayer(orgId, compId, "Alice Smith");

        // POST event payout → linked to event, not a round
        CreatePayoutRequest payoutReq = new CreatePayoutRequest(
            playerId, PayoutType.EVENT, new BigDecimal("20.00"), "1st place");
        String body = mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/events/{eventId}/payouts",
                    orgId, compId, eventId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payoutReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.eventId").value(eventId.toString()))
            .andExpect(jsonPath("$.data.roundId").doesNotExist())
            .andExpect(jsonPath("$.data.type").value("EVENT"))
            .andReturn().getResponse().getContentAsString();
        UUID payoutId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // Unpaid → winnings still 0
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.winnings").value(0));

        // Mark paid
        mockMvc.perform(patch("/api/v1/organizations/{orgId}/competitions/{compId}/payouts/{payoutId}/paid",
                orgId, compId, payoutId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"paid\":true}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.paid").value(true));

        // Winnings now reflect the $20 event prize
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/players/{id}",
                orgId, compId, playerId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.winnings").value(20.00));

        // Event payout appears in the event's payout list
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/events/{eventId}/payouts",
                orgId, compId, eventId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("event payout - deleting the event cascades its payouts and drops winnings")
    void deletingEvent_cascadesPayoutsAndResetsWinnings() throws Exception {
        UUID orgId = createOrg("Event Cascade Club", "event-cascade-club");
        UUID compId = createCompetition(orgId, "Event Cascade Competition 2026");
        UUID eventId = createEvent(orgId, compId, "Putting Competition", "2026-06-02");
        UUID playerId = createPlayer(orgId, compId, "Bob Jones");

        CreatePayoutRequest payoutReq = new CreatePayoutRequest(
            playerId, PayoutType.EVENT, new BigDecimal("15.00"), null);
        mockMvc.perform(
                post("/api/v1/organizations/{orgId}/competitions/{compId}/events/{eventId}/payouts",
                    orgId, compId, eventId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payoutReq)))
            .andExpect(status().isOk());

        // Delete the event → its payouts cascade-delete
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{compId}/events/{id}",
                orgId, compId, eventId))
            .andExpect(status().isNoContent());

        // No payouts remain in the competition
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{compId}/payouts", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(0));
    }
}
