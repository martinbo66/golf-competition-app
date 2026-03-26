package com.golfcomp.api.service;

import com.golfcomp.api.dto.request.CreateOrganizationRequest;
import com.golfcomp.api.dto.request.UpdateOrganizationRequest;
import com.golfcomp.api.dto.response.OrganizationResponse;
import com.golfcomp.api.exception.ResourceNotFoundException;
import com.golfcomp.api.model.Organization;
import com.golfcomp.api.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class OrganizationService {

    private static final UUID DEFAULT_ORGANIZATION_ID = UUID.fromString("a0000000-0000-0000-0000-000000000001");

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public List<OrganizationResponse> findAll() {
        return organizationRepository.findAll().stream()
            .map(OrganizationResponse::from)
            .toList();
    }

    public OrganizationResponse findById(UUID id) {
        return organizationRepository.findById(id)
            .map(OrganizationResponse::from)
            .orElseThrow(() -> ResourceNotFoundException.organization(id));
    }

    public OrganizationResponse findBySlug(String slug) {
        return organizationRepository.findBySlug(slug)
            .map(OrganizationResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("Organization not found with slug: " + slug));
    }

    @Transactional
    public OrganizationResponse create(CreateOrganizationRequest request) {
        if (organizationRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Organization name already exists");
        }
        if (organizationRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Organization slug already exists");
        }
        Organization organization = Organization.builder()
            .name(request.name())
            .slug(request.slug())
            .build();
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    @Transactional
    public OrganizationResponse update(UUID id, UpdateOrganizationRequest request) {
        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.organization(id));
        if (!organization.getName().equals(request.name()) && organizationRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("Organization name already exists");
        }
        if (!organization.getSlug().equals(request.slug()) && organizationRepository.existsBySlug(request.slug())) {
            throw new IllegalArgumentException("Organization slug already exists");
        }
        organization.setName(request.name());
        organization.setSlug(request.slug());
        return OrganizationResponse.from(organizationRepository.save(organization));
    }

    @Transactional
    public void delete(UUID id) {
        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.organization(id));
        if (DEFAULT_ORGANIZATION_ID.equals(organization.getId())) {
            throw new IllegalStateException("Cannot delete the default organization");
        }
        organizationRepository.deleteById(id);
    }
}
