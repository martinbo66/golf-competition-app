package com.golfcomp.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class PayoutTest {

    @Test
    @DisplayName("Should create Payout using builder")
    void shouldCreatePayoutUsingBuilder() {
        Payout payout = Payout.builder()
                .type(PayoutType.GREENIE)
                .amount(BigDecimal.valueOf(25))
                .note("Hole 5")
                .build();

        assertEquals(PayoutType.GREENIE, payout.getType());
        assertEquals(BigDecimal.valueOf(25), payout.getAmount());
        assertEquals("Hole 5", payout.getNote());
        assertNull(payout.getId());
        assertNull(payout.getCreatedAt());
    }

    @Test
    @DisplayName("Should set both timestamps on onCreate")
    void shouldSetTimestampsOnCreate() {
        Payout payout = Payout.builder()
                .type(PayoutType.TEAM_WIN)
                .amount(BigDecimal.valueOf(40))
                .build();

        payout.onCreate();

        assertNotNull(payout.getCreatedAt());
        assertNotNull(payout.getUpdatedAt());
        assertEquals(payout.getCreatedAt(), payout.getUpdatedAt());
    }

    @Test
    @DisplayName("Should update updatedAt but not createdAt on onUpdate")
    void shouldUpdateTimestampOnUpdate() {
        Payout payout = Payout.builder()
                .type(PayoutType.GREENIE)
                .amount(BigDecimal.TEN)
                .build();
        payout.onCreate();
        Instant originalCreatedAt = payout.getCreatedAt();

        payout.onUpdate();

        assertEquals(originalCreatedAt, payout.getCreatedAt());
        assertTrue(payout.getUpdatedAt().isAfter(originalCreatedAt)
                || payout.getUpdatedAt().equals(originalCreatedAt));
    }

    @Test
    @DisplayName("Should create Payout with no-args constructor")
    void shouldCreateWithNoArgsConstructor() {
        Payout payout = new Payout();

        assertNull(payout.getId());
        assertNull(payout.getType());
        assertNull(payout.getAmount());
    }

    @Test
    @DisplayName("Should create Payout with all-args constructor")
    void shouldCreateWithAllArgsConstructor() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        Competition comp = Competition.builder().name("Test").startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(5)).createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now()).build();
        Round round = Round.builder().roundNumber(1).playDate(LocalDate.now()).build();
        Player player = Player.builder().name("Alice").talentRating(TalentRating.A).build();

        Payout payout = new Payout(id, comp, round, null, player,
                PayoutType.GREENIE, BigDecimal.valueOf(30), "Hole 7", false, null, now, now);

        assertEquals(id, payout.getId());
        assertEquals(comp, payout.getCompetition());
        assertEquals(round, payout.getRound());
        assertEquals(player, payout.getPlayer());
        assertEquals(PayoutType.GREENIE, payout.getType());
        assertEquals(0, BigDecimal.valueOf(30).compareTo(payout.getAmount()));
        assertEquals("Hole 7", payout.getNote());
        assertEquals(now, payout.getCreatedAt());
    }

    @Test
    @DisplayName("Should use setters correctly")
    void shouldUseSettersCorrectly() {
        Payout payout = new Payout();
        payout.setType(PayoutType.TEAM_WIN);
        payout.setAmount(BigDecimal.valueOf(80));
        payout.setNote("Team win share");

        assertEquals(PayoutType.TEAM_WIN, payout.getType());
        assertEquals(BigDecimal.valueOf(80), payout.getAmount());
        assertEquals("Team win share", payout.getNote());
    }
}
