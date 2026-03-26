package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.request.CreateOrganizationRequest;
import com.golfcomp.api.dto.request.UpdateCompetitionRequest;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Organization Competition API Integration Tests")
class OrganizationCompetitionApiIntegrationTest {

    private static final UUID DEFAULT_ORG_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired OrganizationRepository organizationRepository;

    @BeforeEach
    void cleanDatabase() {
        competitionRepository.deleteAll(); // cascades to rounds, teams, players, scores
        organizationRepository.findAll().stream()
            .filter(org -> !DEFAULT_ORG_ID.equals(org.getId()))
            .forEach(org -> organizationRepository.deleteById(org.getId()));
    }

    // -------------------------------------------------------------------------
    // Helper methods
    // -------------------------------------------------------------------------

    private UUID createOrg(String name, String slug) throws Exception {
        CreateOrganizationRequest req = new CreateOrganizationRequest(name, slug);
        String body = mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    private UUID createCompetition(UUID orgId, String name) throws Exception {
        CreateCompetitionRequest req = new CreateCompetitionRequest(
            name, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5), "Myrtle Beach");
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("full CRUD roundtrip - create, read, update, delete under an organization")
    void fullCrudRoundtrip_underOrganization() throws Exception {
        UUID orgId = createOrg("Roundtrip Golf Club", "roundtrip-golf-club");

        CreateCompetitionRequest createReq = new CreateCompetitionRequest(
            "2026 Roundtrip Classic", LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 5), "Augusta");

        // CREATE - persists to H2
        String body = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("2026 Roundtrip Classic"))
            .andExpect(jsonPath("$.data.location").value("Augusta"))
            .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()))
            .andExpect(jsonPath("$.meta.requestId").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        UUID compId = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // READ - retrieves persisted data
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(compId.toString()))
            .andExpect(jsonPath("$.data.name").value("2026 Roundtrip Classic"))
            .andExpect(jsonPath("$.data.location").value("Augusta"))
            .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()));

        // UPDATE - overwrites fields
        UpdateCompetitionRequest updateReq = new UpdateCompetitionRequest(
            "2026 Roundtrip Updated", LocalDate.of(2026, 7, 2), LocalDate.of(2026, 7, 6), "New Location");
        mockMvc.perform(put("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("2026 Roundtrip Updated"))
            .andExpect(jsonPath("$.data.location").value("New Location"));

        // DELETE - removes from DB
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId))
            .andExpect(status().isNoContent());

        // VERIFY GONE - subsequent GET returns 404
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/competitions - returns only competitions for the given org")
    void findAll_returnsOnlyCompetitionsForOrg() throws Exception {
        UUID orgAId = createOrg("Org Alpha", "org-alpha");
        UUID orgBId = createOrg("Org Beta", "org-beta");

        createCompetition(orgAId, "Alpha Open 2026");
        createCompetition(orgBId, "Beta Open 2026");

        // Org A should have exactly 1 competition (its own)
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions", orgAId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].name").value("Alpha Open 2026"))
            .andExpect(jsonPath("$.data[0].organizationId").value(orgAId.toString()));

        // Org B should have exactly 1 competition (its own)
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions", orgBId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].name").value("Beta Open 2026"))
            .andExpect(jsonPath("$.data[0].organizationId").value(orgBId.toString()));
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/competitions/{id} - 404 when competition belongs to a different org")
    void getById_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgAId = createOrg("Cross Org A", "cross-org-a");
        UUID orgBId = createOrg("Cross Org B", "cross-org-b");

        UUID compId = createCompetition(orgAId, "Org A Competition 2026");

        // Accessing org-a's competition via org-b's URL should return 404
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgBId, compId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("DELETE /organizations/{orgId}/competitions/{id} - 404 when competition belongs to a different org")
    void delete_returns404WhenCompetitionBelongsToDifferentOrg() throws Exception {
        UUID orgAId = createOrg("Delete Isolation A", "delete-isolation-a");
        UUID orgBId = createOrg("Delete Isolation B", "delete-isolation-b");

        UUID compId = createCompetition(orgAId, "Isolation Competition 2026");

        // Deleting org-a's competition via org-b's URL should return 404
        mockMvc.perform(delete("/api/v1/organizations/{orgId}/competitions/{id}", orgBId, compId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));

        // The competition should still exist under org-a
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgAId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(compId.toString()));
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/competitions - 404 when organization does not exist")
    void create_returns404WhenOrgDoesNotExist() throws Exception {
        UUID unknownOrgId = UUID.randomUUID();
        CreateCompetitionRequest req = new CreateCompetitionRequest(
            "Ghost Org Competition", LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 5), "Nowhere");

        mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", unknownOrgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /organizations/{orgId}/competitions - 400 validation error when name is blank")
    void create_returns400WhenNameBlank() throws Exception {
        UUID orgId = createOrg("Validation Test Org", "validation-test-org");

        mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"startDate\":\"2026-06-01\",\"endDate\":\"2026-06-05\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("name")));
    }

    @Test
    @DisplayName("GET /organizations/{orgId}/competitions/{id} - response includes organizationId")
    void responseIncludesOrganizationId() throws Exception {
        UUID orgId = createOrg("OrgId Check Club", "orgid-check-club");
        UUID compId = createCompetition(orgId, "OrgId Check Competition 2026");

        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(compId.toString()))
            .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()));
    }
}
