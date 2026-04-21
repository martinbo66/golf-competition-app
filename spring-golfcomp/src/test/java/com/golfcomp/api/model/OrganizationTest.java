package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OrganizationTest {

    @Test
    @DisplayName("Should create Organization using builder")
    void shouldCreateOrganizationUsingBuilder() {
        Organization org = Organization.builder()
                .name("Summer Golf Club")
                .slug("summer-golf-club")
                .build();

        assertEquals("Summer Golf Club", org.getName());
        assertEquals("summer-golf-club", org.getSlug());
        assertNull(org.getId());
        assertNull(org.getCreatedAt());
    }

    @Test
    @DisplayName("Should set both timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Organization org = Organization.builder()
                .name("Test Club")
                .slug("test-club")
                .build();

        org.onCreate();

        assertNotNull(org.getCreatedAt());
        assertNotNull(org.getUpdatedAt());
        assertEquals(org.getCreatedAt(), org.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update updatedAt but not createdAt on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Organization org = Organization.builder()
                .name("Test Club")
                .slug("test-club")
                .build();
        org.onCreate();
        LocalDateTime originalCreatedAt = org.getCreatedAt();

        org.onUpdate();

        assertEquals(originalCreatedAt, org.getCreatedAt());
        assertTrue(org.getUpdatedAt().isAfter(originalCreatedAt)
                || org.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Organization with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Organization org = new Organization();

        assertNull(org.getId());
        assertNull(org.getName());
        assertNull(org.getSlug());
    }

    @Test
    @DisplayName("Should create Organization with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        Organization org = new Organization(id, "Test Club", "test-club", now, now);

        assertEquals(id, org.getId());
        assertEquals("Test Club", org.getName());
        assertEquals("test-club", org.getSlug());
        assertEquals(now, org.getCreatedAt());
        assertEquals(now, org.getUpdatedAt());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Organization org = new Organization();
        org.setName("Updated Club");
        org.setSlug("updated-club");

        assertEquals("Updated Club", org.getName());
        assertEquals("updated-club", org.getSlug());
    }
}
