package com.app.nomanweb_backend.config;

import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.CategoryRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeCategories();
        // Disabled sample data initialization for production
        // initializeSampleData();
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

    private void initializeSampleData() {
        if (storyRepository.count() == 0) {
            log.info("Initializing sample data...");
            
            // Create sample users
            List<User> sampleUsers = createSampleUsers();
            userRepository.saveAll(sampleUsers);
            
            // Create sample stories
            List<Story> sampleStories = createSampleStories(sampleUsers);
            storyRepository.saveAll(sampleStories);
            
            log.info("Successfully initialized {} users and {} stories", sampleUsers.size(), sampleStories.size());
        } else {
            log.info("Sample data already exists, skipping initialization");
        }
    }

    private List<User> createSampleUsers() {
        return Arrays.asList(
            User.builder()
                .email("sarah.chen@example.com")
                .username("sarahchen")
                .displayName("Sarah Chen")
                .passwordHash(passwordEncoder.encode("password123"))
                .bio("Fantasy author who loves creating magical worlds and epic adventures.")
                .profileImageUrl("https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150")
                .emailVerified(true)
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build(),
            User.builder()
                .email("alex.morgan@example.com")
                .username("alexmorgan")
                .displayName("Alex Morgan")
                .passwordHash(passwordEncoder.encode("password123"))
                .bio("Sci-fi enthusiast exploring the boundaries of technology and humanity.")
                .profileImageUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
                .emailVerified(true)
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build(),
            User.builder()
                .email("emma.rodriguez@example.com")
                .username("emmarodriguez")
                .displayName("Emma Rodriguez")
                .passwordHash(passwordEncoder.encode("password123"))
                .bio("Romance writer crafting heartwarming love stories that touch the soul.")
                .profileImageUrl("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150")
                .emailVerified(true)
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build(),
            User.builder()
                .email("james.wilson@example.com")
                .username("jameswilson")
                .displayName("James Wilson")
                .passwordHash(passwordEncoder.encode("password123"))
                .bio("Mystery and thriller author who keeps readers on the edge of their seats.")
                .profileImageUrl("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150")
                .emailVerified(true)
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build(),
            User.builder()
                .email("maya.patel@example.com")
                .username("mayapatel")
                .displayName("Maya Patel")
                .passwordHash(passwordEncoder.encode("password123"))
                .bio("Horror writer who delves into the darkest corners of the human psyche.")
                .profileImageUrl("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150")
                .emailVerified(true)
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .build()
        );
    }

    private List<Story> createSampleStories(List<User> users) {
        List<Category> categories = categoryRepository.findAll();
        Random random = new Random();
        LocalDateTime now = LocalDateTime.now();
        
        return Arrays.asList(
            // Fantasy Stories
            Story.builder()
                .title("The Crystal Prophecy")
                .description("In a world where magic flows through ancient crystals, young Aria discovers she's the key to preventing an eternal darkness. Join her epic journey across mystical realms as she learns to harness her newfound powers and unite the scattered kingdoms against an ancient evil.")
                .author(users.get(0))
                .category(getCategoryBySlug(categories, "fantasy"))
                .coverImageUrl("https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(15420L)
                .totalLikes(2341L)
                .totalComments(156L)
                .totalChapters(24)
                .isFeatured(true)
                .tags(Arrays.asList("fantasy", "magic", "adventure", "prophecy", "crystals"))
                .publishedAt(now.minusDays(45))
                .build(),
            Story.builder()
                .title("Dragons of the Northern Realm")
                .description("When the last dragon rider falls, the kingdom faces its darkest hour. Follow Kael as he discovers his heritage and bonds with the legendary dragon Shadowfire to restore balance to the realm.")
                .author(users.get(0))
                .category(getCategoryBySlug(categories, "fantasy"))
                .coverImageUrl("https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.COMPLETED)
                .totalViews(28750L)
                .totalLikes(4120L)
                .totalComments(287L)
                .totalChapters(32)
                .isFeatured(true)
                .tags(Arrays.asList("fantasy", "dragons", "adventure", "completed"))
                .publishedAt(now.minusDays(120))
                .build(),
            
            // Sci-Fi Stories
            Story.builder()
                .title("Quantum Echoes")
                .description("In 2157, Dr. Elena Vasquez discovers that her quantum experiments are creating rifts in reality itself. As parallel universes begin to collide, she must race against time to prevent the collapse of all existence.")
                .author(users.get(1))
                .category(getCategoryBySlug(categories, "science-fiction"))
                .coverImageUrl("https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(22100L)
                .totalLikes(3456L)
                .totalComments(198L)
                .totalChapters(18)
                .isFeatured(true)
                .tags(Arrays.asList("sci-fi", "quantum", "parallel-universe", "science"))
                .publishedAt(now.minusDays(30))
                .build(),
            Story.builder()
                .title("The Mars Colony")
                .description("The first human settlement on Mars faces extinction when their life support systems begin failing. Commander Sarah Mitchell must lead her team through impossible odds to ensure humanity's survival on the red planet.")
                .author(users.get(1))
                .category(getCategoryBySlug(categories, "science-fiction"))
                .coverImageUrl("https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(18900L)
                .totalLikes(2876L)
                .totalComments(145L)
                .totalChapters(15)
                .tags(Arrays.asList("sci-fi", "mars", "space", "survival", "colony"))
                .publishedAt(now.minusDays(60))
                .build(),
            
            // Romance Stories
            Story.builder()
                .title("Coffee Shop Chronicles")
                .description("When successful businesswoman Lily inherits her grandmother's old coffee shop, she never expected to find love with the charming baker next door. A heartwarming tale of second chances and finding home in unexpected places.")
                .author(users.get(2))
                .category(getCategoryBySlug(categories, "romance"))
                .coverImageUrl("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.COMPLETED)
                .totalViews(31200L)
                .totalLikes(5670L)
                .totalComments(423L)
                .totalChapters(28)
                .isFeatured(true)
                .tags(Arrays.asList("romance", "coffee-shop", "small-town", "completed", "heartwarming"))
                .publishedAt(now.minusDays(90))
                .build(),
            Story.builder()
                .title("Letters to Tomorrow")
                .description("A time-traveling love story where Emma discovers letters from her future self, leading her to the love of her life across different timelines. But changing the past comes with unexpected consequences.")
                .author(users.get(2))
                .category(getCategoryBySlug(categories, "romance"))
                .coverImageUrl("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(19800L)
                .totalLikes(3245L)
                .totalComments(234L)
                .totalChapters(20)
                .tags(Arrays.asList("romance", "time-travel", "letters", "destiny"))
                .publishedAt(now.minusDays(25))
                .build(),
            
            // Mystery Stories
            Story.builder()
                .title("The Midnight Detective")
                .description("Detective Marcus Kane only works the night shift, but when a series of murders occurs during the day, he must confront his mysterious past and the reason he can't face the sunlight.")
                .author(users.get(3))
                .category(getCategoryBySlug(categories, "mystery"))
                .coverImageUrl("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(24600L)
                .totalLikes(3890L)
                .totalComments(267L)
                .totalChapters(22)
                .isFeatured(true)
                .tags(Arrays.asList("mystery", "detective", "crime", "supernatural", "night"))
                .publishedAt(now.minusDays(40))
                .build(),
            Story.builder()
                .title("The Vanishing Artist")
                .description("When renowned painter Isabella Moreau disappears from her locked studio, leaving behind only a half-finished painting that seems to move on its own, art curator David Chen must unravel the mystery before more artists vanish.")
                .author(users.get(3))
                .category(getCategoryBySlug(categories, "mystery"))
                .coverImageUrl("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(16700L)
                .totalLikes(2543L)
                .totalComments(189L)
                .totalChapters(16)
                .tags(Arrays.asList("mystery", "art", "supernatural", "disappearance"))
                .publishedAt(now.minusDays(35))
                .build(),
            
            // Horror Stories
            Story.builder()
                .title("The Whispering House")
                .description("The Blackwood Manor has stood empty for decades, but when the Morrison family moves in, they discover that some houses never forget their past. The walls whisper secrets that should have stayed buried.")
                .author(users.get(4))
                .category(getCategoryBySlug(categories, "horror"))
                .coverImageUrl("https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(21300L)
                .totalLikes(3456L)
                .totalComments(298L)
                .totalChapters(19)
                .isFeatured(true)
                .tags(Arrays.asList("horror", "haunted-house", "supernatural", "family", "secrets"))
                .publishedAt(now.minusDays(50))
                .build(),
            Story.builder()
                .title("Digital Nightmares")
                .description("In a world where dreams can be digitally recorded and shared, sleep therapist Dr. Anna Cross discovers that someone is planting nightmares in her patients' minds. But the real horror is discovering who's behind it.")
                .author(users.get(4))
                .category(getCategoryBySlug(categories, "horror"))
                .coverImageUrl("https://images.unsplash.com/photo-1520637836862-4d197d17c93a?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(18200L)
                .totalLikes(2789L)
                .totalComments(234L)
                .totalChapters(14)
                .tags(Arrays.asList("horror", "technology", "dreams", "psychological", "thriller"))
                .publishedAt(now.minusDays(20))
                .build(),
            
            // Adventure Stories
            Story.builder()
                .title("The Lost Expedition")
                .description("When archaeologist Dr. Rebecca Stone discovers a map to the legendary City of Gold, she assembles a team for the most dangerous expedition of her career. But the jungle holds secrets darker than any treasure.")
                .author(users.get(0))
                .category(getCategoryBySlug(categories, "adventure"))
                .coverImageUrl("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400")
                .publishStatus(Story.PublishStatus.PUBLISHED)
                .moderationStatus(Story.ModerationStatus.APPROVED)
                .bookStatus(Story.BookStatus.ONGOING)
                .totalViews(26400L)
                .totalLikes(4123L)
                .totalComments(312L)
                .totalChapters(21)
                .isFeatured(true)
                .tags(Arrays.asList("adventure", "archaeology", "jungle", "treasure", "expedition"))
                .publishedAt(now.minusDays(55))
                .build()
        );
    }

    private Category getCategoryBySlug(List<Category> categories, String slug) {
        return categories.stream()
            .filter(category -> category.getSlug().equals(slug))
            .findFirst()
            .orElse(categories.get(0)); // fallback to first category
    }
}