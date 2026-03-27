package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PlayerTest {

    @Test
    @DisplayName("Should create Player using builder with defaults")
    void shouldCreatePlayerUsingBuilder() {
        Player player = Player.builder()
                .name("Erik Bathe")
                .talentRating(TalentRating.A)
                .build();

        assertEquals("Erik Bathe", player.getName());
        assertEquals(TalentRating.A, player.getTalentRating());
        assertEquals(BigDecimal.ZERO, player.getEntryFee());
        assertEquals(BigDecimal.ZERO, player.getWinnings());
        assertNull(player.getId());
    }

    @Test
    @DisplayName("Should set timestamps and defaults on onCreate")
    void shouldSetTimestampsOnCreate() {
        Player player = Player.builder()
                .name("Test Player")
                .talentRating(TalentRating.B)
                .entryFee(null)
                .winnings(null)
                .build();

        player.onCreate();

        assertNotNull(player.getCreatedAt());
        assertNotNull(player.getUpdatedAt());
        assertEquals(player.getCreatedAt(), player.getUpdatedAt());
        assertEquals(BigDecimal.ZERO, player.getEntryFee());
        assertEquals(BigDecimal.ZERO, player.getWinnings());
    }

    @Test
    @DisplayName("Should preserve non-null entryFee and winnings on onCreate")
    void shouldPreserveNonNullFieldsOnCreate() {
        Player player = Player.builder()
                .name("Test Player")
                .talentRating(TalentRating.A)
                .entryFee(BigDecimal.valueOf(150))
                .winnings(BigDecimal.valueOf(50))
                .build();

        player.onCreate();

        assertEquals(BigDecimal.valueOf(150), player.getEntryFee());
        assertEquals(BigDecimal.valueOf(50), player.getWinnings());
    }

    @Test
    @DisplayName("Should update timestamp on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Player player = Player.builder()
                .name("Test Player")
                .talentRating(TalentRating.C)
                .build();

        player.onCreate();
        LocalDateTime originalCreatedAt = player.getCreatedAt();

        player.onUpdate();

        assertEquals(originalCreatedAt, player.getCreatedAt());
        assertTrue(player.getUpdatedAt().isAfter(originalCreatedAt)
                || player.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Player with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        Competition comp = Competition.builder().name("Test").build();
        Team team = Team.builder().name("Team").build();

        Player player = new Player(id, comp, team, "Name", TalentRating.D,
                BigDecimal.TEN, BigDecimal.ONE, now, now);

        assertEquals(id, player.getId());
        assertEquals(comp, player.getCompetition());
        assertEquals(team, player.getTeam());
        assertEquals("Name", player.getName());
        assertEquals(TalentRating.D, player.getTalentRating());
        assertEquals(BigDecimal.TEN, player.getEntryFee());
        assertEquals(BigDecimal.ONE, player.getWinnings());
    }

    @Test
    @DisplayName("Should create Player with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Player player = new Player();

        assertNull(player.getId());
        assertNull(player.getName());
        assertNull(player.getTalentRating());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Player player = new Player();
        player.setName("Updated");
        player.setTalentRating(TalentRating.B);
        player.setEntryFee(BigDecimal.valueOf(200));
        player.setWinnings(BigDecimal.valueOf(100));

        assertEquals("Updated", player.getName());
        assertEquals(TalentRating.B, player.getTalentRating());
        assertEquals(BigDecimal.valueOf(200), player.getEntryFee());
        assertEquals(BigDecimal.valueOf(100), player.getWinnings());
    }
}
