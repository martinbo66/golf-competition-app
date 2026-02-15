package com.golfcomp.api.repository;

import com.golfcomp.api.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Team entities.
 */
@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    List<Team> findByCompetitionId(UUID competitionId);

    boolean existsByCompetitionIdAndName(UUID competitionId, String name);

    @Modifying
    @Transactional
    @Query("DELETE FROM Team t WHERE t.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") UUID competitionId);
}
