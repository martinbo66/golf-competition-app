package com.golfcomp.api.controller;

import com.golfcomp.api.dto.request.CreateOrganizationRequest;
import com.golfcomp.api.dto.request.UpdateOrganizationRequest;
import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.dto.response.OrganizationResponse;
import com.golfcomp.api.service.OrganizationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Organizations", description = "Manage organizations")
@RestController
@RequestMapping("/api/v1/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrganizationResponse>> create(
            @RequestBody @Valid CreateOrganizationRequest request) {
        OrganizationResponse response = organizationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganizationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(organizationService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrganizationResponse>> update(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateOrganizationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        organizationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
