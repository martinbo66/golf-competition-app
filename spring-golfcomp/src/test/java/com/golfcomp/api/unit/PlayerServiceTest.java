package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.AssignPlayerRequest;
import com.golfcomp.api.dto.request.CreatePlayerRequest;
import com.golfcomp.api.dto.request.UpdatePlayerRequest;
import com.golfcomp.api.dto.response.PlayerResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.TeamRepository;
import com.golfcomp.api.service.PlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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
class PlayerServiceTest {

    @Mock private PlayerRepository playerRepository;
    @Mock private CompetitionRepository competitionRepository;
    @Mock private TeamRepository teamRepository;

    @InjectMocks
    private PlayerService playerService;

    private Competition competition;
    private Team team;
    private Player player;
    private UUID competitionId;
    private UUID teamId;
    private UUID playerId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        teamId = UUID.randomUUID();
        playerId = UUID.randomUUID();

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
            .name("Team Alpha")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        player = Player.builder()
            .id(playerId)
            .competition(competition)
            .name("Erik Bathe")
            .talentRating(TalentRating.A)
            .entryFee(BigDecimal.valueOf(100))
            .winnings(BigDecimal.ZERO)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("create - saves player with default BigDecimal fields")
    void create_savesPlayerWithDefaults() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(playerRepository.save(any(Player.class))).thenReturn(player);
        CreatePlayerRequest request = new CreatePlayerRequest("Erik Bathe", TalentRating.A, null, null);

        PlayerResponse response = playerService.create(competitionId, request);

        assertNotNull(response);
        assertEquals("Erik Bathe", response.name());
        assertEquals(TalentRating.A, response.talentRating());
    }

    @Test
    @DisplayName("create - throws when competition not found")
    void create_throwsWhenCompetitionNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.create(competitionId,
                new CreatePlayerRequest("Erik", TalentRating.B, null, null)));
    }

    @Test
    @DisplayName("findByCompetition - returns all players in competition")
    void findByCompetition_returnsPlayers() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(playerRepository.findByCompetitionId(competitionId)).thenReturn(List.of(player));

        List<PlayerResponse> result = playerService.findByCompetition(competitionId);

        assertEquals(1, result.size());
        assertEquals(playerId, result.get(0).id());
    }

    @Test
    @DisplayName("assignToTeam - sets team on player")
    void assignToTeam_setsTeam() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(playerRepository.save(player)).thenReturn(player);
        AssignPlayerRequest request = new AssignPlayerRequest(teamId);

        playerService.assignToTeam(competitionId, playerId, request);

        assertEquals(team, player.getTeam());
        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("assignToTeam - throws when team belongs to different competition")
    void assignToTeam_throwsWhenTeamInDifferentCompetition() {
        UUID otherCompId = UUID.randomUUID();
        Competition otherComp = Competition.builder()
            .id(otherCompId)
            .name("Other")
            .startDate(LocalDate.now())
            .endDate(LocalDate.now().plusDays(1))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        Team otherTeam = Team.builder()
            .id(teamId)
            .competition(otherComp)
            .name("Other Team")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(otherTeam));
        AssignPlayerRequest request = new AssignPlayerRequest(teamId);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.assignToTeam(competitionId, playerId, request));
    }

    @Test
    @DisplayName("unassignFromTeam - sets team to null")
    void unassignFromTeam_clearsTeam() {
        player.setTeam(team);
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(playerRepository.save(player)).thenReturn(player);

        playerService.unassignFromTeam(competitionId, playerId);

        assertNull(player.getTeam());
        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("delete - deletes player when found in competition")
    void delete_deletesPlayer() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        playerService.delete(competitionId, playerId);

        verify(playerRepository).deleteById(playerId);
    }

    @Test
    @DisplayName("findById - throws when player belongs to different competition")
    void findById_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.findById(otherId, playerId));
    }

    @Test
    @DisplayName("findById - returns player when found in correct competition")
    void findById_returnsPlayerWhenFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        PlayerResponse response = playerService.findById(competitionId, playerId);

        assertNotNull(response);
        assertEquals(playerId, response.id());
        assertEquals("Erik Bathe", response.name());
    }

    @Test
    @DisplayName("findById - throws when player not found")
    void findById_throwsWhenNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.findById(competitionId, playerId));
    }

    @Test
    @DisplayName("findByCompetition - throws when competition not found")
    void findByCompetition_throwsWhenCompetitionNotFound() {
        when(competitionRepository.existsById(competitionId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.findByCompetition(competitionId));
    }

    @Test
    @DisplayName("create - uses provided entryFee and winnings when non-null")
    void create_usesProvidedEntryFeeAndWinnings() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(playerRepository.save(any(Player.class))).thenReturn(player);
        CreatePlayerRequest request = new CreatePlayerRequest(
            "Erik Bathe", TalentRating.A, BigDecimal.valueOf(150), BigDecimal.valueOf(50));

        playerService.create(competitionId, request);

        verify(playerRepository).save(argThat(p ->
            p.getEntryFee().compareTo(BigDecimal.valueOf(150)) == 0
            && p.getWinnings().compareTo(BigDecimal.valueOf(50)) == 0));
    }

    @Test
    @DisplayName("update - updates player fields and returns response")
    void update_updatesPlayerFields() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(playerRepository.save(player)).thenReturn(player);
        UpdatePlayerRequest request = new UpdatePlayerRequest(
            "Updated Name", TalentRating.B, BigDecimal.valueOf(200), BigDecimal.valueOf(75));

        PlayerResponse response = playerService.update(competitionId, playerId, request);

        assertNotNull(response);
        assertEquals("Updated Name", player.getName());
        assertEquals(TalentRating.B, player.getTalentRating());
        assertEquals(BigDecimal.valueOf(200), player.getEntryFee());
        assertEquals(BigDecimal.valueOf(75), player.getWinnings());
        verify(playerRepository).save(player);
    }

    @Test
    @DisplayName("update - skips null entryFee and winnings")
    void update_skipsNullOptionalFields() {
        BigDecimal originalFee = player.getEntryFee();
        BigDecimal originalWinnings = player.getWinnings();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(playerRepository.save(player)).thenReturn(player);
        UpdatePlayerRequest request = new UpdatePlayerRequest(
            "Updated Name", TalentRating.C, null, null);

        playerService.update(competitionId, playerId, request);

        assertEquals(originalFee, player.getEntryFee());
        assertEquals(originalWinnings, player.getWinnings());
    }

    @Test
    @DisplayName("update - throws when player not found")
    void update_throwsWhenNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());
        UpdatePlayerRequest request = new UpdatePlayerRequest(
            "Name", TalentRating.A, null, null);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.update(competitionId, playerId, request));
    }

    @Test
    @DisplayName("update - throws when player belongs to different competition")
    void update_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        UpdatePlayerRequest request = new UpdatePlayerRequest(
            "Name", TalentRating.A, null, null);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.update(otherId, playerId, request));
    }

    @Test
    @DisplayName("assignToTeam - throws when player not found")
    void assignToTeam_throwsWhenPlayerNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());
        AssignPlayerRequest request = new AssignPlayerRequest(teamId);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.assignToTeam(competitionId, playerId, request));
    }

    @Test
    @DisplayName("assignToTeam - throws when player belongs to different competition")
    void assignToTeam_throwsWhenPlayerInDifferentCompetition() {
        UUID otherId = UUID.randomUUID();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        AssignPlayerRequest request = new AssignPlayerRequest(teamId);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.assignToTeam(otherId, playerId, request));
    }

    @Test
    @DisplayName("assignToTeam - throws when team not found")
    void assignToTeam_throwsWhenTeamNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));
        when(teamRepository.findById(teamId)).thenReturn(Optional.empty());
        AssignPlayerRequest request = new AssignPlayerRequest(teamId);

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.assignToTeam(competitionId, playerId, request));
    }

    @Test
    @DisplayName("unassignFromTeam - throws when player not found")
    void unassignFromTeam_throwsWhenPlayerNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.unassignFromTeam(competitionId, playerId));
    }

    @Test
    @DisplayName("unassignFromTeam - throws when player belongs to different competition")
    void unassignFromTeam_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.unassignFromTeam(otherId, playerId));
    }

    @Test
    @DisplayName("delete - throws when player not found")
    void delete_throwsWhenPlayerNotFound() {
        when(playerRepository.findById(playerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.delete(competitionId, playerId));
    }

    @Test
    @DisplayName("delete - throws when player belongs to different competition")
    void delete_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(playerRepository.findById(playerId)).thenReturn(Optional.of(player));

        assertThrows(ResourceNotFoundException.class,
            () -> playerService.delete(otherId, playerId));
    }
}
