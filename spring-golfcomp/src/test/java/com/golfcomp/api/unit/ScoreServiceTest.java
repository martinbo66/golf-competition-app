package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.dto.response.ScoreResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.Score;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.repository.ScoreRepository;
import com.golfcomp.api.service.ScoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScoreServiceTest {

    @Mock private ScoreRepository scoreRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private PlayerRepository playerRepository;
    @Mock private CompetitionRepository competitionRepository;

    @InjectMocks
    private ScoreService scoreService;

    private Competition competition;
    private Course course;
    private Round round;
    private Player player;
    private Score score;
    private UUID competitionId;
    private UUID roundId;
    private UUID playerId;
    private UUID scoreId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        roundId = UUID.randomUUID();
        playerId = UUID.randomUUID();
        scoreId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        course = Course.builder()
            .id(UUID.randomUUID())
            .name("Heathland")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        round = Round.builder()
            .id(roundId)
            .competition(competition)
            .course(course)
            .playDate(LocalDate.of(2026, 6, 2))
            .roundNumber(1)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        player = Player.builder()
            .id(playerId)
            .competition(competition)
            .name("Erik Bathe")
            .talentRating(TalentRating.A)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        score = Score.builder()
            .id(scoreId)
            .competition(competition)
            .round(round)
            .player(player)
            .value(55)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("upsert - creates new score when none exists")
    void upsert_createsNewScore() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(scoreRepository.findByRoundIdAndPlayerId(roundId, playerId)).thenReturn(Optional.empty());
        when(scoreRepository.save(any(Score.class))).thenReturn(score);
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 55);

        ScoreResponse response = scoreService.upsert(competitionId, roundId, request);

        assertNotNull(response);
        assertEquals(55, response.value());
        verify(scoreRepository).save(any(Score.class));
    }

    @Test
    @DisplayName("upsert - updates existing score value")
    void upsert_updatesExistingScore() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(scoreRepository.findByRoundIdAndPlayerId(roundId, playerId)).thenReturn(Optional.of(score));
        Score updatedScore = Score.builder()
            .id(scoreId).competition(competition).round(round).player(player)
            .value(60).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        when(scoreRepository.save(score)).thenReturn(updatedScore);
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 60);

        ScoreResponse response = scoreService.upsert(competitionId, roundId, request);

        assertEquals(60, response.value());
        assertEquals(60, score.getValue());
    }

    @Test
    @DisplayName("upsert - throws when round belongs to different competition")
    void upsert_throwsWhenWrongCompetition() {
        UUID otherCompId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 55);

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.upsert(otherCompId, roundId, request));
    }

    @Test
    @DisplayName("findByRound - returns all scores for the round")
    void findByRound_returnsScores() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(scoreRepository.findByRoundId(roundId)).thenReturn(List.of(score));

        List<ScoreResponse> result = scoreService.findByRound(competitionId, roundId);

        assertEquals(1, result.size());
        assertEquals(scoreId, result.get(0).id());
    }

    @Test
    @DisplayName("deleteAllByCompetition - delegates to repository bulk delete")
    void deleteAllByCompetition_delegatesToRepository() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);

        scoreService.deleteAllByCompetition(competitionId);

        verify(scoreRepository).deleteByCompetitionId(competitionId);
    }

    @Test
    @DisplayName("deleteAllByCompetition - throws when competition not found")
    void deleteAllByCompetition_throwsWhenNotFound() {
        when(competitionRepository.existsById(competitionId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.deleteAllByCompetition(competitionId));
    }

    @Test
    @DisplayName("upsert - throws when round not found")
    void upsert_throwsWhenRoundNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 55);

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.upsert(competitionId, roundId, request));
    }

    @Test
    @DisplayName("upsert - throws when player not found")
    void upsert_throwsWhenPlayerNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 55);

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.upsert(competitionId, roundId, request));
    }

    @Test
    @DisplayName("upsert - throws when player belongs to different competition")
    void upsert_throwsWhenPlayerInDifferentCompetition() {
        UUID otherCompId = UUID.randomUUID();
        Competition otherComp = Competition.builder()
            .id(otherCompId).name("Other").startDate(LocalDate.now())
            .endDate(LocalDate.now().plusDays(1))
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        Player otherPlayer = Player.builder()
            .id(playerId).competition(otherComp).name("Other Player")
            .talentRating(TalentRating.C).entryFee(BigDecimal.ZERO).winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(otherPlayer));
        UpsertScoreRequest request = new UpsertScoreRequest(playerId, 55);

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.upsert(competitionId, roundId, request));
    }

    @Test
    @DisplayName("findByRound - throws when round not found")
    void findByRound_throwsWhenRoundNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.findByRound(competitionId, roundId));
    }

    @Test
    @DisplayName("findByRound - throws when round belongs to different competition")
    void findByRound_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        assertThrows(ResourceNotFoundException.class,
            () -> scoreService.findByRound(otherId, roundId));
    }
}
