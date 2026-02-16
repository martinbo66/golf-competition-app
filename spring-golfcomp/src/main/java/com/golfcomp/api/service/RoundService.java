package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.response.RoundResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.RoundRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class RoundService {

    private final RoundRepository roundRepository;
    private final CompetitionRepository competitionRepository;
    private final CourseRepository courseRepository;

    public RoundService(RoundRepository roundRepository,
                        CompetitionRepository competitionRepository,
                        CourseRepository courseRepository) {
        this.roundRepository = roundRepository;
        this.competitionRepository = competitionRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public RoundResponse create(UUID competitionId, CreateRoundRequest request) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> ResourceNotFoundException.competition(competitionId));
        Course course = courseRepository.findById(request.courseId())
            .orElseThrow(() -> ResourceNotFoundException.course(request.courseId()));
        Round round = Round.builder()
            .competition(competition)
            .course(course)
            .playDate(request.playDate())
            .roundNumber(request.roundNumber())
            .build();
        return RoundResponse.from(roundRepository.save(round));
    }

    public List<RoundResponse> findByCompetition(UUID competitionId) {
        if (!competitionRepository.existsById(competitionId)) {
            throw ResourceNotFoundException.competition(competitionId);
        }
        return roundRepository.findByCompetitionIdOrderByRoundNumberAsc(competitionId).stream()
            .map(RoundResponse::from)
            .toList();
    }

    public RoundResponse findById(UUID competitionId, UUID roundId) {
        Round round = roundRepository.findById(roundId)
            .orElseThrow(() -> ResourceNotFoundException.round(roundId));
        if (!round.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.round(roundId);
        }
        return RoundResponse.from(round);
    }

    @Transactional
    public void delete(UUID competitionId, UUID roundId) {
        Round round = roundRepository.findById(roundId)
            .orElseThrow(() -> ResourceNotFoundException.round(roundId));
        if (!round.getCompetition().getId().equals(competitionId)) {
            throw ResourceNotFoundException.round(roundId);
        }
        roundRepository.deleteById(roundId);
    }
}
