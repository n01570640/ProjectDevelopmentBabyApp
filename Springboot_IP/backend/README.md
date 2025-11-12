# Baby Tracking API - Backend

Spring Boot REST API for the Baby Tracking Application.

## Tech Stack

- Spring Boot 3.3.2
- Java 17
- H2 Database (Development)
- Maven

## Getting Started

### Run the Application

```bash
# Windows
mvnw.cmd spring-boot:run

# Mac/Linux
./mvnw spring-boot:run
```

API will be available at: `http://localhost:8080/api/v1`

### H2 Console (Database Browser)

Access at: `http://localhost:8080/h2-console`
- Username: `sa`
- Password: (leave empty)
- JDBC URL: `jdbc:h2:mem:testdb`

## Configuration

All settings are in `src/main/resources/application.properties`

### Switch to Oracle (When Ready)

1. Open `application.properties`
2. Comment out H2 lines (add `#`)
3. Uncomment Oracle lines
4. Add your AWS connection details
5. Add Oracle JDBC dependency to `pom.xml`
6. Restart the app

No code changes needed - just configuration!

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/babyapp/
│   │   │   └── BabyTrackingApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
└── README.md
```

## Building

```bash
mvnw.cmd clean install
```

## Adding More Entities, Controllers, Services

Create files in:
- `src/main/java/com/babyapp/entity/` - Database entities
- `src/main/java/com/babyapp/controller/` - REST endpoints
- `src/main/java/com/babyapp/service/` - Business logic
- `src/main/java/com/babyapp/repository/` - Database access
