package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.UpsertScoreRequest;
import com.golfcomp.api.dto.response.ScoreResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.model.Score;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.repository.ScoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final RoundRepository roundRepository;
    private final PlayerRepository playerRepository;
    private final CompetitionRepository competitionRepository;

    public ScoreService(ScoreRepository scoreRepository,
                        RoundRepository roundRepository,
                        PlayerRepository playerRepository,
                        CompetitionRepository competitionRepository) {
        this.scoreRepository = scoreRepository;
        this.roundRepository = roundRepository;
        this.playerRepository = playerRepository;
        this.competitionRepository = competitionRepository;
    }

    @Transactional
    public ScoreResponse upsert(UUID competitionId, UUID roundId, UpsertScoreRequest request) {
        Round round = roundRepository.findById(roundId)
            .orElseThrow(() -> ResourceNotFoundException.round(roundId));
        if (!round.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.round(roundId);
        }
        Player player = playerRepository.findById(request.playerId())
            .orElseThrow(() -> ResourceNotFoundException.player(request.playerId()));
        if (!player.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.player(request.playerId());
        }
        Score score = scoreRepository.findByRoundIdAndPlayerId(roundId, request.playerId())
            .orElseGet(() -> Score.builder()
                .competition(round.getCompetition())
                .round(round)
                .player(player)
                .build());
        score.setValue(request.value());
        return ScoreResponse.from(scoreRepository.save(score));
    }

    public List<ScoreResponse> findByRound(UUID competitionId, UUID roundId) {
        Round round = roundRepository.findById(roundId)
            .orElseThrow(() -> ResourceNotFoundException.round(roundId));
        if (!round.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.round(roundId);
        }
        return scoreRepository.findByRoundId(roundId).stream()
            .map(ScoreResponse::from)
            .toList();
    }

    @Transactional
    public void deleteAllByCompetition(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        scoreRepository.deleteByCompetitionId(competitionId);
    }
}
