package com.golfcomp.api.exception;

import java.util.UUID;

/** Thrown when a requested resource cannot be found (maps to HTTP 404). */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException competition(UUID id) {
        return new ResourceNotFoundException("Competition not found with id: " + id);
    }

    public static ResourceNotFoundException course(UUID id) {
        return new ResourceNotFoundException("Course not found with id: " + id);
    }

    public static ResourceNotFoundException round(UUID id) {
        return new ResourceNotFoundException("Round not found with id: " + id);
    }

    public static ResourceNotFoundException team(UUID id) {
        return new ResourceNotFoundException("Team not found with id: " + id);
    }

    public static ResourceNotFoundException player(UUID id) {
        return new ResourceNotFoundException("Player not found with id: " + id);
    }

    public static ResourceNotFoundException score(UUID id) {
        return new ResourceNotFoundException("Score not found with id: " + id);
    }
}
