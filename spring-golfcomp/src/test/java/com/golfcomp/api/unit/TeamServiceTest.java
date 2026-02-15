package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateTeamRequest;
import com.golfcomp.api.dto.request.UpdateTeamRequest;
import com.golfcomp.api.dto.response.TeamResponse;
import com.golfcomp.api.exception.BusinessRuleException;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.TeamRepository;
import com.golfcomp.api.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private CompetitionRepository competitionRepository;

    @InjectMocks
    private TeamService teamService;

    private Competition competition;
    private Team team;
    private UUID competitionId;
    private UUID teamId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        teamId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        team = Team.builder()
            .id(teamId)
            .competition(competition)
            .name("Bathe's Bombers")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("create - saves team and returns response")
    void create_savesTeam() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(teamRepository.existsByCompetitionIdAndName(competitionId, "Bathe's Bombers")).thenReturn(false);
        when(teamRepository.save(any(Team.class))).thenReturn(team);
        CreateTeamRequest request = new CreateTeamRequest("Bathe's Bombers", null);

        TeamResponse response = teamService.create(competitionId, request);

        assertNotNull(response);
        assertEquals("Bathe's Bombers", response.name());
    }

    @Test
    @DisplayName("create - throws BusinessRuleException on duplicate name")
    void create_throwsOnDuplicateName() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(teamRepository.existsByCompetitionIdAndName(competitionId, "Bathe's Bombers")).thenReturn(true);
        CreateTeamRequest request = new CreateTeamRequest("Bathe's Bombers", null);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
            () -> teamService.create(competitionId, request));
        assertEquals("DUPLICATE_TEAM_NAME", ex.getErrorCode());
    }

    @Test
    @DisplayName("create - throws ResourceNotFoundException when competition not found")
    void create_throwsWhenCompetitionNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> teamService.create(competitionId, new CreateTeamRequest("Team A", null)));
    }

    @Test
    @DisplayName("findByCompetition - returns all teams for competition")
    void findByCompetition_returnsTeams() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(teamRepository.findByCompetitionId(competitionId)).thenReturn(List.of(team));

        List<TeamResponse> result = teamService.findByCompetition(competitionId);

        assertEquals(1, result.size());
        assertEquals(teamId, result.get(0).id());
    }

    @Test
    @DisplayName("findById - throws when team belongs to different competition")
    void findById_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThrows(ResourceNotFoundException.class,
            () -> teamService.findById(otherId, teamId));
    }

    @Test
    @DisplayName("update - throws BusinessRuleException when new name already exists")
    void update_throwsOnDuplicateName() {
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamRepository.existsByCompetitionIdAndName(competitionId, "New Name")).thenReturn(true);
        UpdateTeamRequest request = new UpdateTeamRequest("New Name", null);

        assertThrows(BusinessRuleException.class,
            () -> teamService.update(competitionId, teamId, request));
    }

    @Test
    @DisplayName("update - allows updating to same name (no-op name check)")
    void update_allowsSameName() {
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(teamRepository.save(any(Team.class))).thenReturn(team);
        UpdateTeamRequest request = new UpdateTeamRequest("Bathe's Bombers", null);

        assertDoesNotThrow(() -> teamService.update(competitionId, teamId, request));
        verify(teamRepository, never()).existsByCompetitionIdAndName(any(), any());
    }

    @Test
    @DisplayName("deleteAll - bulk deletes all teams for competition")
    void deleteAll_bulkDeletes() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);

        teamService.deleteAll(competitionId);

        verify(teamRepository).deleteByCompetitionId(competitionId);
    }
}
