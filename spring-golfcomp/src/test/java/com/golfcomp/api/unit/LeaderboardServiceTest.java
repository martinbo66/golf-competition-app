package com.golfcomp.api.unit;

import com.golfcomp.api.dto.response.PlayerLeaderboardEntry;
import com.golfcomp.api.dto.response.TeamLeaderboardEntry;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.Score;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.ScoreRepository;
import com.golfcomp.api.repository.TeamRepository;
import com.golfcomp.api.service.LeaderboardService;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock private CompetitionRepository competitionRepository;
    @Mock private PlayerRepository playerRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private ScoreRepository scoreRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    private Competition competition;
    private Team team;
    private Player playerA;
    private Player playerB;
    private Round round;
    private Score scoreA;
    private Score scoreB;
    private UUID competitionId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        team = Team.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .name("Team Alpha")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        playerA = Player.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .team(team)
            .name("Erik Bathe")
            .talentRating(TalentRating.A)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        playerB = Player.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .team(team)
            .name("Steve Smith")
            .talentRating(TalentRating.B)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        Course course = Course.builder()
            .id(UUID.randomUUID()).name("Heathland")
            .createdAt(Instant.now()).updatedAt(Instant.now()).build();

        round = Round.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .course(course)
            .playDate(LocalDate.of(2026, 6, 2))
            .roundNumber(1)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        scoreA = Score.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .round(round)
            .player(playerA)
            .value(80)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        scoreB = Score.builder()
            .id(UUID.randomUUID())
            .competition(competition)
            .round(round)
            .player(playerB)
            .value(90)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("getPlayerLeaderboard - throws when competition not found")
    void getPlayerLeaderboard_throwsWhenNotFound() {
        when(competitionRepository.existsById(competitionId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
            () -> leaderboardService.getPlayerLeaderboard(competitionId));
    }

    @Test
    @DisplayName("getPlayerLeaderboard - returns players sorted by score ascending (lower is better)")
    void getPlayerLeaderboard_sortsByScoreAscending() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(playerRepository.findByCompetitionId(competitionId)).thenReturn(List.of(playerA, playerB));
        when(scoreRepository.findByCompetitionId(competitionId)).thenReturn(List.of(scoreA, scoreB));

        List<PlayerLeaderboardEntry> entries = leaderboardService.getPlayerLeaderboard(competitionId);

        assertEquals(2, entries.size());
        // playerA scored 80 (lower = better), should rank 1
        assertEquals(1, entries.get(0).rank());
        assertEquals(80, entries.get(0).totalScore());
        // playerB scored 90, should rank 2
        assertEquals(2, entries.get(1).rank());
        assertEquals(90, entries.get(1).totalScore());
    }

    @Test
    @DisplayName("getPlayerLeaderboard - assigns same rank to tied players")
    void getPlayerLeaderboard_handlesTies() {
        Score scoreBTied = Score.builder()
            .id(UUID.randomUUID()).competition(competition).round(round)
            .player(playerB).value(80).createdAt(Instant.now()).updatedAt(Instant.now()).build();
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(playerRepository.findByCompetitionId(competitionId)).thenReturn(List.of(playerA, playerB));
        when(scoreRepository.findByCompetitionId(competitionId)).thenReturn(List.of(scoreA, scoreBTied));

        List<PlayerLeaderboardEntry> entries = leaderboardService.getPlayerLeaderboard(competitionId);

        assertEquals(2, entries.size());
        assertEquals(1, entries.get(0).rank());
        assertEquals(1, entries.get(1).rank()); // both tied at rank 1
    }

    @Test
    @DisplayName("getPlayerLeaderboard - players without scores ranked below scored players")
    void getPlayerLeaderboard_unscaredPlayersRankLast() {
        Player unscored = Player.builder()
            .id(UUID.randomUUID()).competition(competition)
            .name("No Scores").talentRating(TalentRating.D)
            .entryFee(BigDecimal.ZERO).winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(playerRepository.findByCompetitionId(competitionId))
            .thenReturn(List.of(playerA, playerB, unscored));
        when(scoreRepository.findByCompetitionId(competitionId)).thenReturn(List.of(scoreA, scoreB));

        List<PlayerLeaderboardEntry> entries = leaderboardService.getPlayerLeaderboard(competitionId);

        assertEquals(3, entries.size());
        // unscored player should be last (0 rounds played)
        assertEquals(0, entries.get(2).roundsPlayed());
        assertEquals("No Scores", entries.get(2).playerName());
    }

    @Test
    @DisplayName("getTeamLeaderboard - returns teams sorted by total score ascending")
    void getTeamLeaderboard_sortsByTotalScore() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(teamRepository.findByCompetitionId(competitionId)).thenReturn(List.of(team));
        when(playerRepository.findByCompetitionId(competitionId)).thenReturn(List.of(playerA, playerB));
        when(scoreRepository.findByCompetitionId(competitionId)).thenReturn(List.of(scoreA, scoreB));

        List<TeamLeaderboardEntry> entries = leaderboardService.getTeamLeaderboard(competitionId);

        assertEquals(1, entries.size());
        assertEquals(1, entries.get(0).rank());
        assertEquals(170, entries.get(0).totalScore()); // 80 + 90
        assertEquals(2, entries.get(0).playerCount());
    }
}
