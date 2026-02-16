package com.golfcomp.api.repository;

import com.golfcomp.api.model.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Competition entities.
 * Provides standard CRUD operations via JpaRepository.
 */
@Repository
public interface CompetitionRepository extends JpaRepository<Competition, UUID> {
}
