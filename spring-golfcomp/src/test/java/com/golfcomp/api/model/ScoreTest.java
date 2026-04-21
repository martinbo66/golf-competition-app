package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ScoreTest {

    @Test
    @DisplayName("Should create Score using builder")
    void shouldCreateScoreUsingBuilder() {
        Score score = Score.builder()
                .value(72)
                .build();

        assertEquals(72, score.getValue());
        assertNull(score.getId());
        assertNull(score.getCreatedAt());
    }

    @Test
    @DisplayName("Should set both timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Score score = Score.builder().value(50).build();

        score.onCreate();

        assertNotNull(score.getCreatedAt());
        assertNotNull(score.getUpdatedAt());
        assertEquals(score.getCreatedAt(), score.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update updatedAt but not createdAt on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Score score = Score.builder().value(50).build();
        score.onCreate();
        Instant originalCreatedAt = score.getCreatedAt();

        score.onUpdate();

        assertEquals(originalCreatedAt, score.getCreatedAt());
        assertTrue(score.getUpdatedAt().isAfter(originalCreatedAt)
                || score.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Score with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Score score = new Score();

        assertNull(score.getId());
        assertNull(score.getValue());
        assertNull(score.getPlayer());
    }

    @Test
    @DisplayName("Should create Score with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        Competition comp = Competition.builder().name("Test").startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5)).createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now()).build();
        Round round = Round.builder().roundNumber(1).playDate(LocalDate.now()).build();
        Player player = Player.builder().name("Alice").talentRating(TalentRating.A).build();

        Score score = new Score(id, comp, round, player, 65, now, now);

        assertEquals(id, score.getId());
        assertEquals(comp, score.getCompetition());
        assertEquals(round, score.getRound());
        assertEquals(player, score.getPlayer());
        assertEquals(65, score.getValue());
        assertEquals(now, score.getCreatedAt());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Score score = new Score();
        score.setValue(42);

        assertEquals(42, score.getValue());
    }
}
