# Golf Competition Backend

Spring Boot 3.5 backend for the Bathe Golf Competition application.

## Requirements

- Java 21
- Gradle 8.x (use wrapper: `./gradlew`)

## Quick Start

```bash
# From repository root
./gradlew bootRun

# Or from spring-golfcomp/
./gradlew bootRun
```

The application starts on port 8080. Health check: http://localhost:8080/actuator/health

## Profiles

| Profile | Purpose |
|---------|---------|
| `dev` (default) | H2 in-memory database, H2 console at /h2-console |
| `test` | H2 in-memory for tests |
| `prod` | PostgreSQL (configured in US-002) |

## Build & Test

```bash
# From repository root
./gradlew build          # Build backend and frontend
./gradlew backendBuild   # Build backend only
./gradlew backendTest    # Run backend tests
```
