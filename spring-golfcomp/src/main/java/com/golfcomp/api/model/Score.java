package com.golfcomp.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing a player's score for a specific round in a competition.
 * Each score records the number of strokes a player took during a round.
 * The competition reference is denormalized for query efficiency.
 * 
 * <p>Constraints:</p>
 * <ul>
 *   <li>Score value must be between 18 and 150 strokes</li>
 *   <li>Only one score per player per round (unique constraint on round_id, player_id)</li>
 * </ul>
 */
@Entity
@Table(
    name = "scores",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_scores_round_player",
            columnNames = {"round_id", "player_id"}
        )
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * Reference to the competition (denormalized for query efficiency).
     * This allows efficient queries for all scores in a competition without
     * joining through the rounds table.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    /**
     * Reference to the round this score belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;

    /**
     * Reference to the player who achieved this score.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    /**
     * The score value (number of strokes).
     * Valid range is 18 (theoretical minimum for 18 holes) to 150 (practical maximum).
     */
    @Min(value = 18, message = "Score must be at least 18")
    @Max(value = 150, message = "Score must not exceed 150")
    @Column(name = "score_value", nullable = false)
    private Integer value;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
