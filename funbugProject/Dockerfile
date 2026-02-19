FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy build files first for better layer caching
COPY .mvn .mvn
COPY mvnw mvnw
COPY pom.xml pom.xml
RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline

# Copy source and build the application
COPY src src
RUN ./mvnw -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy built jar from build stage
COPY --from=build /app/target/funbugProject-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# docker build -t funbug-backend .

# docker run --rm -p 8080:8080 funbug-backend
