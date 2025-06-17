package com.app.nomanweb_backend.config;

import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeCategories();
    }

    private void initializeCategories() {
        if (categoryRepository.count() == 0) {
            log.info("Initializing default categories...");

            List<Category> categories = List.of(
                    Category.builder()
                            .name("Romance")
                            .description("Love stories and romantic adventures")
                            .slug("romance")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Fantasy")
                            .description("Magical worlds and mythical creatures")
                            .slug("fantasy")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Science Fiction")
                            .description("Stories set in the future or alternate realities")
                            .slug("science-fiction")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Mystery")
                            .description("Puzzles, crime, and suspenseful stories")
                            .slug("mystery")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Thriller")
                            .description("High-stakes stories with intense action")
                            .slug("thriller")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Drama")
                            .description("Realistic stories about human relationships")
                            .slug("drama")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Horror")
                            .description("Scary and supernatural stories")
                            .slug("horror")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Adventure")
                            .description("Exciting journeys and explorations")
                            .slug("adventure")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Comedy")
                            .description("Funny and lighthearted stories")
                            .slug("comedy")
                            .isActive(true)
                            .build(),
                    Category.builder()
                            .name("Young Adult")
                            .description("Stories for teenagers and young adults")
                            .slug("young-adult")
                            .isActive(true)
                            .build());

            categoryRepository.saveAll(categories);
            log.info("Successfully initialized {} categories", categories.size());
        } else {
            log.info("Categories already exist, skipping initialization");
        }
    }
}