package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreateOrganizationRequest;
import com.golfcomp.api.dto.request.UpdateOrganizationRequest;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Organization API Integration Tests")
class OrganizationApiIntegrationTest {

    private static final UUID DEFAULT_ORG_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired OrganizationRepository organizationRepository;
    @Autowired CompetitionRepository competitionRepository;

    @BeforeEach
    void cleanDatabase() {
        // Delete all orgs except the seeded default so its unique constraints don't interfere
        organizationRepository.findAll().stream()
            .filter(org -> !DEFAULT_ORG_ID.equals(org.getId()))
            .forEach(org -> organizationRepository.deleteById(org.getId()));
    }

    @Test
    @DisplayName("full CRUD roundtrip - create, read, update, delete with real DB persistence")
    void fullCrudRoundtrip() throws Exception {
        CreateOrganizationRequest createReq = new CreateOrganizationRequest("Acme Golf Club", "acme-golf-club");

        // CREATE - persists to H2
        String body = mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Acme Golf Club"))
            .andExpect(jsonPath("$.data.slug").value("acme-golf-club"))
            .andExpect(jsonPath("$.meta.requestId").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());

        // READ - retrieves persisted data
        mockMvc.perform(get("/api/v1/organizations/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(id.toString()))
            .andExpect(jsonPath("$.data.name").value("Acme Golf Club"))
            .andExpect(jsonPath("$.data.slug").value("acme-golf-club"));

        // UPDATE - overwrites fields
        UpdateOrganizationRequest updateReq = new UpdateOrganizationRequest("Acme Golf Updated", "acme-golf-updated");
        mockMvc.perform(put("/api/v1/organizations/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Acme Golf Updated"))
            .andExpect(jsonPath("$.data.slug").value("acme-golf-updated"));

        // DELETE - removes from DB
        mockMvc.perform(delete("/api/v1/organizations/{id}", id))
            .andExpect(status().isNoContent());

        // VERIFY GONE - subsequent GET returns 404
        mockMvc.perform(get("/api/v1/organizations/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /organizations - seeded default organization is always present")
    void findAll_returnsDefaultOrganization() throws Exception {
        mockMvc.perform(get("/api/v1/organizations"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data[?(@.name == 'Default' && @.slug == 'default')]").exists());
    }

    @Test
    @DisplayName("POST /organizations - 400 validation error when name is blank")
    void create_returns400WhenNameBlank() throws Exception {
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"slug\":\"some-slug\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("name")));
    }

    @Test
    @DisplayName("POST /organizations - 400 validation error when slug is blank")
    void create_returns400WhenSlugBlank() throws Exception {
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Some Org\",\"slug\":\"\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("slug")));
    }

    @Test
    @DisplayName("POST /organizations - 400 when name already exists")
    void create_returns400WhenNameDuplicate() throws Exception {
        CreateOrganizationRequest first = new CreateOrganizationRequest("River Valley Golf", "river-valley-golf");
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
            .andExpect(status().isCreated());

        CreateOrganizationRequest duplicate = new CreateOrganizationRequest("River Valley Golf", "different-slug");
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("POST /organizations - 400 when slug already exists")
    void create_returns400WhenSlugDuplicate() throws Exception {
        CreateOrganizationRequest first = new CreateOrganizationRequest("Pine Crest Golf", "pine-crest");
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(first)))
            .andExpect(status().isCreated());

        CreateOrganizationRequest duplicate = new CreateOrganizationRequest("Pine Crest II", "pine-crest");
        mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("GET /organizations/{id} - 404 with error envelope for unknown ID")
    void getById_returns404WithErrorEnvelope() throws Exception {
        mockMvc.perform(get("/api/v1/organizations/{id}", UUID.randomUUID()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.meta.timestamp").isNotEmpty())
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("DELETE /organizations/{id} - 400 when attempting to delete the default organization")
    void delete_returns400WhenDeletingDefaultOrganization() throws Exception {
        mockMvc.perform(delete("/api/v1/organizations/{id}", DEFAULT_ORG_ID))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    @DisplayName("DELETE /organizations/{id} - cascades to competitions and sub-data")
    void delete_cascadesToCompetitionsAndSubData() throws Exception {
        // Create a new org
        String orgBody = mockMvc.perform(post("/api/v1/organizations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cascade Test Club\",\"slug\":\"cascade-test-club\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        UUID orgId = UUID.fromString(objectMapper.readTree(orgBody).at("/data/id").asText());

        // Create a competition under that org
        String compBody = mockMvc.perform(post("/api/v1/organizations/{orgId}/competitions", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cascade Competition\",\"startDate\":\"2026-07-01\",\"endDate\":\"2026-07-05\",\"location\":\"Nowhere\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        UUID compId = UUID.fromString(objectMapper.readTree(compBody).at("/data/id").asText());

        // Delete the org
        mockMvc.perform(delete("/api/v1/organizations/{id}", orgId))
            .andExpect(status().isNoContent());

        // Verify the competition is gone (GET returns 404)
        mockMvc.perform(get("/api/v1/organizations/{orgId}/competitions/{id}", orgId, compId))
            .andExpect(status().isNotFound());
    }
}
