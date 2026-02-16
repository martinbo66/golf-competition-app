package com.golfcomp.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI golfCompOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Golf Competition API")
                        .description("REST API for managing golf competitions, teams, players, scores, and leaderboards")
                        .version("v1.0"))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local development server")
                ));
    }
}
