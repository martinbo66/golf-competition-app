package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TeamTest {

    @Test
    @DisplayName("Should create Team using builder")
    void shouldCreateTeamUsingBuilder() {
        Team team = Team.builder()
                .name("Bathe's Bombers")
                .logoUrl("https://example.com/logo.png")
                .build();

        assertEquals("Bathe's Bombers", team.getName());
        assertEquals("https://example.com/logo.png", team.getLogoUrl());
        assertNull(team.getId());
    }

    @Test
    @DisplayName("Should set timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Team team = Team.builder().name("Test Team").build();

        team.onCreate();

        assertNotNull(team.getCreatedAt());
        assertNotNull(team.getUpdatedAt());
        assertEquals(team.getCreatedAt(), team.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update timestamp on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Team team = Team.builder().name("Test Team").build();
        team.onCreate();
        LocalDateTime originalCreatedAt = team.getCreatedAt();

        team.onUpdate();

        assertEquals(originalCreatedAt, team.getCreatedAt());
        assertTrue(team.getUpdatedAt().isAfter(originalCreatedAt)
                || team.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Team with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Team team = new Team();
        assertNull(team.getId());
        assertNull(team.getName());
        assertNull(team.getLogoUrl());
    }

    @Test
    @DisplayName("Should create Team with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        Competition comp = Competition.builder().name("Test").build();

        Team team = new Team(id, comp, "Team A", "logo.png", now, now);

        assertEquals(id, team.getId());
        assertEquals(comp, team.getCompetition());
        assertEquals("Team A", team.getName());
        assertEquals("logo.png", team.getLogoUrl());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Team team = new Team();
        team.setName("Updated");
        team.setLogoUrl("new-logo.png");

        assertEquals("Updated", team.getName());
        assertEquals("new-logo.png", team.getLogoUrl());
    }
}
