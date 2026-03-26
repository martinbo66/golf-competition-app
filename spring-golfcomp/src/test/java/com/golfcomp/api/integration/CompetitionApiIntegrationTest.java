package com.golfcomp.api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.golfcomp.api.dto.request.CreateCompetitionRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Competition API Integration Tests")
class CompetitionApiIntegrationTest {

    private static final String DEFAULT_ORG_ID = "a0000000-0000-0000-0000-000000000001";
    private static final String BASE_URL = "/api/v1/organizations/" + DEFAULT_ORG_ID + "/competitions";

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CompetitionRepository competitionRepository;
    @Autowired OrganizationRepository organizationRepository;

    @BeforeEach
    void cleanDatabase() {
        competitionRepository.deleteAll(); // cascades to rounds, teams, players, scores
    }

    @Test
    @DisplayName("full CRUD roundtrip - create, read, update, delete with real DB persistence")
    void fullCrudRoundtrip() throws Exception {
        CreateCompetitionRequest createReq = new CreateCompetitionRequest(
            "2026 Bathe Golf", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5), "Myrtle Beach");

        // CREATE - persists to H2
        String body = mockMvc.perform(post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createReq)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("2026 Bathe Golf"))
            .andExpect(jsonPath("$.data.location").value("Myrtle Beach"))
            .andExpect(jsonPath("$.meta.requestId").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(body).at("/data/id").asText());
        assertEquals(1, competitionRepository.count());

        // READ - retrieves persisted data
        mockMvc.perform(get(BASE_URL + "/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.id").value(id.toString()))
            .andExpect(jsonPath("$.data.location").value("Myrtle Beach"));

        // LIST - includes the new competition
        mockMvc.perform(get(BASE_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1));

        // UPDATE - overwrites fields
        UpdateCompetitionRequest updateReq = new UpdateCompetitionRequest(
            "Updated Name", LocalDate.of(2026, 6, 2), LocalDate.of(2026, 6, 6), "New Location");
        mockMvc.perform(put(BASE_URL + "/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.name").value("Updated Name"))
            .andExpect(jsonPath("$.data.location").value("New Location"));

        // DELETE - removes from DB
        mockMvc.perform(delete(BASE_URL + "/{id}", id))
            .andExpect(status().isNoContent());
        assertEquals(0, competitionRepository.count());

        // VERIFY GONE - subsequent GET returns 404
        mockMvc.perform(get(BASE_URL + "/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /competitions/{id} - 404 with error envelope for unknown ID")
    void getById_returns404WithErrorEnvelope() throws Exception {
        mockMvc.perform(get(BASE_URL + "/{id}", UUID.randomUUID()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.meta.timestamp").isNotEmpty())
            .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("POST /competitions - 400 validation error when name is blank")
    void create_returns400WhenNameBlank() throws Exception {
        mockMvc.perform(post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"startDate\":\"2026-06-01\",\"endDate\":\"2026-06-05\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("name")));
    }

    @Test
    @DisplayName("POST /competitions - 400 when required dates are missing")
    void create_returns400WhenDatesNull() throws Exception {
        mockMvc.perform(post(BASE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("GET /competitions - returns empty list when no competitions exist")
    void findAll_returnsEmptyListWhenNoneExist() throws Exception {
        mockMvc.perform(get(BASE_URL))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(0));
    }
}
