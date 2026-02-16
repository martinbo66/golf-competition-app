package com.golfcomp.api.repository;

import com.golfcomp.api.model.Round;
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
 * Repository for Round entities.
 */
@Repository
public interface RoundRepository extends JpaRepository<Round, UUID> {

    List<Round> findByCompetitionIdOrderByRoundNumberAsc(UUID competitionId);

    Optional<Round> findByCompetitionIdAndRoundNumber(UUID competitionId, Integer roundNumber);

    @Modifying
    @Transactional
    @Query("DELETE FROM Round r WHERE r.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") UUID competitionId);
}
