package com.golfcomp.api.repository;

import com.golfcomp.api.model.Player;
import com.golfcomp.api.model.TalentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Player entities.
 */
@Repository
public interface PlayerRepository extends JpaRepository<Player, UUID> {

    List<Player> findByCompetitionId(UUID competitionId);

    List<Player> findByCompetitionIdAndTeamId(UUID competitionId, UUID teamId);

    List<Player> findByTeamId(UUID teamId);

    List<Player> findByCompetitionIdAndTeamIsNull(UUID competitionId);

    List<Player> findByCompetitionIdOrderByTalentRatingAsc(UUID competitionId);

    long countByCompetitionId(UUID competitionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Player p WHERE p.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") UUID competitionId);
}
