package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.dto.request.GenerateTeamsRequest;
import com.golfcomp.api.dto.request.UpdateTeamRequest;
import com.golfcomp.api.dto.response.TeamResponse;
import com.golfcomp.api.exception.BusinessRuleException;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final CompetitionRepository competitionRepository;
    private final PlayerRepository playerRepository;

    public TeamService(TeamRepository teamRepository, CompetitionRepository competitionRepository,
                       PlayerRepository playerRepository) {
        this.teamRepository = teamRepository;
        this.competitionRepository = competitionRepository;
        this.playerRepository = playerRepository;
    }

    @Transactional
    public TeamResponse create(UUID competitionId, CreateTeamRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> ResourceNotFoundException.competition(competitionId));
        if (teamRepository.existsByCompetitionIdAndName(competitionId, request.name())) {
            throw new BusinessRuleException("DUPLICATE_TEAM_NAME",
                "Team name '" + request.name() + "' already exists in this competition");
        }
        Team team = Team.builder()
            .competition(competition)
            .name(request.name())
            .logoUrl(request.logoUrl())
            .build();
        return TeamResponse.from(teamRepository.save(team));
    }

    public List<TeamResponse> findByCompetition(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        return teamRepository.findByCompetitionId(competitionId).stream()
            .map(TeamResponse::from)
            .toList();
    }

    public TeamResponse findById(UUID competitionId, UUID teamId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> ResourceNotFoundException.team(teamId));
        if (!team.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.team(teamId);
        }
        return TeamResponse.from(team);
    }

    @Transactional
    public TeamResponse update(UUID competitionId, UUID teamId, UpdateTeamRequest request) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> ResourceNotFoundException.team(teamId));
        if (!team.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.team(teamId);
        }
        if (!team.getName().equals(request.name())
                && teamRepository.existsByCompetitionIdAndName(competitionId, request.name())) {
            throw new BusinessRuleException("DUPLICATE_TEAM_NAME",
                "Team name '" + request.name() + "' already exists in this competition");
        }
        team.setName(request.name());
        team.setLogoUrl(request.logoUrl());
        return TeamResponse.from(teamRepository.save(team));
    }

    @Transactional
    public void delete(UUID competitionId, UUID teamId) {
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> ResourceNotFoundException.team(teamId));
        if (!team.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.team(teamId);
        }
        teamRepository.deleteById(teamId);
    }

    @Transactional
    public void deleteAll(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        teamRepository.deleteByCompetitionId(competitionId);
    }

    /**
     * Generates N teams using the snake draft algorithm: players sorted by talent (A→B→C→D),
     * then distributed round-robin with alternating direction each round for balance.
     * Clears existing teams and unassigns all players before creating new teams.
     */
    @Transactional
    public List<TeamResponse> generateTeams(UUID competitionId, GenerateTeamsRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> ResourceNotFoundException.competition(competitionId));

        List<Player> players = playerRepository.findByCompetitionIdOrderByTalentRatingAsc(competitionId);
        int n = request.numberOfTeams();
        if (players.size() < n) {
            throw new BusinessRuleException("INSUFFICIENT_PLAYERS",
                "Not enough players to generate teams: need at least " + n + ", have " + players.size());
        }

        playerRepository.unassignAllByCompetitionId(competitionId);
        teamRepository.deleteByCompetitionId(competitionId);

        List<Team> teams = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            Team team = Team.builder()
                .competition(competition)
                .name("Team " + i)
                .build();
            teams.add(teamRepository.save(team));
        }

        for (int i = 0; i < players.size(); i++) {
            int teamIndex = snakeDraftTeamIndex(i, n);
            Player p = players.get(i);
            p.setTeam(teams.get(teamIndex));
            playerRepository.save(p);
        }

        return teams.stream().map(TeamResponse::from).toList();
    }

    /**
     * Snake draft: round 0 → teams 0,1,...,n-1; round 1 → n-1,...,1,0; round 2 → 0,1,...; etc.
     */
    private static int snakeDraftTeamIndex(int pickIndex, int numberOfTeams) {
        int round = pickIndex / numberOfTeams;
        int positionInRound = pickIndex % numberOfTeams;
        return (round % 2 == 0)
            ? positionInRound
            : (numberOfTeams - 1 - positionInRound);
    }
}
