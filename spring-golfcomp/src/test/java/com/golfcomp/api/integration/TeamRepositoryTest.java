package com.golfcomp.api.integration;

import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.repository.TeamRepository;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("TeamRepository Integration Tests")
class TeamRepositoryTest {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Competition competition;

    private Organization defaultOrg() {
        return organizationRepository.findById(CompetitionService.DEFAULT_ORGANIZATION_ID)
                .orElseThrow(() -> new IllegalStateException("Default organization not seeded"));
    }

    @BeforeEach
    void setUp() {
        competition = competitionRepository.save(Competition.builder()
                .organization(defaultOrg())
                .name("Test Competition")
                .startDate(LocalDate.of(2026, 6, 15))
                .endDate(LocalDate.of(2026, 6, 20))
                .build());
    }

    private Team buildTeam(String name) {
        return Team.builder()
                .competition(competition)
                .name(name)
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a team by ID")
    void shouldSaveAndFindById() {
        Team saved = teamRepository.save(buildTeam("Bathe's Bombers"));

        assertNotNull(saved.getId());
        assertTrue(teamRepository.findById(saved.getId()).isPresent());
    }

    @Test
    @DisplayName("Should find teams by competition ID")
    void shouldFindByCompetitionId() {
        teamRepository.save(buildTeam("Team Alpha"));
        teamRepository.save(buildTeam("Team Beta"));

        List<Team> teams = teamRepository.findByCompetitionId(competition.getId());
        assertEquals(2, teams.size());
    }

    @Test
    @DisplayName("Should return empty list for competition with no teams")
    void shouldReturnEmptyListForCompetitionWithNoTeams() {
        List<Team> teams = teamRepository.findByCompetitionId(UUID.randomUUID());
        assertTrue(teams.isEmpty());
    }

    @Test
    @DisplayName("Should check existence by competition ID and name")
    void shouldCheckExistsByCompetitionIdAndName() {
        teamRepository.save(buildTeam("Team Alpha"));

        assertTrue(teamRepository.existsByCompetitionIdAndName(competition.getId(), "Team Alpha"));
        assertFalse(teamRepository.existsByCompetitionIdAndName(competition.getId(), "Team Beta"));
    }

    @Test
    @DisplayName("Should delete teams by competition ID")
    void shouldDeleteByCompetitionId() {
        teamRepository.save(buildTeam("Team Alpha"));
        teamRepository.save(buildTeam("Team Beta"));

        teamRepository.deleteByCompetitionId(competition.getId());

        List<Team> remaining = teamRepository.findByCompetitionId(competition.getId());
        assertTrue(remaining.isEmpty());
    }

    @Test
    @DisplayName("Should auto-set timestamps on persist")
    void shouldAutoSetTimestampsOnPersist() {
        Team saved = teamRepository.save(buildTeam("Timestamp Team"));

        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}
