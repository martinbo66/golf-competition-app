package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateCompetitionRequest;
import com.golfcomp.api.dto.request.UpdateCompetitionRequest;
import com.golfcomp.api.dto.response.CompetitionResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Competition;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.repository.CompetitionRepository;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.service.CompetitionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompetitionServiceTest {

    @Mock
    private CompetitionRepository competitionRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private CompetitionService competitionService;

    private Competition competition;
    private Organization organization;
    private UUID competitionId;
    private UUID organizationId;

    @BeforeEach
    void setUp() {
        competitionId = UUID.randomUUID();
        organizationId = CompetitionService.DEFAULT_ORGANIZATION_ID;
        organization = Organization.builder()
            .id(organizationId)
            .name("Default Org")
            .slug("default-org")
            .build();
        competition = Competition.builder()
            .id(competitionId)
            .organization(organization)
            .name("2026 Bathe Golf")
            .startDate(LocalDate.of(2026, 6, 1))
            .endDate(LocalDate.of(2026, 6, 5))
            .location("Myrtle Beach")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    @Test
    @DisplayName("create - saves competition and returns response")
    void create_savesAndReturnsResponse() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(competitionRepository.save(any(Competition.class))).thenReturn(competition);
        CreateCompetitionRequest request = new CreateCompetitionRequest(
            "2026 Bathe Golf", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5), "Myrtle Beach"
        );

        CompetitionResponse response = competitionService.create(organizationId, request);

        assertNotNull(response);
        assertEquals("2026 Bathe Golf", response.name());
        verify(competitionRepository).save(any(Competition.class));
    }

    @Test
    @DisplayName("findAll - returns all competitions as responses")
    void findAll_returnsAllCompetitions() {
        when(organizationRepository.existsById(organizationId)).thenReturn(true);
        when(competitionRepository.findByOrganizationIdOrderByStartDateDesc(organizationId)).thenReturn(List.of(competition));

        List<CompetitionResponse> result = competitionService.findAll(organizationId);

        assertEquals(1, result.size());
        assertEquals(competitionId, result.get(0).id());
    }

    @Test
    @DisplayName("findById - returns competition when found")
    void findById_returnsCompetitionWhenFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));

        CompetitionResponse response = competitionService.findById(organizationId, competitionId);

        assertEquals(competitionId, response.id());
    }

    @Test
    @DisplayName("findById - throws ResourceNotFoundException when not found")
    void findById_throwsWhenNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> competitionService.findById(organizationId, competitionId));
    }

    @Test
    @DisplayName("update - updates competition fields and returns response")
    void update_updatesAndReturnsResponse() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));
        when(competitionRepository.save(any(Competition.class))).thenReturn(competition);
        UpdateCompetitionRequest request = new UpdateCompetitionRequest(
            "Updated Name", LocalDate.of(2026, 6, 2), LocalDate.of(2026, 6, 6), "New Location"
        );

        CompetitionResponse response = competitionService.update(organizationId, competitionId, request);

        assertNotNull(response);
        verify(competitionRepository).save(competition);
    }

    @Test
    @DisplayName("update - throws ResourceNotFoundException when not found")
    void update_throwsWhenNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());
        UpdateCompetitionRequest request = new UpdateCompetitionRequest(
            "Name", LocalDate.now(), LocalDate.now().plusDays(1), null
        );

        assertThrows(ResourceNotFoundException.class,
            () -> competitionService.update(organizationId, competitionId, request));
    }

    @Test
    @DisplayName("delete - deletes competition when found")
    void delete_deletesWhenFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.of(competition));

        competitionService.delete(organizationId, competitionId);

        verify(competitionRepository).deleteById(competitionId);
    }

    @Test
    @DisplayName("delete - throws ResourceNotFoundException when not found")
    void delete_throwsWhenNotFound() {
        when(competitionRepository.findById(competitionId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> competitionService.delete(organizationId, competitionId));
    }
}
