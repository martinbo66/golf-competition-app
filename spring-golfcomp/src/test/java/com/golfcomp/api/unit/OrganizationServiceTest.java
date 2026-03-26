package com.golfcomp.api.unit;

import com.golfcomp.api.dto.request.CreateOrganizationRequest;
import com.golfcomp.api.dto.request.UpdateOrganizationRequest;
import com.golfcomp.api.dto.response.OrganizationResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.repository.OrganizationRepository;
import com.golfcomp.api.service.OrganizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    private static final UUID DEFAULT_ORGANIZATION_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private OrganizationService organizationService;

    private Organization organization;
    private UUID organizationId;

    @BeforeEach
    void setUp() {
        organizationId = UUID.randomUUID();
        organization = Organization.builder()
            .id(organizationId)
            .name("Bathe Golf Club")
            .slug("bathe-golf-club")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    // --- findAll ---

    @Test
    @DisplayName("findAll - returns all organizations")
    void findAll_returnsAllOrganizations() {
        Organization second = Organization.builder()
            .id(UUID.randomUUID())
            .name("Myrtle Beach Golf")
            .slug("myrtle-beach-golf")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        when(organizationRepository.findAll()).thenReturn(List.of(organization, second));

        List<OrganizationResponse> result = organizationService.findAll();

        assertEquals(2, result.size());
        assertEquals("Bathe Golf Club", result.get(0).name());
        assertEquals("bathe-golf-club", result.get(0).slug());
        assertEquals("Myrtle Beach Golf", result.get(1).name());
        assertEquals("myrtle-beach-golf", result.get(1).slug());
    }

    // --- findById ---

    @Test
    @DisplayName("findById - returns organization when found")
    void findById_returnsOrganizationWhenFound() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));

        OrganizationResponse response = organizationService.findById(organizationId);

        assertEquals(organizationId, response.id());
        assertEquals("Bathe Golf Club", response.name());
        assertEquals("bathe-golf-club", response.slug());
    }

    @Test
    @DisplayName("findById - throws ResourceNotFoundException when not found")
    void findById_throwsWhenNotFound() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> organizationService.findById(organizationId));
    }

    // --- findBySlug ---

    @Test
    @DisplayName("findBySlug - returns organization when found")
    void findBySlug_returnsOrganizationWhenFound() {
        when(organizationRepository.findBySlug("bathe-golf-club")).thenReturn(Optional.of(organization));

        OrganizationResponse response = organizationService.findBySlug("bathe-golf-club");

        assertEquals(organizationId, response.id());
        assertEquals("Bathe Golf Club", response.name());
        assertEquals("bathe-golf-club", response.slug());
    }

    @Test
    @DisplayName("findBySlug - throws ResourceNotFoundException when not found")
    void findBySlug_throwsWhenNotFound() {
        when(organizationRepository.findBySlug("unknown-slug")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> organizationService.findBySlug("unknown-slug"));
    }

    // --- create ---

    @Test
    @DisplayName("create - saves and returns response")
    void create_savesAndReturnsResponse() {
        when(organizationRepository.existsByName("Bathe Golf Club")).thenReturn(false);
        when(organizationRepository.existsBySlug("bathe-golf-club")).thenReturn(false);
        when(organizationRepository.save(any(Organization.class))).thenReturn(organization);
        CreateOrganizationRequest request = new CreateOrganizationRequest("Bathe Golf Club", "bathe-golf-club");

        OrganizationResponse response = organizationService.create(request);

        assertNotNull(response);
        assertEquals("Bathe Golf Club", response.name());
        assertEquals("bathe-golf-club", response.slug());
        verify(organizationRepository).save(any(Organization.class));
    }

    @Test
    @DisplayName("create - throws IllegalArgumentException when name already exists")
    void create_throwsWhenNameAlreadyExists() {
        when(organizationRepository.existsByName("Bathe Golf Club")).thenReturn(true);
        CreateOrganizationRequest request = new CreateOrganizationRequest("Bathe Golf Club", "bathe-golf-club");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> organizationService.create(request));
        assertEquals("Organization name already exists", ex.getMessage());
    }

    @Test
    @DisplayName("create - throws IllegalArgumentException when slug already exists")
    void create_throwsWhenSlugAlreadyExists() {
        when(organizationRepository.existsByName("Bathe Golf Club")).thenReturn(false);
        when(organizationRepository.existsBySlug("bathe-golf-club")).thenReturn(true);
        CreateOrganizationRequest request = new CreateOrganizationRequest("Bathe Golf Club", "bathe-golf-club");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> organizationService.create(request));
        assertEquals("Organization slug already exists", ex.getMessage());
    }

    // --- update ---

    @Test
    @DisplayName("update - updates and returns response")
    void update_updatesAndReturnsResponse() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(organizationRepository.existsByName("Updated Club")).thenReturn(false);
        when(organizationRepository.existsBySlug("updated-club")).thenReturn(false);
        Organization updated = Organization.builder()
            .id(organizationId)
            .name("Updated Club")
            .slug("updated-club")
            .createdAt(organization.getCreatedAt())
            .updatedAt(LocalDateTime.now())
            .build();
        when(organizationRepository.save(any(Organization.class))).thenReturn(updated);
        UpdateOrganizationRequest request = new UpdateOrganizationRequest("Updated Club", "updated-club");

        OrganizationResponse response = organizationService.update(organizationId, request);

        assertNotNull(response);
        assertEquals("Updated Club", response.name());
        assertEquals("updated-club", response.slug());
        verify(organizationRepository).save(organization);
    }

    @Test
    @DisplayName("update - throws ResourceNotFoundException when not found")
    void update_throwsWhenNotFound() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.empty());
        UpdateOrganizationRequest request = new UpdateOrganizationRequest("Updated Club", "updated-club");

        assertThrows(ResourceNotFoundException.class,
            () -> organizationService.update(organizationId, request));
    }

    @Test
    @DisplayName("update - throws IllegalArgumentException when name conflicts with different org")
    void update_throwsWhenNameConflictsWithDifferentOrg() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(organizationRepository.existsByName("Conflicting Name")).thenReturn(true);
        UpdateOrganizationRequest request = new UpdateOrganizationRequest("Conflicting Name", "bathe-golf-club");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> organizationService.update(organizationId, request));
        assertEquals("Organization name already exists", ex.getMessage());
    }

    @Test
    @DisplayName("update - throws IllegalArgumentException when slug conflicts with different org")
    void update_throwsWhenSlugConflictsWithDifferentOrg() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(organizationRepository.existsBySlug("conflicting-slug")).thenReturn(true);
        // name is unchanged so existsByName check is skipped by the service
        UpdateOrganizationRequest request = new UpdateOrganizationRequest("Bathe Golf Club", "conflicting-slug");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> organizationService.update(organizationId, request));
        assertEquals("Organization slug already exists", ex.getMessage());
    }

    // --- delete ---

    @Test
    @DisplayName("delete - deletes when found and not default")
    void delete_deletesWhenFound() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));

        organizationService.delete(organizationId);

        verify(organizationRepository).deleteById(organizationId);
    }

    @Test
    @DisplayName("delete - throws ResourceNotFoundException when not found")
    void delete_throwsWhenNotFound() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> organizationService.delete(organizationId));
    }

    @Test
    @DisplayName("delete - throws IllegalStateException when deleting default organization")
    void delete_throwsWhenDeletingDefaultOrganization() {
        Organization defaultOrg = Organization.builder()
            .id(DEFAULT_ORGANIZATION_ID)
            .name("Default Organization")
            .slug("default-organization")
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        when(organizationRepository.findById(DEFAULT_ORGANIZATION_ID)).thenReturn(Optional.of(defaultOrg));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
            () -> organizationService.delete(DEFAULT_ORGANIZATION_ID));
        assertEquals("Cannot delete the default organization", ex.getMessage());
    }
}
