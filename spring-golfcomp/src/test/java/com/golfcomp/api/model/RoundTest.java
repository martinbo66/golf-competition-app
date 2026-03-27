package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class RoundTest {

    @Test
    @DisplayName("Should create Round using builder")
    void shouldCreateRoundUsingBuilder() {
        Round round = Round.builder()
                .playDate(LocalDate.of(2026, 6, 2))
                .roundNumber(1)
                .build();

        assertEquals(LocalDate.of(2026, 6, 2), round.getPlayDate());
        assertEquals(1, round.getRoundNumber());
        assertNull(round.getId());
    }

    @Test
    @DisplayName("Should set timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Round round = Round.builder()
                .playDate(LocalDate.now())
                .roundNumber(1)
                .build();

        round.onCreate();

        assertNotNull(round.getCreatedAt());
        assertNotNull(round.getUpdatedAt());
        assertEquals(round.getCreatedAt(), round.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update timestamp on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Round round = Round.builder()
                .playDate(LocalDate.now())
                .roundNumber(1)
                .build();
        round.onCreate();
        Instant originalCreatedAt = round.getCreatedAt();

        round.onUpdate();

        assertEquals(originalCreatedAt, round.getCreatedAt());
        assertTrue(round.getUpdatedAt().isAfter(originalCreatedAt)
                || round.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Round with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Round round = new Round();
        assertNull(round.getId());
        assertNull(round.getPlayDate());
        assertNull(round.getRoundNumber());
    }

    @Test
    @DisplayName("Should create Round with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        Competition comp = Competition.builder().name("Test").build();
        Course course = Course.builder().name("Heathland").build();

        Round round = new Round(id, comp, course, LocalDate.of(2026, 6, 2), 2, now, now);

        assertEquals(id, round.getId());
        assertEquals(comp, round.getCompetition());
        assertEquals(course, round.getCourse());
        assertEquals(LocalDate.of(2026, 6, 2), round.getPlayDate());
        assertEquals(2, round.getRoundNumber());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Round round = new Round();
        round.setPlayDate(LocalDate.of(2026, 7, 1));
        round.setRoundNumber(3);

        assertEquals(LocalDate.of(2026, 7, 1), round.getPlayDate());
        assertEquals(3, round.getRoundNumber());
    }
}
