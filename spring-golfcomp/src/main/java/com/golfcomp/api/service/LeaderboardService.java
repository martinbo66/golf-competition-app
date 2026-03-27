package com.golfcomp.api.service;

import com.golfcomp.api.dto.response.PlayerLeaderboardEntry;
import com.golfcomp.api.dto.response.TeamLeaderboardEntry;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Score;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.ScoreRepository;
import com.golfcomp.api.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class LeaderboardService {

    private final CompetitionRepository competitionRepository;
    private final PlayerRepository playerRepository;
    private final TeamRepository teamRepository;
    private final ScoreRepository scoreRepository;

    public LeaderboardService(CompetitionRepository competitionRepository,
                              PlayerRepository playerRepository,
                              TeamRepository teamRepository,
                              ScoreRepository scoreRepository) {
        this.competitionRepository = competitionRepository;
        this.playerRepository = playerRepository;
        this.teamRepository = teamRepository;
        this.scoreRepository = scoreRepository;
    }

    public List<PlayerLeaderboardEntry> getPlayerLeaderboard(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        List<Player> players = playerRepository.findByCompetitionId(competitionId);
        List<Score> scores = scoreRepository.findByCompetitionId(competitionId);

        Map<UUID, List<Score>> scoresByPlayer = scores.stream()
            .collect(Collectors.groupingBy(s -> s.getPlayer().getId()));

        // Build unranked entries — players with scores rank above those without.
        // Within scored players, lower total is better (golf scoring).
        List<PlayerLeaderboardEntry> unranked = players.stream()
            .map(player -> {
                List<Score> playerScores = scoresByPlayer.getOrDefault(player.getId(), List.of());
                int totalScore = playerScores.stream().mapToInt(Score::getValue).sum();
                return new PlayerLeaderboardEntry(
                    0,
                    player.getId(),
                    player.getName(),
                    player.getTalentRating(),
                    player.getTeam() != null ? player.getTeam().getId() : null,
                    player.getTeam() != null ? player.getTeam().getName() : null,
                    playerScores.size(),
                    totalScore
                );
            })
            .sorted(Comparator
                .comparingInt(PlayerLeaderboardEntry::roundsPlayed).reversed()
                .thenComparingInt(PlayerLeaderboardEntry::totalScore))
            .toList();

        return assignRanks(unranked);
    }

    public List<TeamLeaderboardEntry> getTeamLeaderboard(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        List<Team> teams = teamRepository.findByCompetitionId(competitionId);
        List<PlayerLeaderboardEntry> playerEntries = getPlayerLeaderboard(competitionId);

        Map<UUID, List<PlayerLeaderboardEntry>> entriesByTeam = playerEntries.stream()
            .filter(e -> e.teamId() != null)
            .collect(Collectors.groupingBy(PlayerLeaderboardEntry::teamId));

        List<TeamLeaderboardEntry> unranked = teams.stream()
            .map(team -> {
                List<PlayerLeaderboardEntry> teamPlayers =
                    entriesByTeam.getOrDefault(team.getId(), List.of());
                int totalScore = teamPlayers.stream()
                    .mapToInt(PlayerLeaderboardEntry::totalScore)
                    .sum();
                return new TeamLeaderboardEntry(
                    0,
                    team.getId(),
                    team.getName(),
                    teamPlayers.size(),
                    totalScore,
                    teamPlayers
                );
            })
            .sorted(Comparator.comparingInt(TeamLeaderboardEntry::totalScore))
            .toList();

        return assignTeamRanks(unranked);
    }

    private List<PlayerLeaderboardEntry> assignRanks(List<PlayerLeaderboardEntry> sorted) {
        List<PlayerLeaderboardEntry> ranked = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            PlayerLeaderboardEntry e = sorted.get(i);
            int rank = i + 1;
            if (i > 0) {
                PlayerLeaderboardEntry prev = ranked.get(i - 1);
                if (prev.roundsPlayed() == e.roundsPlayed() && prev.totalScore() == e.totalScore()) {
                    rank = prev.rank();
                }
            }
            ranked.add(new PlayerLeaderboardEntry(
                rank, e.playerId(), e.playerName(), e.talentRating(),
                e.teamId(), e.teamName(), e.roundsPlayed(), e.totalScore()
            ));
        }
        return ranked;
    }

    private List<TeamLeaderboardEntry> assignTeamRanks(List<TeamLeaderboardEntry> sorted) {
        List<TeamLeaderboardEntry> ranked = new ArrayList<>(sorted.size());
        for (int i = 0; i < sorted.size(); i++) {
            TeamLeaderboardEntry e = sorted.get(i);
            int rank = i + 1;
            if (i > 0 && ranked.get(i - 1).totalScore() == e.totalScore()) {
                rank = ranked.get(i - 1).rank();
            }
            ranked.add(new TeamLeaderboardEntry(
                rank, e.teamId(), e.teamName(), e.playerCount(), e.totalScore(), e.players()
            ));
        }
        return ranked;
    }
}
