package com.golfcomp.api.integration;

import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("CompetitionRepository Integration Tests")
class CompetitionRepositoryTest {

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Organization defaultOrg() {
        return organizationRepository.findById(CompetitionService.DEFAULT_ORGANIZATION_ID)
                .orElseThrow(() -> new IllegalStateException("Default organization not seeded"));
    }

    private Competition buildCompetition(String name) {
        return Competition.builder()
                .organization(defaultOrg())
                .name(name)
                .startDate(LocalDate.of(2026, 6, 15))
                .endDate(LocalDate.of(2026, 6, 20))
                .location("Legends at Myrtle Beach")
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a competition by ID")
    void shouldSaveAndFindById() {
        Competition saved = competitionRepository.save(buildCompetition("2026 Bathe Golf"));

        assertNotNull(saved.getId());
        Optional<Competition> found = competitionRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("2026 Bathe Golf", found.get().getName());
    }

    @Test
    @DisplayName("Should return empty when ID not found")
    void shouldReturnEmptyForMissingId() {
        Optional<Competition> found = competitionRepository.findById(UUID.randomUUID());
        assertFalse(found.isPresent());
    }

    @Test
    @DisplayName("Should list all competitions")
    void shouldFindAllCompetitions() {
        competitionRepository.save(buildCompetition("Competition A"));
        competitionRepository.save(buildCompetition("Competition B"));

        List<Competition> all = competitionRepository.findAll();
        assertTrue(all.size() >= 2);
    }

    @Test
    @DisplayName("Should delete a competition by ID")
    void shouldDeleteById() {
        Competition saved = competitionRepository.save(buildCompetition("To Delete"));
        UUID id = saved.getId();

        competitionRepository.deleteById(id);

        assertFalse(competitionRepository.findById(id).isPresent());
    }

    @Test
    @DisplayName("Should auto-set timestamps on persist")
    void shouldAutoSetTimestampsOnPersist() {
        Competition saved = competitionRepository.save(buildCompetition("Timestamp Test"));

        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}
