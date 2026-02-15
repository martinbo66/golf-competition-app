package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.request.UpdateCompetitionRequest;
import com.golfcomp.api.dto.response.CompetitionResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.repository.CompetitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CompetitionService {

    private final CompetitionRepository competitionRepository;

    public CompetitionService(CompetitionRepository competitionRepository) {
        this.competitionRepository = competitionRepository;
    }

    @Transactional
    public CompetitionResponse create(CreateCompetitionRequest request) {
        Competition competition = Competition.builder()
            .name(request.name())
            .startDate(request.startDate())
            .endDate(request.endDate())
            .location(request.location())
            .build();
        return CompetitionResponse.from(competitionRepository.save(competition));
    }

    public List<CompetitionResponse> findAll() {
        return competitionRepository.findAll().stream()
            .map(CompetitionResponse::from)
            .toList();
    }

    public CompetitionResponse findById(UUID id) {
        return competitionRepository.findById(id)
            .map(CompetitionResponse::from)
            .orElseThrow(() -> ResourceNotFoundException.competition(id));
    }

    @Transactional
    public CompetitionResponse update(UUID id, UpdateCompetitionRequest request) {
        Competition competition = competitionRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.competition(id));
        competition.setName(request.name());
        competition.setStartDate(request.startDate());
        competition.setEndDate(request.endDate());
        competition.setLocation(request.location());
        return CompetitionResponse.from(competitionRepository.save(competition));
    }

    @Transactional
    public void delete(UUID id) {
        if (!competitionRepository.existsById(id)) {
            throw ResourceNotFoundException.competition(id);
        }
        competitionRepository.deleteById(id);
    }
}
