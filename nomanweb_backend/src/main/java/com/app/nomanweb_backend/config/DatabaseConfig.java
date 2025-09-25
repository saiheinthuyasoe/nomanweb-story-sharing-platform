package com.app.nomanweb_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

@Configuration
@Slf4j
public class DatabaseConfig {

    @Autowired
    private Environment env;

    @Bean
    public CommandLineRunner databaseConnectionTest(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();

                log.info("=== Database Connection Info ===");
                log.info("Database URL: {}", env.getProperty("spring.datasource.url"));
                log.info("Database Product: {}", metaData.getDatabaseProductName());
                log.info("Database Version: {}", metaData.getDatabaseProductVersion());
                log.info("Driver Name: {}", metaData.getDriverName());
                log.info("Driver Version: {}", metaData.getDriverVersion());
                log.info("Connection successful: {}", !connection.isClosed());

                // Check if tables exist
                log.info("=== Checking Tables ===");
                ResultSet tables = metaData.getTables(null, null, "%", new String[] { "TABLE" });
                boolean hasUserTable = false;

                while (tables.next()) {
                    String tableName = tables.getString("TABLE_NAME");
                    log.info("Found table: {}", tableName);
                    if ("users".equals(tableName)) {
                        hasUserTable = true;
                    }
                }

                if (!hasUserTable) {
                    log.warn("Users table not found! This might indicate a table creation issue.");
                } else {
                    log.info("Users table found successfully!");
                }

                log.info("=== Database Check Complete ===");

            } catch (Exception e) {
                log.error("Database connection failed: {}", e.getMessage(), e);
            }
        };
    }
}