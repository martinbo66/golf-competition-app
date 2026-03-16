package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateRoundRequest;
import com.golfcomp.api.dto.request.UpdateRoundRequest;
import com.golfcomp.api.dto.response.RoundResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Course;
import com.golfcomp.api.model.Round;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.CourseRepository;
import com.golfcomp.api.repository.RoundRepository;
import com.golfcomp.api.service.RoundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoundServiceTest {

    @Mock private RoundRepository roundRepository;
    @Mock private CompetitionRepository competitionRepository;
    @Mock private CourseRepository courseRepository;

    @InjectMocks
    private RoundService roundService;

    private Competition competition;
    private Course course;
    private Round round;
    private UUID competitionId;
    private UUID courseId;
    private UUID roundId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        courseId = UUID.randomUUID();
        roundId = UUID.randomUUID();

        competition = Competition.builder()
            .id(competitionId)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        course = Course.builder()
            .id(courseId)
            .name("Heathland")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        round = Round.builder()
            .id(roundId)
            .competition(competition)
            .course(course)
            .playDate(LocalDate.of(2026, 6, 2))
            .roundNumber(1)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("create - saves round with competition and course")
    void create_savesRound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(roundRepository.save(any(Round.class))).thenReturn(round);
        CreateRoundRequest request = new CreateRoundRequest(courseId, LocalDate.of(2026, 6, 2), 1);

        RoundResponse response = roundService.create(competitionId, request);

        assertNotNull(response);
        assertEquals(competitionId, response.competitionId());
        assertEquals(1, response.roundNumber());
    }

    @Test
    @DisplayName("create - throws when competition not found")
    void create_throwsWhenCompetitionNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());
        CreateRoundRequest request = new CreateRoundRequest(courseId, LocalDate.now(), 1);

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.create(competitionId, request));
    }

    @Test
    @DisplayName("create - throws when course not found")
    void create_throwsWhenCourseNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());
        CreateRoundRequest request = new CreateRoundRequest(courseId, LocalDate.now(), 1);

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.create(competitionId, request));
    }

    @Test
    @DisplayName("findByCompetition - returns rounds ordered by round number")
    void findByCompetition_returnsRounds() {
        when(competitionRepository.existsById(competitionId)).thenReturn(true);
        when(roundRepository.findByCompetitionIdOrderByRoundNumberAsc(competitionId))
            .thenReturn(List.of(round));

        List<RoundResponse> result = roundService.findByCompetition(competitionId);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).roundNumber());
    }

    @Test
    @DisplayName("findById - throws when round belongs to different competition")
    void findById_throwsWhenWrongCompetition() {
        UUID otherCompetitionId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.findById(otherCompetitionId, roundId));
    }

    @Test
    @DisplayName("delete - removes round when it belongs to competition")
    void delete_removesRound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        roundService.delete(competitionId, roundId);

        verify(roundRepository).deleteById(roundId);
    }

    @Test
    @DisplayName("findByCompetition - throws when competition not found")
    void findByCompetition_throwsWhenNotFound() {
        when(competitionRepository.existsById(competitionId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.findByCompetition(competitionId));
    }

    @Test
    @DisplayName("findById - returns round when found in correct competition")
    void findById_returnsRoundWhenFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        RoundResponse response = roundService.findById(competitionId, roundId);

        assertNotNull(response);
        assertEquals(roundId, response.id());
        assertEquals(1, response.roundNumber());
    }

    @Test
    @DisplayName("findById - throws when round not found")
    void findById_throwsWhenNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.findById(competitionId, roundId));
    }

    @Test
    @DisplayName("update - updates course and date when round belongs to competition")
    void update_updatesRound() {
        UUID newCourseId = UUID.randomUUID();
        Course newCourse = Course.builder().id(newCourseId).name("Moorland")
            .createdAt(Instant.now()).updatedAt(Instant.now()).build();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(courseRepository.findById(newCourseId)).thenReturn(Optional.of(newCourse));
        when(roundRepository.save(any(Round.class))).thenReturn(round);
        UpdateRoundRequest request = new UpdateRoundRequest(newCourseId, LocalDate.of(2026, 7, 1));

        RoundResponse response = roundService.update(competitionId, roundId, request);

        assertNotNull(response);
        verify(roundRepository).save(round);
    }

    @Test
    @DisplayName("update - throws when round not found")
    void update_throwsWhenNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());
        UpdateRoundRequest request = new UpdateRoundRequest(courseId, LocalDate.of(2026, 7, 1));

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.update(competitionId, roundId, request));
    }

    @Test
    @DisplayName("update - throws when round belongs to different competition")
    void update_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        UpdateRoundRequest request = new UpdateRoundRequest(courseId, LocalDate.of(2026, 7, 1));

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.update(otherId, roundId, request));
    }

    @Test
    @DisplayName("update - throws when new course not found")
    void update_throwsWhenCourseNotFound() {
        UUID badCourseId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));
        when(courseRepository.findById(badCourseId)).thenReturn(Optional.empty());
        UpdateRoundRequest request = new UpdateRoundRequest(badCourseId, LocalDate.of(2026, 7, 1));

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.update(competitionId, roundId, request));
    }

    @Test
    @DisplayName("delete - throws when round not found")
    void delete_throwsWhenNotFound() {
        when(roundRepository.findById(roundId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.delete(competitionId, roundId));
    }

    @Test
    @DisplayName("delete - throws when round belongs to different competition")
    void delete_throwsWhenWrongCompetition() {
        UUID otherId = UUID.randomUUID();
        when(roundRepository.findById(roundId)).thenReturn(Optional.of(round));

        assertThrows(ResourceNotFoundException.class,
            () -> roundService.delete(otherId, roundId));
    }
}
