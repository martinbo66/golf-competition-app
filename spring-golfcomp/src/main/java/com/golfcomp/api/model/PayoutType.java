package com.golfcomp.api.model;

/**
 * Type of payout awarded during a competition round.
 *
 * <ul>
 *   <li>TEAM_WIN - Money paid to a player as part of the winning team for a round
 *       (typically the team with the highest total score for that round).</li>
 *   <li>GREENIE - Money paid to the player who hit the ball closest to the pin
 *       on a par-3 hole.</li>
 *   <li>EVENT - Money paid to a player for winning a non-round competition event
 *       (e.g. a putting competition or longest-drive contest).</li>
 * </ul>
 */
public enum PayoutType {
    TEAM_WIN,
    GREENIE,
    EVENT
}
