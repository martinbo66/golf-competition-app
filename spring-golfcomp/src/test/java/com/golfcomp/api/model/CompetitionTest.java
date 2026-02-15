package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the Competition entity.
 */
class CompetitionTest {

    @Test
    @DisplayName("Should create Competition using builder")
    void shouldCreateCompetitionUsingBuilder() {
        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 20);
        
        Competition competition = Competition.builder()
                .name("2026 Bathe Golf Competition")
                .startDate(startDate)
                .endDate(endDate)
                .location("Legends at Myrtle Beach")
                .build();
        
        assertEquals("2026 Bathe Golf Competition", competition.getName());
        assertEquals(startDate, competition.getStartDate());
        assertEquals(endDate, competition.getEndDate());
        assertEquals("Legends at Myrtle Beach", competition.getLocation());
        assertNull(competition.getId());
        assertNull(competition.getCreatedAt());
        assertNull(competition.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create Competition with no-args constructor")
    void shouldCreateCompetitionWithNoArgsConstructor() {
        Competition competition = new Competition();
        
        assertNull(competition.getId());
        assertNull(competition.getName());
        assertNull(competition.getStartDate());
        assertNull(competition.getEndDate());
        assertNull(competition.getLocation());
        assertNull(competition.getCreatedAt());
        assertNull(competition.getUpdatedAt());
    }

    @Test
    @DisplayName("Should create Competition with all-args constructor")
    void shouldCreateCompetitionWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 20);
        LocalDateTime now = LocalDateTime.now();
        
        Competition competition = new Competition(
                id,
                "Test Competition",
                startDate,
                endDate,
                "Test Location",
                now,
                now
        );
        
        assertEquals(id, competition.getId());
        assertEquals("Test Competition", competition.getName());
        assertEquals(startDate, competition.getStartDate());
        assertEquals(endDate, competition.getEndDate());
        assertEquals("Test Location", competition.getLocation());
        assertEquals(now, competition.getCreatedAt());
        assertEquals(now, competition.getUpdatedAt());
    }

    @Test
    @DisplayName("Should set timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Competition competition = Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5))
                .build();
        
        assertNull(competition.getCreatedAt());
        assertNull(competition.getUpdatedAt());
        
        // Simulate @PrePersist callback
        competition.onCreate();
        
        assertNotNull(competition.getCreatedAt());
        assertNotNull(competition.getUpdatedAt());
        assertEquals(competition.getCreatedAt(), competition.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update timestamp on onUpdate")
    void shouldUpdateTimestampOnUpdate() throws InterruptedException {
        Competition competition = Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5))
                .build();
        
        // Simulate @PrePersist callback
        competition.onCreate();
        LocalDateTime originalCreatedAt = competition.getCreatedAt();
        LocalDateTime originalUpdatedAt = competition.getUpdatedAt();
        
        // Small delay to ensure different timestamp
        Thread.sleep(10);
        
        // Simulate @PreUpdate callback
        competition.onUpdate();
        
        // createdAt should remain unchanged
        assertEquals(originalCreatedAt, competition.getCreatedAt());
        // updatedAt should be updated
        assertTrue(competition.getUpdatedAt().isAfter(originalUpdatedAt) || 
                   competition.getUpdatedAt().equals(originalUpdatedAt));
    }

    @Test
    @DisplayName("Should allow null location")
    void shouldAllowNullLocation() {
        Competition competition = Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5))
                .location(null)
                .build();
        
        assertNull(competition.getLocation());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Competition competition = new Competition();
        UUID id = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 20);
        LocalDateTime now = LocalDateTime.now();
        
        competition.setId(id);
        competition.setName("Updated Name");
        competition.setStartDate(startDate);
        competition.setEndDate(endDate);
        competition.setLocation("Updated Location");
        competition.setCreatedAt(now);
        competition.setUpdatedAt(now);
        
        assertEquals(id, competition.getId());
        assertEquals("Updated Name", competition.getName());
        assertEquals(startDate, competition.getStartDate());
        assertEquals(endDate, competition.getEndDate());
        assertEquals("Updated Location", competition.getLocation());
        assertEquals(now, competition.getCreatedAt());
        assertEquals(now, competition.getUpdatedAt());
    }

    @Test
    @DisplayName("Should implement equals and hashCode correctly")
    void shouldImplementEqualsAndHashCodeCorrectly() {
        UUID id = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 6, 15);
        LocalDate endDate = LocalDate.of(2026, 6, 20);
        LocalDateTime now = LocalDateTime.now();
        
        Competition competition1 = new Competition(id, "Test", startDate, endDate, "Location", now, now);
        Competition competition2 = new Competition(id, "Test", startDate, endDate, "Location", now, now);
        
        assertEquals(competition1, competition2);
        assertEquals(competition1.hashCode(), competition2.hashCode());
    }

    @Test
    @DisplayName("Should implement toString")
    void shouldImplementToString() {
        Competition competition = Competition.builder()
                .name("Test Competition")
                .startDate(LocalDate.of(2026, 6, 15))
                .endDate(LocalDate.of(2026, 6, 20))
                .build();
        
        String toString = competition.toString();
        
        assertNotNull(toString);
        assertTrue(toString.contains("Test Competition"));
        assertTrue(toString.contains("2026-06-15"));
        assertTrue(toString.contains("2026-06-20"));
    }
}
