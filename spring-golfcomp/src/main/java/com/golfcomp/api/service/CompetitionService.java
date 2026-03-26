package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.request.UpdateCompetitionRequest;
import com.golfcomp.api.dto.response.CompetitionResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CompetitionService {

    public static final UUID DEFAULT_ORGANIZATION_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    private final CompetitionRepository competitionRepository;
    private final OrganizationRepository organizationRepository;

    public CompetitionService(CompetitionRepository competitionRepository,
                              OrganizationRepository organizationRepository) {
        this.competitionRepository = competitionRepository;
        this.organizationRepository = organizationRepository;
    }

    @Transactional
    public CompetitionResponse create(UUID organizationId, CreateCompetitionRequest request) {
        Organization organization = organizationRepository.findById(organizationId)
            .orElseThrow(() -> ResourceNotFoundException.organization(organizationId));
        Competition competition = Competition.builder()
            .organization(organization)
            .name(request.name())
            .startDate(request.startDate())
            .endDate(request.endDate())
            .location(request.location())
            .build();
        return CompetitionResponse.from(competitionRepository.save(competition));
    }

    public List<CompetitionResponse> findAll(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw ResourceNotFoundException.organization(organizationId);
        }
        return competitionRepository.findByOrganizationIdOrderByStartDateDesc(organizationId).stream()
            .map(CompetitionResponse::from)
            .toList();
    }

    public CompetitionResponse findById(UUID organizationId, UUID id) {
        Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.competition(id));
        if (!competition.getOrganization().getId().equals(organizationId)) {
            throw ResourceNotFoundException.competition(id);
        }
        return CompetitionResponse.from(competition);
    }

    @Transactional
    public CompetitionResponse update(UUID organizationId, UUID id, UpdateCompetitionRequest request) {
        Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.competition(id));
        if (!competition.getOrganization().getId().equals(organizationId)) {
            throw ResourceNotFoundException.competition(id);
        }
        competition.setName(request.name());
        competition.setStartDate(request.startDate());
        competition.setEndDate(request.endDate());
        competition.setLocation(request.location());
        return CompetitionResponse.from(competitionRepository.save(competition));
    }

    @Transactional
    public void delete(UUID organizationId, UUID id) {
        Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.competition(id));
        if (!competition.getOrganization().getId().equals(organizationId)) {
            throw ResourceNotFoundException.competition(id);
        }
        competitionRepository.deleteById(id);
    }
}
