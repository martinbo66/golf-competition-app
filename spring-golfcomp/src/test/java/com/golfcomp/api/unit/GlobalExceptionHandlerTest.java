package com.golfcomp.api.unit;

import com.golfcomp.api.dto.response.ApiResponse;
import com.golfcomp.api.exception.BusinessRuleException;
import com.golfcomp.api.exception.GlobalExceptionHandler;
import com.golfcomp.api.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("ResourceNotFoundException maps to 404 with RESOURCE_NOT_FOUND code")
    void handleResourceNotFound_returns404WithCorrectBody() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Competition not found with id: abc");

        ResponseEntity<ApiResponse<Void>> response = handler.handleResourceNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("RESOURCE_NOT_FOUND");
        assertThat(response.getBody().getError().getMessage()).isEqualTo("Competition not found with id: abc");
    }

    @Test
    @DisplayName("ResourceNotFoundException static factory methods include the entity id")
    void resourceNotFoundException_factoryMethods_includeId() {
        UUID id = UUID.randomUUID();
        String idStr = id.toString();

        assertThat(ResourceNotFoundException.competition(id).getMessage()).contains(idStr);
        assertThat(ResourceNotFoundException.course(id).getMessage()).contains(idStr);
        assertThat(ResourceNotFoundException.round(id).getMessage()).contains(idStr);
        assertThat(ResourceNotFoundException.team(id).getMessage()).contains(idStr);
        assertThat(ResourceNotFoundException.player(id).getMessage()).contains(idStr);
        assertThat(ResourceNotFoundException.score(id).getMessage()).contains(idStr);
    }

    @Test
    @DisplayName("BusinessRuleException maps to 409 with the exception's own error code")
    void handleBusinessRule_returns409WithExceptionErrorCode() {
        BusinessRuleException ex = new BusinessRuleException("DUPLICATE_TEAM_NAME", "Team name already exists in competition");

        ResponseEntity<ApiResponse<Void>> response = handler.handleBusinessRule(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("DUPLICATE_TEAM_NAME");
        assertThat(response.getBody().getError().getMessage()).isEqualTo("Team name already exists in competition");
    }

    @Test
    @DisplayName("MethodArgumentNotValidException maps to 400 with VALIDATION_ERROR and field message")
    void handleValidation_returns400WithFieldErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("createCompetitionRequest", "name", "must not be blank");
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidation(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.getBody().getError().getMessage()).isEqualTo("name: must not be blank");
    }

    @Test
    @DisplayName("Multiple validation field errors are joined with comma-space")
    void handleValidation_multipleErrors_joinsMessages() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(
            new FieldError("req", "name", "must not be blank"),
            new FieldError("req", "startDate", "must not be null")
        ));

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidation(ex);

        assertThat(response.getBody().getError().getMessage())
            .contains("name: must not be blank")
            .contains("startDate: must not be null");
    }

    @Test
    @DisplayName("Unhandled exception maps to 500 with INTERNAL_ERROR code")
    void handleGeneral_returns500WithInternalError() {
        Exception ex = new RuntimeException("Something went wrong unexpectedly");

        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneral(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().getError().getMessage()).isEqualTo("An unexpected error occurred");
    }

    @Test
    @DisplayName("Response body includes meta with timestamp and requestId")
    void handleResourceNotFound_responseIncludesMeta() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Not found");

        ResponseEntity<ApiResponse<Void>> response = handler.handleResourceNotFound(ex);

        assertThat(response.getBody().getMeta()).isNotNull();
        assertThat(response.getBody().getMeta().getTimestamp()).isNotNull();
        assertThat(response.getBody().getMeta().getRequestId()).isNotNull();
    }
}
