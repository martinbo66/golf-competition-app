package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreatePayoutRequest;
import com.golfcomp.api.dto.request.TeamWinPayoutRequest;
import com.golfcomp.api.dto.request.UpdatePayoutRequest;
import com.golfcomp.api.dto.response.PayoutResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Payout;
import com.golfcomp.api.model.PayoutType;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.repository.PayoutRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final RoundRepository roundRepository;
    private final PlayerRepository playerRepository;

    public PayoutService(PayoutRepository payoutRepository,
                         RoundRepository roundRepository,
                         PlayerRepository playerRepository) {
        this.payoutRepository = payoutRepository;
        this.roundRepository = roundRepository;
        this.playerRepository = playerRepository;
    }

    public List<PayoutResponse> findByRound(UUID competitionId, UUID roundId) {
        Round round = loadRoundInCompetition(competitionId, roundId);
        return payoutRepository.findByRoundId(round.getId()).stream()
            .map(PayoutResponse::from)
            .toList();
    }

    public List<PayoutResponse> findByCompetition(UUID competitionId) {
        return payoutRepository.findByCompetitionId(competitionId).stream()
            .map(PayoutResponse::from)
            .toList();
    }

    @Transactional
    public PayoutResponse create(UUID competitionId, UUID roundId, CreatePayoutRequest request) {
        Round round = loadRoundInCompetition(competitionId, roundId);
        Player player = loadPlayerInCompetition(competitionId, request.playerId());

        Payout payout = Payout.builder()
            .competition(round.getCompetition())
            .round(round)
            .player(player)
            .type(request.type())
            .amount(request.amount())
            .note(request.note())
            .build();
        Payout saved = payoutRepository.save(payout);
        recalculatePlayerWinnings(competitionId, player.getId());
        return PayoutResponse.from(saved);
    }

    @Transactional
    public PayoutResponse update(UUID competitionId, UUID payoutId, UpdatePayoutRequest request) {
        Payout payout = payoutRepository.findById(payoutId)
            .orElseThrow(() -> new ResourceNotFoundException("Payout not found with id: " + payoutId));
        if (!payout.getCompetition().getId().equals(competitionId)) {
            throw new ResourceNotFoundException("Payout not found with id: " + payoutId);
        }
        UUID previousPlayerId = payout.getPlayer().getId();

        Player player = loadPlayerInCompetition(competitionId, request.playerId());
        payout.setPlayer(player);
        payout.setType(request.type());
        payout.setAmount(request.amount());
        payout.setNote(request.note());
        Payout saved = payoutRepository.save(payout);

        // Recalculate for both the previous and new player, in case payout was reassigned.
        recalculatePlayerWinnings(competitionId, player.getId());
        if (!previousPlayerId.equals(player.getId())) {
            recalculatePlayerWinnings(competitionId, previousPlayerId);
        }
        return PayoutResponse.from(saved);
    }

    /**
     * Toggle the paid flag on a payout. Sets {@code paidAt} when transitioning to paid,
     * clears it when transitioning back to unpaid. Recalculates the player's winnings
     * because winnings is defined as the sum of paid payouts only.
     */
    @Transactional
    public PayoutResponse setPaid(UUID competitionId, UUID payoutId, boolean paid) {
        Payout payout = payoutRepository.findById(payoutId)
            .orElseThrow(() -> new ResourceNotFoundException("Payout not found with id: " + payoutId));
        if (!payout.getCompetition().getId().equals(competitionId)) {
            throw new ResourceNotFoundException("Payout not found with id: " + payoutId);
        }
        payout.setPaid(paid);
        payout.setPaidAt(paid ? Instant.now() : null);
        Payout saved = payoutRepository.save(payout);
        recalculatePlayerWinnings(competitionId, payout.getPlayer().getId());
        return PayoutResponse.from(saved);
    }

    @Transactional
    public void delete(UUID competitionId, UUID payoutId) {
        Payout payout = payoutRepository.findById(payoutId)
            .orElseThrow(() -> new ResourceNotFoundException("Payout not found with id: " + payoutId));
        if (!payout.getCompetition().getId().equals(competitionId)) {
            throw new ResourceNotFoundException("Payout not found with id: " + payoutId);
        }
        UUID playerId = payout.getPlayer().getId();
        payoutRepository.delete(payout);
        recalculatePlayerWinnings(competitionId, playerId);
    }

    /**
     * Records a team-win payout: splits the supplied team amount evenly among the team's
     * current players and creates one TEAM_WIN payout per player.
     * Any cent rounding remainder is added to the last payout so the total equals teamAmount.
     */
    @Transactional
    public List<PayoutResponse> recordTeamWin(UUID competitionId, UUID roundId, TeamWinPayoutRequest request) {
        Round round = loadRoundInCompetition(competitionId, roundId);
        List<Player> teamPlayers = playerRepository.findByCompetitionIdAndTeamId(competitionId, request.teamId());
        if (teamPlayers.isEmpty()) {
            throw new ResourceNotFoundException(
                "No players assigned to team " + request.teamId() + " in competition " + competitionId);
        }

        BigDecimal total = request.teamAmount();
        int count = teamPlayers.size();
        BigDecimal per = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.FLOOR);
        BigDecimal distributed = per.multiply(BigDecimal.valueOf(count));
        BigDecimal remainder = total.subtract(distributed);

        List<PayoutResponse> results = new ArrayList<>();
        Set<UUID> touchedPlayerIds = new HashSet<>();
        for (int i = 0; i < count; i++) {
            Player player = teamPlayers.get(i);
            BigDecimal share = (i == count - 1) ? per.add(remainder) : per;
            Payout payout = Payout.builder()
                .competition(round.getCompetition())
                .round(round)
                .player(player)
                .type(PayoutType.TEAM_WIN)
                .amount(share)
                .note("Team win share")
                .build();
            results.add(PayoutResponse.from(payoutRepository.save(payout)));
            touchedPlayerIds.add(player.getId());
        }
        for (UUID pid : touchedPlayerIds) {
            recalculatePlayerWinnings(competitionId, pid);
        }
        return results;
    }

    private Round loadRoundInCompetition(UUID competitionId, UUID roundId) {
        Round round = roundRepository.findById(roundId)
            .orElseThrow(() -> ResourceNotFoundException.round(roundId));
        if (!round.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.round(roundId);
        }
        return round;
    }

    private Player loadPlayerInCompetition(UUID competitionId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        return player;
    }

    private void recalculatePlayerWinnings(UUID competitionId, UUID playerId) {
        BigDecimal total = payoutRepository.sumByCompetitionAndPlayer(competitionId, playerId);
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        player.setWinnings(total != null ? total : BigDecimal.ZERO);
        playerRepository.save(player);
    }
}
