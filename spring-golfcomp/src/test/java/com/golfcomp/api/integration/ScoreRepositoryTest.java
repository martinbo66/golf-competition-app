package com.golfcomp.api.integration;

import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.Score;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.repository.ScoreRepository;
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
@DisplayName("ScoreRepository Integration Tests")
class ScoreRepositoryTest {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private RoundRepository roundRepository;

    @Autowired
    private PlayerRepository playerRepository;

    private Competition competition;
    private Course course;
    private Round round;
    private Player player;

    @BeforeEach
    void setUp() {
        competition = competitionRepository.save(Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.of(2026, 6, 15))
                .endDate(LocalDate.of(2026, 6, 20))
                .build());

        course = courseRepository.save(Course.builder()
                .name("Heathland")
                .facility("Legends")
                .location("Myrtle Beach, SC")
                .build());

        round = roundRepository.save(Round.builder()
                .competition(competition)
                .course(course)
                .playDate(LocalDate.of(2026, 6, 15))
                .roundNumber(1)
                .build());

        player = playerRepository.save(Player.builder()
                .competition(competition)
                .name("Erik Bathe")
                .talentRating(TalentRating.A)
                .build());
    }

    private Score buildScore(int value) {
        return Score.builder()
                .competition(competition)
                .round(round)
                .player(player)
                .value(value)
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a score by ID")
    void shouldSaveAndFindById() {
        Score saved = scoreRepository.save(buildScore(55));

        assertNotNull(saved.getId());
        Optional<Score> found = scoreRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals(55,found.get().getValue());
    }

    @Test
    @DisplayName("Should find scores by round ID")
    void shouldFindByRoundId() {
        scoreRepository.save(buildScore(55));

        List<Score> scores = scoreRepository.findByRoundId(round.getId());
        assertEquals(1, scores.size());
        assertEquals(55,scores.get(0).getValue());
    }

    @Test
    @DisplayName("Should find scores by competition ID")
    void shouldFindByCompetitionId() {
        scoreRepository.save(buildScore(60));

        List<Score> scores = scoreRepository.findByCompetitionId(competition.getId());
        assertEquals(1, scores.size());
    }

    @Test
    @DisplayName("Should find scores by player ID")
    void shouldFindByPlayerId() {
        scoreRepository.save(buildScore(55));

        List<Score> scores = scoreRepository.findByPlayerId(player.getId());
        assertEquals(1, scores.size());
        assertEquals(55, scores.get(0).getValue());
    }

    @Test
    @DisplayName("Should find score by round ID and player ID")
    void shouldFindByRoundIdAndPlayerId() {
        scoreRepository.save(buildScore(50));

        Optional<Score> found = scoreRepository.findByRoundIdAndPlayerId(round.getId(), player.getId());
        assertTrue(found.isPresent());
        assertEquals(50, found.get().getValue());
    }

    @Test
    @DisplayName("Should return empty when no score for round and player")
    void shouldReturnEmptyForMissingRoundPlayer() {
        Optional<Score> found = scoreRepository.findByRoundIdAndPlayerId(UUID.randomUUID(), UUID.randomUUID());
        assertFalse(found.isPresent());
    }

    @Test
    @DisplayName("Should delete scores by competition ID")
    void shouldDeleteByCompetitionId() {
        scoreRepository.save(buildScore(55));

        scoreRepository.deleteByCompetitionId(competition.getId());

        List<Score> remaining = scoreRepository.findByCompetitionId(competition.getId());
        assertTrue(remaining.isEmpty());
    }

    @Test
    @DisplayName("Should auto-set timestamps on persist")
    void shouldAutoSetTimestampsOnPersist() {
        Score saved = scoreRepository.save(buildScore(72));

        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }
}
