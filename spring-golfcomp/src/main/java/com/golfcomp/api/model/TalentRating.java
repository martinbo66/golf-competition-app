package com.golfcomp.api.model;

/**
 * Talent rating enum for player skill classification.
 * Used for team balancing via the snake draft algorithm.
 * 
 * <ul>
 *   <li>A - Highest skill level</li>
 *   <li>B - Above average skill</li>
 *   <li>C - Average skill</li>
 *   <li>D - Below average skill</li>
 * </ul>
 */
public enum TalentRating {
    A,
    B,
    C,
    D
}
