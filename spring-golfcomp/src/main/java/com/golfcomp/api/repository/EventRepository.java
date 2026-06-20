package com.golfcomp.api.repository;

import com.golfcomp.api.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Event entities.
 */
@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findByCompetitionIdOrderByEventDateAsc(UUID competitionId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Event e WHERE e.competition.id = :competitionId")
    void deleteByCompetitionId(@Param("competitionId") UUID competitionId);
}
