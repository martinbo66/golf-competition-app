[![CI/CD Pipeline](https://github.com/martinbo66/golf-competition-app/actions/workflows/ci.yml/badge.svg)](https://github.com/martinbo66/golf-competition-app/actions/workflows/ci.yml)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=martinbo66_golf-competition-app&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=martinbo66_golf-competition-app)
# Golf Team Competition App

A full-stack application for managing golf team competitions. The project is a monorepo containing a Vue.js 2 single-page application and a Spring Boot REST API backend.

## Features

- **Player Management**: Add, edit, and delete players with talent ratings and financial information
- **Team Formation**: Create balanced teams manually or automatically using a snake draft algorithm
- **Scoring System**: Enter and track scores for multiple courses
- **Leaderboards**: View team and individual rankings
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Theme Options**: Choose between light and dark themes
- **Data Import/Export**: Backup and restore your competition data
- **REST API**: Spring Boot backend with full CRUD for players, teams, scores, courses, rounds, and competitions

## Project Structure

```
golf-competition-app/          # Monorepo root (Gradle orchestration)
├── vue-golfcomp/              # Vue.js 2 frontend SPA
│   ├── src/
│   │   ├── components/        # admin/, layout/, scoring/, shared/
│   │   ├── router/            # Hash-mode router
│   │   ├── stores/            # Vuex namespaced modules
│   │   ├── services/          # DataService, NotificationService
│   │   ├── utils/             # Validation and formatting helpers
│   │   └── views/             # Route-level page components
│   ├── tests/                 # Jest unit tests
│   └── package.json
├── spring-golfcomp/           # Spring Boot 3 REST API backend
│   └── src/
│       ├── main/java/com/golfcomp/api/
│       │   ├── controller/    # REST controllers (players, teams, scores, etc.)
│       │   ├── service/       # Business logic
│       │   ├── repository/    # Spring Data JPA repositories
│       │   ├── model/         # JPA entities
│       │   ├── dto/           # Request/response DTOs
│       │   └── exception/     # Global exception handling
│       └── main/resources/
│           └── db/changelog/  # Liquibase database migrations
├── data/                      # Sample JSON data files for import
├── doc/                       # User guide, test plan, delivery docs
├── build.gradle               # Root Gradle build (orchestrates both subprojects)
└── run.sh                     # Quick setup: install, lint, build, serve
```

## Technology Stack

### Frontend (vue-golfcomp/)
- **Vue.js 2** with Options API
- **Vue Router 3** (hash mode for static hosting)
- **Vuex 3** (namespaced modules)
- **Webpack 5** via Vue CLI
- **Jest 29** for unit testing
- **localStorage** for client-side persistence

### Backend (spring-golfcomp/)
- **Spring Boot 3.5** with Java 21
- **Spring Data JPA** for data access
- **Liquibase** for database migrations
- **PostgreSQL** (production) / **H2** (testing)
- **Springdoc OpenAPI** (Swagger UI at `/swagger-ui.html`)
- **Lombok** for boilerplate reduction
- **JaCoCo** for test coverage

## Prerequisites

- **Java 21+** (for the Spring Boot backend)
- **Node.js 14+** and **npm 6+** (for the Vue.js frontend)
- **PostgreSQL** (for production backend use; H2 is used automatically in tests)

## Commands

All commands are run from the **repository root** using the Gradle wrapper.

### Unified Commands
```bash
./gradlew build          # Build backend and frontend
./gradlew test           # Run all tests (backend + frontend)
./gradlew lint           # Run ESLint on frontend code
./gradlew clean          # Clean all build artifacts
./gradlew ci             # Full CI pipeline: clean, build, test, lint
./gradlew showTasks      # Show all available tasks
```

### Backend (Spring Boot)
```bash
./gradlew bootRun        # Run the Spring Boot application (default port 8080)
./gradlew backendBuild   # Build backend only
./gradlew backendTest    # Run backend tests only
```

### Frontend (Vue.js)
```bash
./gradlew frontendDev    # Start Vue dev server at http://localhost:8080
./gradlew frontendBuild  # Build frontend for production
./gradlew frontendInstall # Install npm dependencies
```

### Frontend (direct npm, from vue-golfcomp/)
```bash
npm run serve            # Dev server
npm run build            # Production build
npm run lint             # ESLint check
npm test                 # Run Jest tests
npm test -- --watch      # Watch mode
```

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/golf-competition-app.git
cd golf-competition-app
```

2. Start the frontend dev server:
```bash
./gradlew frontendDev
```
Open `http://localhost:8080` in your browser.

3. (Optional) Start the backend API:
```bash
./gradlew bootRun
```
The API will be available at `http://localhost:8080/api` with Swagger UI at `http://localhost:8080/swagger-ui.html`.

For detailed instructions, refer to the [User Guide](./doc/user-guide.md).

## API Endpoints

The REST API is organized around the following resources:

| Resource       | Base Path              |
|----------------|------------------------|
| Players        | `/api/players`         |
| Teams          | `/api/teams`           |
| Scores         | `/api/scores`          |
| Courses        | `/api/courses`         |
| Rounds         | `/api/rounds`          |
| Competitions   | `/api/competitions`    |
| Leaderboards   | `/api/leaderboard`     |

Full API documentation is available via Swagger UI when the backend is running.

## Testing

- **Frontend:** Jest unit tests in `vue-golfcomp/tests/`
- **Backend:** JUnit 5 tests in `spring-golfcomp/src/test/` (unit and integration)
- **Coverage:** JaCoCo reports generated at `spring-golfcomp/build/reports/jacoco/`

Run all tests: `./gradlew test`

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
