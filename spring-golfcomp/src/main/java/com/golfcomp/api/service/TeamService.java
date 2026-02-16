package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.dto.request.UpdateTeamRequest;
import com.golfcomp.api.dto.response.TeamResponse;
import com.golfcomp.api.exception.BusinessRuleException;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final CompetitionRepository competitionRepository;

    public TeamService(TeamRepository teamRepository, CompetitionRepository competitionRepository) {
        this.teamRepository = teamRepository;
        this.competitionRepository = competitionRepository;
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
}
