package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.config.TypesenseConfig;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.SearchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchServiceImpl implements SearchService {

    private final TypesenseConfig typesenseConfig;
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void initializeCollections() {
        try {
            createStoriesCollection();
            createUsersCollection();
            log.info("Typesense collections initialized successfully");
        } catch (Exception e) {
            log.warn("Failed to initialize Typesense collections: {}", e.getMessage());
        }
    }

    private void createStoriesCollection() {
        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections";

            Map<String, Object> schema = new HashMap<>();
            schema.put("name", TypesenseConfig.STORIES_COLLECTION);

            List<Map<String, Object>> fields = new ArrayList<>();

            // Story fields for search
            fields.add(Map.of("name", "id", "type", "string"));
            fields.add(Map.of("name", "title", "type", "string"));
            fields.add(Map.of("name", "description", "type", "string"));
            fields.add(Map.of("name", "author_name", "type", "string"));
            fields.add(Map.of("name", "category_name", "type", "string"));
            fields.add(Map.of("name", "tags", "type", "string[]"));
            fields.add(Map.of("name", "content_type", "type", "string"));
            fields.add(Map.of("name", "status", "type", "string"));
            fields.add(Map.of("name", "total_views", "type", "int64"));
            fields.add(Map.of("name", "total_likes", "type", "int64"));
            fields.add(Map.of("name", "created_at", "type", "int64"));
            fields.add(Map.of("name", "published_at", "type", "int64", "optional", true));

            schema.put("fields", fields);

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(schema, headers);

            restTemplate.postForEntity(url, request, String.class);
            log.info("Stories collection created successfully");

        } catch (Exception e) {
            log.warn("Stories collection might already exist or failed to create: {}", e.getMessage());
        }
    }

    private void createUsersCollection() {
        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections";

            Map<String, Object> schema = new HashMap<>();
            schema.put("name", TypesenseConfig.USERS_COLLECTION);

            List<Map<String, Object>> fields = new ArrayList<>();

            // User fields for search
            fields.add(Map.of("name", "id", "type", "string"));
            fields.add(Map.of("name", "username", "type", "string"));
            fields.add(Map.of("name", "display_name", "type", "string", "optional", true));
            fields.add(Map.of("name", "bio", "type", "string", "optional", true));
            fields.add(Map.of("name", "total_stories", "type", "int32"));
            fields.add(Map.of("name", "total_followers", "type", "int32"));
            fields.add(Map.of("name", "created_at", "type", "int64"));

            schema.put("fields", fields);

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(schema, headers);

            restTemplate.postForEntity(url, request, String.class);
            log.info("Users collection created successfully");

        } catch (Exception e) {
            log.warn("Users collection might already exist or failed to create: {}", e.getMessage());
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-TYPESENSE-API-KEY", typesenseConfig.getApiKey());
        return headers;
    }

    @Override
    public List<Story> searchStories(String query, int page, int size) {
        log.info("Searching stories with query: {} (page: {}, size: {})", query, page, size);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.STORIES_COLLECTION + "/documents/search";

            Map<String, String> params = new HashMap<>();
            params.put("q", query);
            params.put("query_by", "title,description,author_name,tags");
            params.put("filter_by", "status:PUBLISHED");
            params.put("sort_by", "total_views:desc,created_at:desc");
            params.put("page", String.valueOf(page + 1)); // Typesense pages start from 1
            params.put("per_page", String.valueOf(size));

            String searchUrl = buildUrlWithParams(url, params);

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, String.class);

            return parseStoriesFromSearchResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error searching stories with Typesense", e);
            // Fallback to database search
            return searchStoriesFromDatabase(query, page, size);
        }
    }

    @Override
    public List<Story> searchStoriesByCategory(String categorySlug, String query, int page, int size) {
        log.info("Searching stories by category: {} with query: {}", categorySlug, query);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.STORIES_COLLECTION + "/documents/search";

            Map<String, String> params = new HashMap<>();
            params.put("q", query.isEmpty() ? "*" : query);
            params.put("query_by", "title,description,author_name,tags");
            params.put("filter_by", "status:PUBLISHED && category_name:" + categorySlug);
            params.put("sort_by", "total_views:desc,created_at:desc");
            params.put("page", String.valueOf(page + 1));
            params.put("per_page", String.valueOf(size));

            String searchUrl = buildUrlWithParams(url, params);

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, String.class);

            return parseStoriesFromSearchResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error searching stories by category with Typesense", e);
        return new ArrayList<>();
        }
    }

    @Override
    public List<Story> searchStoriesByAuthor(UUID authorId, String query, int page, int size) {
        log.info("Searching stories by author: {} with query: {}", authorId, query);

        try {
            // Get author name first
            User author = userRepository.findById(authorId).orElse(null);
            if (author == null)
                return new ArrayList<>();

            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.STORIES_COLLECTION + "/documents/search";

            Map<String, String> params = new HashMap<>();
            params.put("q", query.isEmpty() ? "*" : query);
            params.put("query_by", "title,description,tags");
            params.put("filter_by", "status:PUBLISHED && author_name:" + author.getDisplayNameOrUsername());
            params.put("sort_by", "created_at:desc");
            params.put("page", String.valueOf(page + 1));
            params.put("per_page", String.valueOf(size));

            String searchUrl = buildUrlWithParams(url, params);

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, String.class);

            return parseStoriesFromSearchResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error searching stories by author with Typesense", e);
        return new ArrayList<>();
        }
    }

    @Override
    public List<Story> getPopularStories(int page, int size) {
        log.info("Getting popular stories (page: {}, size: {})", page, size);

        // Use database for popular stories - order by views/likes
        Pageable pageable = PageRequest.of(page, size);
        return storyRepository.findPopularStories(Story.Status.PUBLISHED, pageable).getContent();
    }

    @Override
    public List<Story> getRecentStories(int page, int size) {
        log.info("Getting recent stories (page: {}, size: {})", page, size);

        // Use database for recent stories - order by created date
        Pageable pageable = PageRequest.of(page, size);
        return storyRepository.findByStatusOrderByCreatedAtDesc(Story.Status.PUBLISHED, pageable).getContent();
    }

    @Override
    public List<Story> getFeaturedStories(int page, int size) {
        log.info("Getting featured stories (page: {}, size: {})", page, size);

        // Use database for featured stories - filter by featured flag
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return storyRepository.findByIsFeaturedTrueAndStatus(Story.Status.PUBLISHED, pageable).getContent();
    }

    @Override
    public List<User> searchUsers(String query, int page, int size) {
        log.info("Searching users with query: {} (page: {}, size: {})", query, page, size);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.USERS_COLLECTION + "/documents/search";

            Map<String, String> params = new HashMap<>();
            params.put("q", query);
            params.put("query_by", "username,display_name,bio");
            params.put("sort_by", "total_stories:desc,total_followers:desc");
            params.put("page", String.valueOf(page + 1));
            params.put("per_page", String.valueOf(size));

            String searchUrl = buildUrlWithParams(url, params);

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, String.class);

            return parseUsersFromSearchResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error searching users with Typesense", e);
            // Fallback to database search
            return searchUsersFromDatabase(query, page, size);
        }
    }

    @Override
    public List<User> searchAuthors(String query, int page, int size) {
        log.info("Searching authors with query: {} (page: {}, size: {})", query, page, size);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.USERS_COLLECTION + "/documents/search";

            Map<String, String> params = new HashMap<>();
            params.put("q", query);
            params.put("query_by", "username,display_name,bio");
            params.put("filter_by", "total_stories:>0");
            params.put("sort_by", "total_stories:desc");
            params.put("page", String.valueOf(page + 1));
            params.put("per_page", String.valueOf(size));

            String searchUrl = buildUrlWithParams(url, params);

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    searchUrl, HttpMethod.GET, request, String.class);

            return parseUsersFromSearchResponse(response.getBody());

        } catch (Exception e) {
            log.error("Error searching authors with Typesense", e);
        return searchUsers(query, page, size);
        }
    }

    // Search indexing methods
    @Override
    public void indexStory(Story story) {
        log.info("Indexing story: {}", story.getId());

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.STORIES_COLLECTION + "/documents/" + story.getId();

            Map<String, Object> document = createStoryDocument(story);

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(document, headers);

            restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
            log.info("Story indexed successfully: {}", story.getId());

        } catch (Exception e) {
            log.error("Failed to index story: {}", story.getId(), e);
        }
    }

    @Override
    public void updateStoryIndex(Story story) {
        log.info("Updating story index: {}", story.getId());
        indexStory(story); // Same as indexing for now
    }

    @Override
    public void removeStoryFromIndex(UUID storyId) {
        log.info("Removing story from index: {}", storyId);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.STORIES_COLLECTION + "/documents/" + storyId;

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            log.info("Story removed from index: {}", storyId);

        } catch (Exception e) {
            log.error("Failed to remove story from index: {}", storyId, e);
        }
    }

    @Override
    public void indexUser(User user) {
        log.info("Indexing user: {}", user.getId());

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.USERS_COLLECTION + "/documents/" + user.getId();

            Map<String, Object> document = createUserDocument(user);

            HttpHeaders headers = createHeaders();
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(document, headers);

            restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
            log.info("User indexed successfully: {}", user.getId());

        } catch (Exception e) {
            log.error("Failed to index user: {}", user.getId(), e);
        }
    }

    @Override
    public void updateUserIndex(User user) {
        log.info("Updating user index: {}", user.getId());
        indexUser(user); // Same as indexing for now
    }

    @Override
    public void removeUserFromIndex(UUID userId) {
        log.info("Removing user from index: {}", userId);

        try {
            String url = typesenseConfig.getTypesenseUrl() + "/collections/" +
                    TypesenseConfig.USERS_COLLECTION + "/documents/" + userId;

            HttpHeaders headers = createHeaders();
            HttpEntity<String> request = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            log.info("User removed from index: {}", userId);

        } catch (Exception e) {
            log.error("Failed to remove user from index: {}", userId, e);
        }
    }

    // Advanced search features
    @Override
    public List<Story> getRecommendedStories(UUID userId, int page, int size) {
        log.info("Getting recommended stories for user: {}", userId);
        // TODO: Implement recommendation algorithm
        // For now, return recent popular stories
        return getPopularStories(page, size);
    }

    @Override
    public List<Story> getSimilarStories(UUID storyId, int limit) {
        log.info("Getting similar stories for: {}", storyId);

        try {
            // Get the source story
            Story sourceStory = storyRepository.findById(storyId).orElse(null);
            if (sourceStory == null)
                return new ArrayList<>();

            // Search for stories with similar tags or category
            String query = String.join(" ", sourceStory.getTags());
            return searchStoriesByCategory(
                    sourceStory.getCategory().getSlug(),
                    query,
                    0,
                    limit).stream()
                    .filter(story -> !story.getId().equals(storyId))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting similar stories", e);
        return new ArrayList<>();
        }
    }

    @Override
    public List<String> getSearchSuggestions(String query, int limit) {
        log.info("Getting search suggestions for: {}", query);

        try {
            // Get story title suggestions
            List<Story> stories = searchStories(query, 0, limit);
            return stories.stream()
                    .map(Story::getTitle)
                    .distinct()
                    .limit(limit)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error getting search suggestions", e);
            return new ArrayList<>();
        }
    }

    // Helper methods
    private String buildUrlWithParams(String url, Map<String, String> params) {
        StringBuilder urlBuilder = new StringBuilder(url).append("?");
        params.forEach((key, value) -> urlBuilder.append(key).append("=").append(value).append("&"));
        return urlBuilder.substring(0, urlBuilder.length() - 1); // Remove last &
    }

    private Map<String, Object> createStoryDocument(Story story) {
        Map<String, Object> document = new HashMap<>();
        document.put("id", story.getId().toString());
        document.put("title", story.getTitle());
        document.put("description", story.getDescription() != null ? story.getDescription() : "");
        document.put("author_name", story.getAuthor().getDisplayNameOrUsername());
        document.put("category_name", story.getCategory() != null ? story.getCategory().getName() : "");
        document.put("tags", story.getTags() != null ? story.getTags() : new ArrayList<>());
        document.put("content_type", story.getContentType().toString());
        document.put("status", story.getStatus().toString());
        document.put("total_views", story.getTotalViews() != null ? story.getTotalViews() : 0L);
        document.put("total_likes", story.getTotalLikes() != null ? story.getTotalLikes() : 0L);
        document.put("created_at", story.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC));

        if (story.getPublishedAt() != null) {
            document.put("published_at", story.getPublishedAt().toEpochSecond(java.time.ZoneOffset.UTC));
        }

        return document;
    }

    private Map<String, Object> createUserDocument(User user) {
        Map<String, Object> document = new HashMap<>();
        document.put("id", user.getId().toString());
        document.put("username", user.getUsername());
        document.put("display_name", user.getDisplayName() != null ? user.getDisplayName() : "");
        document.put("bio", user.getBio() != null ? user.getBio() : "");
        document.put("total_stories", user.getStories() != null ? user.getStories().size() : 0);
        document.put("total_followers", user.getFollowers() != null ? user.getFollowers().size() : 0);
        document.put("created_at", user.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC));

        return document;
    }

    private List<Story> parseStoriesFromSearchResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode hits = root.get("hits");

            List<UUID> storyIds = new ArrayList<>();
            for (JsonNode hit : hits) {
                String idStr = hit.get("document").get("id").asText();
                storyIds.add(UUID.fromString(idStr));
            }

            // Fetch actual stories from database to ensure data consistency
            return storyRepository.findAllById(storyIds);

        } catch (Exception e) {
            log.error("Error parsing stories from search response", e);
            return new ArrayList<>();
        }
    }

    private List<User> parseUsersFromSearchResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode hits = root.get("hits");

            List<UUID> userIds = new ArrayList<>();
            for (JsonNode hit : hits) {
                String idStr = hit.get("document").get("id").asText();
                userIds.add(UUID.fromString(idStr));
            }

            // Fetch actual users from database to ensure data consistency
            return userRepository.findAllById(userIds);

        } catch (Exception e) {
            log.error("Error parsing users from search response", e);
        return new ArrayList<>();
        }
    }

    private List<Story> searchStoriesFromDatabase(String query, int page, int size) {
        // Fallback database search
        Pageable pageable = PageRequest.of(page, size);
        return storyRepository.searchByTitleOrDescription(query, Story.Status.PUBLISHED, pageable).getContent();
    }

    private List<User> searchUsersFromDatabase(String query, int page, int size) {
        // Fallback database search
        List<User> users = userRepository.findActiveVerifiedUsers();
        return users.stream()
                .filter(user -> user.getUsername().toLowerCase().contains(query.toLowerCase()) ||
                        (user.getDisplayName() != null
                                && user.getDisplayName().toLowerCase().contains(query.toLowerCase())))
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
    }
}