package com.golfcomp.api.repository;

import com.golfcomp.api.model.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Competition entities.
 * Provides standard CRUD operations via JpaRepository.
 */
@Repository
public interface CompetitionRepository extends JpaRepository<Competition, UUID> {

    List<Competition> findByOrganizationId(UUID organizationId);

    List<Competition> findByOrganizationIdOrderByStartDateDesc(UUID organizationId);

    boolean existsByOrganizationIdAndId(UUID organizationId, UUID id);
}
