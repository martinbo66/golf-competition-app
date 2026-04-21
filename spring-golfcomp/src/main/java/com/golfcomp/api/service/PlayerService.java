package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.AssignPlayerRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.UpdatePlayerRequest;
import com.golfcomp.api.dto.response.PlayerResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final CompetitionRepository competitionRepository;
    private final TeamRepository teamRepository;

    public PlayerService(PlayerRepository playerRepository,
                         CompetitionRepository competitionRepository,
                         TeamRepository teamRepository) {
        this.playerRepository = playerRepository;
        this.competitionRepository = competitionRepository;
        this.teamRepository = teamRepository;
    }

    @Transactional
    public PlayerResponse create(UUID competitionId, CreatePlayerRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> ResourceNotFoundException.competition(competitionId));
        Player player = Player.builder()
            .competition(competition)
            .name(request.name())
            .nickname(request.nickname())
            .talentRating(request.talentRating())
            .entryFee(request.entryFee() != null ? request.entryFee() : BigDecimal.ZERO)
            .winnings(BigDecimal.ZERO)
            .build();
        return PlayerResponse.from(playerRepository.save(player));
    }

    public List<PlayerResponse> findByCompetition(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        return playerRepository.findByCompetitionId(competitionId).stream()
            .map(PlayerResponse::from)
            .toList();
    }

    public PlayerResponse findById(UUID competitionId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        return PlayerResponse.from(player);
    }

    @Transactional
    public PlayerResponse update(UUID competitionId, UUID playerId, UpdatePlayerRequest request) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        player.setName(request.name());
        player.setNickname(request.nickname());
        player.setTalentRating(request.talentRating());
        if (request.entryFee() != null) {
            player.setEntryFee(request.entryFee());
        }
        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public PlayerResponse assignToTeam(UUID competitionId, UUID playerId, AssignPlayerRequest request) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        Team team = teamRepository.findById(request.teamId())
            .orElseThrow(() -> ResourceNotFoundException.team(request.teamId()));
        if (!team.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.team(request.teamId());
        }
        player.setTeam(team);
        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public PlayerResponse unassignFromTeam(UUID competitionId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        player.setTeam(null);
        return PlayerResponse.from(playerRepository.save(player));
    }

    @Transactional
    public void delete(UUID competitionId, UUID playerId) {
        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> ResourceNotFoundException.player(playerId));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(playerId);
        }
        playerRepository.deleteById(playerId);
    }
}
