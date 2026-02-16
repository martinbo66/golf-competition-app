package com.golfcomp.api.repository;

import com.golfcomp.api.model.Score;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Score entities.
 */
@Repository
public interface ScoreRepository extends JpaRepository<Score, UUID> {

    List<Score> findByRoundId(UUID roundId);

    List<Score> findByCompetitionId(UUID competitionId);

    List<Score> findByPlayerId(UUID playerId);

    Optional<Score> findByRoundIdAndPlayerId(UUID roundId, UUID playerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Score s WHERE s.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") UUID competitionId);
}
