package com.golfcomp.api.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard API response envelope used by all endpoints.
 *
 * <p>Success: {@code {"success":true,"data":{...},"meta":{...}}}
 * <p>Error:   {@code {"success":false,"error":{...},"meta":{...}}}
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ApiError error;
    private final Meta meta;

    @Data
    @Builder
    public static class ApiError {
        private final String code;
        private final String message;
    }

    @Data
    @Builder
    public static class Meta {
        private final Instant timestamp;
        private final UUID requestId;
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .meta(Meta.builder().timestamp(Instant.now()).requestId(UUID.randomUUID()).build())
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .error(ApiError.builder().code(code).message(message).build())
            .meta(Meta.builder().timestamp(Instant.now()).requestId(UUID.randomUUID()).build())
            .build();
    }
}
