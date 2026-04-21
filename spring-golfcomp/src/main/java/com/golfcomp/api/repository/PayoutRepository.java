package com.golfcomp.api.repository;

import com.golfcomp.api.model.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Payout entities.
 */
@Repository
public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    List<Payout> findByRoundId(UUID roundId);

    List<Payout> findByCompetitionId(UUID competitionId);

    List<Payout> findByCompetitionIdAndPlayerId(UUID competitionId, UUID playerId);

    /**
     * Sum of paid payouts for a player in a competition. Unpaid payouts are excluded
     * because {@code player.winnings} represents money actually disbursed.
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payout p " +
           "WHERE p.competition.id = :competitionId AND p.player.id = :playerId " +
           "AND p.paid = true")
    BigDecimal sumByCompetitionAndPlayer(@Param("competitionId") UUID competitionId,
                                         @Param("playerId") UUID playerId);
}
