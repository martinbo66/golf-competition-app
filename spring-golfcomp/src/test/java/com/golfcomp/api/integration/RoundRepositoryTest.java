package com.golfcomp.api.integration;

import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
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
@DisplayName("RoundRepository Integration Tests")
class RoundRepositoryTest {

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private CourseRepository courseRepository;

    private Competition competition;
    private Course course;

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

        course = courseRepository.save(Course.builder()
                .name("Heathland")
                .facility("Legends")
                .location("Myrtle Beach, SC")
                .build());
    }

    private Round buildRound(int roundNumber) {
        return Round.builder()
                .competition(competition)
                .course(course)
                .playDate(LocalDate.of(2026, 6, 15).plusDays(roundNumber - 1))
                .roundNumber(roundNumber)
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a round by ID")
    void shouldSaveAndFindById() {
        Round saved = roundRepository.save(buildRound(1));

        assertNotNull(saved.getId());
        Optional<Round> found = roundRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals(1, found.get().getRoundNumber());
    }

    @Test
    @DisplayName("Should find rounds by competition ID ordered by round number")
    void shouldFindByCompetitionIdOrdered() {
        roundRepository.save(buildRound(3));
        roundRepository.save(buildRound(1));
        roundRepository.save(buildRound(2));

        List<Round> rounds = roundRepository.findByCompetitionIdOrderByRoundNumberAsc(competition.getId());

        assertEquals(3, rounds.size());
        assertEquals(1, rounds.get(0).getRoundNumber());
        assertEquals(2, rounds.get(1).getRoundNumber());
        assertEquals(3, rounds.get(2).getRoundNumber());
    }

    @Test
    @DisplayName("Should find round by competition ID and round number")
    void shouldFindByCompetitionIdAndRoundNumber() {
        roundRepository.save(buildRound(1));

        Optional<Round> found = roundRepository.findByCompetitionIdAndRoundNumber(competition.getId(), 1);
        assertTrue(found.isPresent());
        assertEquals(1, found.get().getRoundNumber());
    }

    @Test
    @DisplayName("Should return empty for non-existent competition ID")
    void shouldReturnEmptyListForMissingCompetition() {
        List<Round> rounds = roundRepository.findByCompetitionIdOrderByRoundNumberAsc(UUID.randomUUID());
        assertTrue(rounds.isEmpty());
    }

    @Test
    @DisplayName("Should delete rounds by competition ID")
    void shouldDeleteByCompetitionId() {
        roundRepository.save(buildRound(1));
        roundRepository.save(buildRound(2));

        roundRepository.deleteByCompetitionId(competition.getId());

        List<Round> remaining = roundRepository.findByCompetitionIdOrderByRoundNumberAsc(competition.getId());
        assertTrue(remaining.isEmpty());
    }

    @Test
    @DisplayName("Should auto-set timestamps on persist")
    void shouldAutoSetTimestampsOnPersist() {
        Round saved = roundRepository.save(buildRound(1));

        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}
