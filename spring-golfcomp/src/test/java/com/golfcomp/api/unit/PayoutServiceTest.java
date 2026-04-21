package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreatePayoutRequest;
import com.golfcomp.api.dto.request.TeamWinPayoutRequest;
import com.golfcomp.api.dto.request.UpdatePayoutRequest;
import com.golfcomp.api.dto.response.PayoutResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Payout;
import com.golfcomp.api.model.PayoutType;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.PayoutRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.service.PayoutService;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayoutServiceTest {

    @Mock private PayoutRepository payoutRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private PlayerRepository playerRepository;

    @InjectMocks
    private PayoutService payoutService;

    private UUID competitionId;
    private UUID roundId;
    private UUID playerId;
    private UUID teamId;
    private UUID payoutId;

    private Competition competition;
    private Round round;
    private Player player;
    private Team team;
    private Payout payout;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        roundId = UUID.randomUUID();
        playerId = UUID.randomUUID();
        teamId = UUID.randomUUID();
        payoutId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("Summer Cup")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        team = Team.builder()
            .id(teamId)
            .competition(competition)
            .name("Team Alpha")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        player = Player.builder()
            .id(playerId)
            .competition(competition)
            .team(team)
            .name("Alice Smith")
            .talentRating(TalentRating.A)
            .entryFee(BigDecimal.valueOf(100))
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        round = Round.builder()
            .id(roundId)
            .competition(competition)
            .roundNumber(1)
            .playDate(LocalDate.of(2026, 6, 2))
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        payout = Payout.builder()
            .id(payoutId)
            .competition(competition)
            .round(round)
            .player(player)
            .type(PayoutType.GREENIE)
            .amount(BigDecimal.valueOf(25.00))
            .note("Hole 5")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    // ─── findByRound ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByRound - returns payouts for the round")
    void findByRound_returnsList() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(payoutRepository.findByRoundId(roundId)).thenReturn(List.of(payout));

        List<PayoutResponse> result = payoutService.findByRound(competitionId, roundId);

        assertEquals(1, result.size());
        assertEquals(payoutId, result.get(0).id());
    }

    @Test
    @DisplayName("findByRound - throws when round not found")
    void findByRound_throwsWhenRoundNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.findByRound(competitionId, roundId));
    }

    @Test
    @DisplayName("findByRound - throws when round belongs to different competition")
    void findByRound_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.findByRound(otherId, roundId));
    }

    // ─── findByCompetition ───────────────────────────────────────────────────

    @Test
    @DisplayName("findByCompetition - returns all payouts in competition")
    void findByCompetition_returnsList() {
        when(payoutRepository.findByCompetitionId(competitionId)).thenReturn(List.of(payout));

        List<PayoutResponse> result = payoutService.findByCompetition(competitionId);

        assertEquals(1, result.size());
        assertEquals(PayoutType.GREENIE, result.get(0).type());
    }

    // ─── create ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create - saves payout and recalculates winnings")
    void create_savesPayout() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(payoutRepository.save(any(Payout.class))).thenReturn(payout);
        when(payoutRepository.sumByCompetitionAndPlayer(competitionId, playerId))
            .thenReturn(BigDecimal.valueOf(25));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        CreatePayoutRequest request = new CreatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.valueOf(25), "Hole 5");

        PayoutResponse result = payoutService.create(competitionId, roundId, request);

        assertNotNull(result);
        assertEquals(payoutId, result.id());
        verify(payoutRepository).save(argThat(p ->
            p.getType() == PayoutType.GREENIE
            && p.getAmount().compareTo(BigDecimal.valueOf(25)) == 0));
        verify(playerRepository, atLeastOnce()).save(any(Player.class));
    }

    @Test
    @DisplayName("create - throws when player belongs to different competition")
    void create_throwsWhenPlayerWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        Competition otherComp = Competition.builder().id(otherId).name("Other")
            .startDate(LocalDate.now()).endDate(LocalDate.now().plusDays(1))
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        Player otherPlayer = Player.builder().id(playerId).competition(otherComp)
            .name("Bob").talentRating(TalentRating.B)
            .entryFee(BigDecimal.ZERO).winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(otherPlayer));

        CreatePayoutRequest request = new CreatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.valueOf(25), null);

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.create(competitionId, roundId, request));
    }

    // ─── update ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update - updates payout fields and recalculates winnings")
    void update_updatesFields() {
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.of(payout));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(payoutRepository.save(payout)).thenReturn(payout);
        when(payoutRepository.sumByCompetitionAndPlayer(competitionId, playerId))
            .thenReturn(BigDecimal.valueOf(50));

        UpdatePayoutRequest request = new UpdatePayoutRequest(
            playerId, PayoutType.TEAM_WIN, BigDecimal.valueOf(50), "Updated note");

        PayoutResponse result = payoutService.update(competitionId, payoutId, request);

        assertNotNull(result);
        assertEquals(PayoutType.TEAM_WIN, payout.getType());
        assertEquals(BigDecimal.valueOf(50), payout.getAmount());
        assertEquals("Updated note", payout.getNote());
        verify(payoutRepository).save(payout);
    }

    @Test
    @DisplayName("update - recalculates winnings for previous player when player changes")
    void update_recalculatesPreviousPlayer() {
        UUID newPlayerId = UUID.randomUUID();
        Player newPlayer = Player.builder()
            .id(newPlayerId)
            .competition(competition)
            .name("Bob Jones")
            .talentRating(TalentRating.B)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(payoutRepository.findById(payoutId)).thenReturn(Optional.of(payout));
        when(playerRepository.findById(newPlayerId)).thenReturn(Optional.of(newPlayer));
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(payoutRepository.save(payout)).thenReturn(payout);
        when(payoutRepository.sumByCompetitionAndPlayer(any(), any()))
            .thenReturn(BigDecimal.ZERO);

        UpdatePayoutRequest request = new UpdatePayoutRequest(
            newPlayerId, PayoutType.GREENIE, BigDecimal.valueOf(30), null);

        payoutService.update(competitionId, payoutId, request);

        // Both players should have winnings recalculated
        verify(payoutRepository).sumByCompetitionAndPlayer(competitionId, newPlayerId);
        verify(payoutRepository).sumByCompetitionAndPlayer(competitionId, playerId);
    }

    @Test
    @DisplayName("update - throws when payout not found")
    void update_throwsWhenNotFound() {
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.empty());

        UpdatePayoutRequest request = new UpdatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.TEN, null);

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.update(competitionId, payoutId, request));
    }

    @Test
    @DisplayName("update - throws when payout belongs to different competition")
    void update_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.of(payout));

        UpdatePayoutRequest request = new UpdatePayoutRequest(
            playerId, PayoutType.GREENIE, BigDecimal.TEN, null);

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.update(otherId, payoutId, request));
    }

    // ─── delete ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete - removes payout and recalculates player winnings")
    void delete_removesPayout() {
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.of(payout));
        when(payoutRepository.sumByCompetitionAndPlayer(competitionId, playerId))
            .thenReturn(BigDecimal.ZERO);
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        payoutService.delete(competitionId, payoutId);

        verify(payoutRepository).delete(payout);
        verify(playerRepository).save(any(Player.class));
    }

    @Test
    @DisplayName("delete - throws when payout not found")
    void delete_throwsWhenNotFound() {
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.delete(competitionId, payoutId));
    }

    @Test
    @DisplayName("delete - throws when payout belongs to different competition")
    void delete_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(payoutRepository.findById(payoutId)).thenReturn(Optional.of(payout));

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.delete(otherId, payoutId));
    }

    // ─── recordTeamWin ───────────────────────────────────────────────────────

    @Test
    @DisplayName("recordTeamWin - creates one payout per team player")
    void recordTeamWin_createsPayoutsForAllPlayers() {
        UUID player2Id = UUID.randomUUID();
        Player player2 = Player.builder()
            .id(player2Id)
            .competition(competition)
            .team(team)
            .name("Bob Jones")
            .talentRating(TalentRating.B)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findByCompetitionIdAndTeamId(competitionId, teamId))
            .thenReturn(List.of(player, player2));
        when(payoutRepository.save(any(Payout.class))).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            p.setCreatedAt(Instant.now());
            p.setUpdatedAt(Instant.now());
            return p;
        });
        when(payoutRepository.sumByCompetitionAndPlayer(any(), any()))
            .thenReturn(BigDecimal.valueOf(40));
        when(playerRepository.findById(any())).thenReturn(Optional.of(player));

        TeamWinPayoutRequest request = new TeamWinPayoutRequest(teamId, BigDecimal.valueOf(80));

        List<PayoutResponse> results = payoutService.recordTeamWin(competitionId, roundId, request);

        assertEquals(2, results.size());
        verify(payoutRepository, times(2)).save(any(Payout.class));
    }

    @Test
    @DisplayName("recordTeamWin - distributes floor amount per player with remainder to last")
    void recordTeamWin_splitsMathCorrectly() {
        // $10 split among 3 players: $3.33 + $3.33 + $3.34
        UUID p2Id = UUID.randomUUID();
        UUID p3Id = UUID.randomUUID();
        Player p2 = playerWith(p2Id);
        Player p3 = playerWith(p3Id);

        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findByCompetitionIdAndTeamId(competitionId, teamId))
            .thenReturn(List.of(player, p2, p3));
        when(payoutRepository.save(any(Payout.class))).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            p.setCreatedAt(Instant.now());
            p.setUpdatedAt(Instant.now());
            return p;
        });
        when(payoutRepository.sumByCompetitionAndPlayer(any(), any()))
            .thenReturn(BigDecimal.ZERO);
        when(playerRepository.findById(any())).thenReturn(Optional.of(player));

        TeamWinPayoutRequest request = new TeamWinPayoutRequest(teamId, new BigDecimal("10.00"));

        List<PayoutResponse> results = payoutService.recordTeamWin(competitionId, roundId, request);

        BigDecimal total = results.stream()
            .map(PayoutResponse::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, total.compareTo(new BigDecimal("10.00")));
        assertEquals(3, results.size());
    }

    @Test
    @DisplayName("recordTeamWin - throws when no players assigned to team")
    void recordTeamWin_throwsWhenNoTeamPlayers() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(playerRepository.findByCompetitionIdAndTeamId(competitionId, teamId))
            .thenReturn(List.of());

        TeamWinPayoutRequest request = new TeamWinPayoutRequest(teamId, BigDecimal.valueOf(80));

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.recordTeamWin(competitionId, roundId, request));
    }

    @Test
    @DisplayName("recordTeamWin - throws when round not found")
    void recordTeamWin_throwsWhenRoundNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());

        TeamWinPayoutRequest request = new TeamWinPayoutRequest(teamId, BigDecimal.valueOf(80));

        assertThrows(ResourceNotFoundException.class,
            () -> payoutService.recordTeamWin(competitionId, roundId, request));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Player playerWith(UUID id) {
        return Player.builder()
            .id(id)
            .competition(competition)
            .team(team)
            .name("Player " + id)
            .talentRating(TalentRating.C)
            .entryFee(BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }
}
