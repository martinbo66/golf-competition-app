package com.golfcomp.api.integration;

import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.Team;
import com.golfcomp.api.model.TalentRating;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.PlayerRepository;
import com.golfcomp.api.repository.TeamRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("PlayerRepository Integration Tests")
class PlayerRepositoryTest {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private TeamRepository teamRepository;

    private Competition competition;
    private Team team;

    @BeforeEach
    void setUp() {
        competition = competitionRepository.save(Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.of(2026, 6, 15))
                .endDate(LocalDate.of(2026, 6, 20))
                .build());

        team = teamRepository.save(Team.builder()
                .competition(competition)
                .name("Team Alpha")
                .build());
    }

    private Player buildPlayer(String name, TalentRating rating, Team assignedTeam) {
        return Player.builder()
                .competition(competition)
                .team(assignedTeam)
                .name(name)
                .talentRating(rating)
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve a player by ID")
    void shouldSaveAndFindById() {
        Player saved = playerRepository.save(buildPlayer("Erik Bathe", TalentRating.A, null));

        assertNotNull(saved.getId());
        assertTrue(playerRepository.findById(saved.getId()).isPresent());
    }

    @Test
    @DisplayName("Should find players by competition ID")
    void shouldFindByCompetitionId() {
        playerRepository.save(buildPlayer("Player 1", TalentRating.A, null));
        playerRepository.save(buildPlayer("Player 2", TalentRating.B, null));

        List<Player> players = playerRepository.findByCompetitionId(competition.getId());
        assertEquals(2, players.size());
    }

    @Test
    @DisplayName("Should find unassigned players (no team)")
    void shouldFindUnassignedPlayers() {
        playerRepository.save(buildPlayer("Unassigned", TalentRating.A, null));
        playerRepository.save(buildPlayer("Assigned", TalentRating.B, team));

        List<Player> unassigned = playerRepository.findByCompetitionIdAndTeamIsNull(competition.getId());
        assertEquals(1, unassigned.size());
        assertEquals("Unassigned", unassigned.get(0).getName());
    }

    @Test
    @DisplayName("Should find players by competition ID and team ID")
    void shouldFindByCompetitionIdAndTeamId() {
        playerRepository.save(buildPlayer("In Team", TalentRating.A, team));
        playerRepository.save(buildPlayer("No Team", TalentRating.B, null));

        List<Player> teamPlayers = playerRepository.findByCompetitionIdAndTeamId(competition.getId(), team.getId());
        assertEquals(1, teamPlayers.size());
        assertEquals("In Team", teamPlayers.get(0).getName());
    }

    @Test
    @DisplayName("Should find players by team ID")
    void shouldFindByTeamId() {
        playerRepository.save(buildPlayer("Player A", TalentRating.A, team));
        playerRepository.save(buildPlayer("Player B", TalentRating.B, team));

        List<Player> teamPlayers = playerRepository.findByTeamId(team.getId());
        assertEquals(2, teamPlayers.size());
    }

    @Test
    @DisplayName("Should find players ordered by talent rating ascending")
    void shouldFindByCompetitionIdOrderByTalentRatingAsc() {
        playerRepository.save(buildPlayer("D Player", TalentRating.D, null));
        playerRepository.save(buildPlayer("A Player", TalentRating.A, null));
        playerRepository.save(buildPlayer("C Player", TalentRating.C, null));
        playerRepository.save(buildPlayer("B Player", TalentRating.B, null));

        List<Player> ordered = playerRepository.findByCompetitionIdOrderByTalentRatingAsc(competition.getId());
        assertEquals(4, ordered.size());
        assertEquals(TalentRating.A, ordered.get(0).getTalentRating());
        assertEquals(TalentRating.B, ordered.get(1).getTalentRating());
        assertEquals(TalentRating.C, ordered.get(2).getTalentRating());
        assertEquals(TalentRating.D, ordered.get(3).getTalentRating());
    }

    @Test
    @DisplayName("Should count players by competition ID")
    void shouldCountByCompetitionId() {
        playerRepository.save(buildPlayer("Player 1", TalentRating.A, null));
        playerRepository.save(buildPlayer("Player 2", TalentRating.B, null));

        long count = playerRepository.countByCompetitionId(competition.getId());
        assertEquals(2, count);
    }

    @Test
    @DisplayName("Should delete players by competition ID")
    void shouldDeleteByCompetitionId() {
        playerRepository.save(buildPlayer("Player 1", TalentRating.A, null));
        playerRepository.save(buildPlayer("Player 2", TalentRating.B, null));

        playerRepository.deleteByCompetitionId(competition.getId());

        List<Player> remaining = playerRepository.findByCompetitionId(competition.getId());
        assertTrue(remaining.isEmpty());
    }
}
