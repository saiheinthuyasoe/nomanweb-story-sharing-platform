# Phase 2: Content Management System

## 🎯 **Phase 2 Overview**

Phase 2 focuses on implementing the core content management features that allow users to create, manage, and organize stories on the NoManWeb platform.

### **Goals:**
- Complete story CRUD operations
- Implement chapter management system
- Build category management
- Add file upload capabilities
- Implement Typesense search functionality
- Create content moderation system

## 📋 **Phase 2 Components**

### **2.1 Story Management System**

#### **Backend Implementation**

##### **2.1.1 Story Repository & Service**
```java
// StoryRepository.java
public interface StoryRepository extends JpaRepository<Story, UUID> {
    List<Story> findByAuthorAndStatus(User author, Story.Status status);
    List<Story> findByStatusAndModerationStatus(Story.Status status, Story.ModerationStatus moderationStatus);
    List<Story> findByCategoryAndStatus(Category category, Story.Status status);
    Page<Story> findByStatusOrderByCreatedAtDesc(Story.Status status, Pageable pageable);
    Page<Story> findByIsFeaturedTrueAndStatus(Story.Status status, Pageable pageable);
    
    @Query("SELECT s FROM Story s WHERE s.title LIKE %:query% OR s.description LIKE %:query%")
    List<Story> searchByTitleOrDescription(@Param("query") String query);
}

// StoryService.java
public interface StoryService {
    Story createStory(CreateStoryRequest request, User author);
    Story updateStory(UUID storyId, UpdateStoryRequest request, User user);
    Story publishStory(UUID storyId, User user);
    void deleteStory(UUID storyId, User user);
    Story getStoryById(UUID storyId);
    Page<Story> getPublishedStories(int page, int size);
    Page<Story> getStoriesByAuthor(UUID authorId, int page, int size);
    Page<Story> getStoriesByCategory(UUID categoryId, int page, int size);
    List<Story> getFeaturedStories();
    void incrementViews(UUID storyId);
}
```

##### **2.1.2 Story DTOs**
```java
// CreateStoryRequest.java
public class CreateStoryRequest {
    @NotBlank @Size(max = 255)
    private String title;
    
    @Size(max = 1000)
    private String description;
    
    private UUID categoryId;
    private Story.ContentType contentType;
    private List<String> tags;
}

// UpdateStoryRequest.java
public class UpdateStoryRequest {
    private String title;
    private String description;
    private UUID categoryId;
    private Story.ContentType contentType;
    private List<String> tags;
    private String coverImageUrl;
}

// StoryResponse.java
public class StoryResponse {
    private UUID id;
    private String title;
    private String description;
    private String coverImageUrl;
    private UserSummaryResponse author;
    private CategoryResponse category;
    private Story.Status status;
    private Story.ContentType contentType;
    private Integer totalChapters;
    private Long totalViews;
    private Long totalLikes;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
}
```

##### **2.1.3 Story Controller**
```java
@RestController
@RequestMapping("/api/stories")
public class StoryController {
    
    @PostMapping
    public ResponseEntity<StoryResponse> createStory(@Valid @RequestBody CreateStoryRequest request);
    
    @GetMapping("/{id}")
    public ResponseEntity<StoryResponse> getStory(@PathVariable UUID id);
    
    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> updateStory(@PathVariable UUID id, @Valid @RequestBody UpdateStoryRequest request);
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStory(@PathVariable UUID id);
    
    @PostMapping("/{id}/publish")
    public ResponseEntity<StoryResponse> publishStory(@PathVariable UUID id);
    
    @GetMapping
    public ResponseEntity<Page<StoryResponse>> getStories(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size);
    
    @GetMapping("/featured")
    public ResponseEntity<List<StoryResponse>> getFeaturedStories();
    
    @GetMapping("/author/{authorId}")
    public ResponseEntity<Page<StoryResponse>> getStoriesByAuthor(@PathVariable UUID authorId,
                                                                 @RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "10") int size);
}
```

#### **Frontend Implementation**

##### **2.1.4 Story Management Pages**
```typescript
// pages/stories/create.tsx - Story Creation Page
// pages/stories/[id]/edit.tsx - Story Editing Page
// pages/stories/[id]/index.tsx - Story Reading Page
// pages/stories/index.tsx - Story Listing Page
// pages/dashboard/stories.tsx - Author's Story Management
```

##### **2.1.5 Story Components**
```typescript
// components/stories/StoryCard.tsx - Story preview card
// components/stories/StoryForm.tsx - Create/Edit story form
// components/stories/StoryList.tsx - List of stories
// components/stories/StoryReader.tsx - Story reading interface
// components/stories/StoryStats.tsx - Views, likes, comments
```

##### **2.1.6 Story API Hooks**
```typescript
// hooks/useStories.ts
export const useStories = (page: number, size: number) => {
  return useQuery({
    queryKey: ['stories', page, size],
    queryFn: () => api.get(`/stories?page=${page}&size=${size}`),
  });
};

export const useCreateStory = () => {
  return useMutation({
    mutationFn: (data: CreateStoryRequest) => api.post('/stories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
};
```

### **2.2 Chapter Management System**

#### **Backend Implementation**

##### **2.2.1 Chapter Repository & Service**
```java
// ChapterRepository.java
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {
    List<Chapter> findByStoryOrderByChapterNumberAsc(Story story);
    Optional<Chapter> findByStoryAndChapterNumber(Story story, Integer chapterNumber);
    List<Chapter> findByStoryAndStatus(Story story, Chapter.Status status);
}

// ChapterService.java
public interface ChapterService {
    Chapter createChapter(UUID storyId, CreateChapterRequest request, User author);
    Chapter updateChapter(UUID chapterId, UpdateChapterRequest request, User user);
    Chapter publishChapter(UUID chapterId, User user);
    void deleteChapter(UUID chapterId, User user);
    Chapter getChapterById(UUID chapterId);
    List<Chapter> getChaptersByStory(UUID storyId);
    Chapter getNextChapter(UUID currentChapterId);
    Chapter getPreviousChapter(UUID currentChapterId);
}
```

##### **2.2.2 Chapter DTOs**
```java
// CreateChapterRequest.java
public class CreateChapterRequest {
    @NotBlank @Size(max = 255)
    private String title;
    
    @NotBlank
    private String content;
    
    private BigDecimal coinPrice;
    private Boolean isFree;
}

// ChapterResponse.java
public class ChapterResponse {
    private UUID id;
    private Integer chapterNumber;
    private String title;
    private String content;
    private Integer wordCount;
    private BigDecimal coinPrice;
    private Boolean isFree;
    private Chapter.Status status;
    private Long views;
    private Long likes;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
}
```

#### **Frontend Implementation**

##### **2.2.3 Chapter Components**
```typescript
// components/chapters/ChapterEditor.tsx - Rich text editor
// components/chapters/ChapterList.tsx - Chapter navigation
// components/chapters/ChapterReader.tsx - Chapter reading interface
// components/chapters/ChapterForm.tsx - Create/Edit chapter
```

### **2.3 Category Management System**

#### **Backend Implementation**

##### **2.3.1 Category Repository & Service**
```java
// CategoryRepository.java
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByIsActiveTrueOrderByNameAsc();
    Optional<Category> findBySlug(String slug);
    boolean existsByName(String name);
    boolean existsBySlug(String slug);
}

// CategoryService.java
public interface CategoryService {
    Category createCategory(CreateCategoryRequest request);
    Category updateCategory(UUID categoryId, UpdateCategoryRequest request);
    void deleteCategory(UUID categoryId);
    List<Category> getAllActiveCategories();
    Category getCategoryBySlug(String slug);
}
```

##### **2.3.2 Category Controller**
```java
@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories();
    
    @GetMapping("/{slug}")
    public ResponseEntity<CategoryResponse> getCategoryBySlug(@PathVariable String slug);
    
    @GetMapping("/{slug}/stories")
    public ResponseEntity<Page<StoryResponse>> getStoriesByCategory(@PathVariable String slug,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "10") int size);
    
    // Admin endpoints
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request);
}
```

### **2.4 File Upload System**

#### **Backend Implementation**

##### **2.4.1 File Upload Service**
```java
// FileUploadService.java
public interface FileUploadService {
    String uploadImage(MultipartFile file, String folder);
    void deleteImage(String imageUrl);
    boolean isValidImageFile(MultipartFile file);
}

// CloudinaryFileUploadService.java
@Service
public class CloudinaryFileUploadService implements FileUploadService {
    // Cloudinary integration for image uploads
    // Support for story covers, user avatars
}
```

##### **2.4.2 File Upload Controller**
```java
@RestController
@RequestMapping("/api/upload")
public class FileUploadController {
    
    @PostMapping("/image")
    public ResponseEntity<FileUploadResponse> uploadImage(@RequestParam("file") MultipartFile file,
                                                         @RequestParam("folder") String folder);
}
```

#### **Frontend Implementation**

##### **2.4.3 File Upload Components**
```typescript
// components/upload/ImageUpload.tsx - Drag & drop image upload
// components/upload/FileUploadProgress.tsx - Upload progress indicator
// hooks/useFileUpload.ts - File upload hook
```

### **2.5 Typesense Search Implementation**

#### **Backend Implementation**

##### **2.5.1 Search Service Enhancement**
```java
// Complete SearchServiceImpl.java implementation
@Service
public class SearchServiceImpl implements SearchService {
    
    private final TypesenseClient typesenseClient;
    
    @Override
    public List<Story> searchStories(String query, int page, int size) {
        // Implement Typesense search
        SearchParameters searchParameters = SearchParameters.builder()
            .q(query)
            .queryBy("title,description,tags")
            .page(page)
            .perPage(size)
            .build();
            
        // Execute search and map results
    }
    
    @Override
    public void indexStory(Story story) {
        // Index story in Typesense
        Map<String, Object> document = createStoryDocument(story);
        typesenseClient.collections("stories").documents().create(document);
    }
}
```

##### **2.5.2 Search Controller**
```java
@RestController
@RequestMapping("/api/search")
public class SearchController {
    
    @GetMapping("/stories")
    public ResponseEntity<SearchResponse<StoryResponse>> searchStories(@RequestParam String q,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "10") int size);
    
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSearchSuggestions(@RequestParam String q);
}
```

#### **Frontend Implementation**

##### **2.5.3 Search Components**
```typescript
// components/search/SearchBar.tsx - Global search
// components/search/SearchResults.tsx - Search results display
// components/search/SearchFilters.tsx - Category, content type filters
// pages/search.tsx - Search results page
```

### **2.6 Content Moderation System**

#### **Backend Implementation**

##### **2.6.1 Moderation Service**
```java
// ModerationService.java
public interface ModerationService {
    void submitForModeration(UUID storyId);
    void approveContent(UUID storyId, String moderatorNotes);
    void rejectContent(UUID storyId, String reason);
    List<Story> getPendingModerationStories();
    List<Comment> getPendingModerationComments();
}
```

##### **2.6.2 Admin Controller**
```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    @GetMapping("/moderation/stories")
    public ResponseEntity<Page<StoryResponse>> getPendingStories();
    
    @PostMapping("/moderation/stories/{id}/approve")
    public ResponseEntity<Void> approveStory(@PathVariable UUID id, @RequestBody ModerationRequest request);
    
    @PostMapping("/moderation/stories/{id}/reject")
    public ResponseEntity<Void> rejectStory(@PathVariable UUID id, @RequestBody ModerationRequest request);
}
```

## 📅 **Phase 2 Implementation Timeline**

### **Week 1: Story Management Foundation**
- [ ] Story Repository, Service, Controller
- [ ] Story DTOs and validation
- [ ] Basic story CRUD operations
- [ ] Story creation frontend form

### **Week 2: Chapter Management**
- [ ] Chapter Repository, Service, Controller
- [ ] Chapter DTOs and validation
- [ ] Chapter CRUD operations
- [ ] Rich text editor integration

### **Week 3: Category & File Upload**
- [ ] Category management system
- [ ] Cloudinary file upload integration
- [ ] Image upload components
- [ ] Story cover image functionality

### **Week 4: Search & Polish**
- [ ] Complete Typesense integration
- [ ] Search functionality frontend
- [ ] Content moderation system
- [ ] Testing and bug fixes

## 🔧 **Technical Requirements**

### **New Dependencies**

#### **Backend (pom.xml)**
```xml
<!-- Rich Text Processing -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.16.1</version>
</dependency>

<!-- File Upload -->
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.11.0</version>
</dependency>
```

#### **Frontend (package.json)**
```json
{
  "@tiptap/react": "^2.1.13",
  "@tiptap/starter-kit": "^2.1.13",
  "react-dropzone": "^14.3.0",
  "react-image-crop": "^11.0.5"
}
```

### **Database Migrations**
All tables are already created in Phase 1, but we may need:
- [ ] Additional indexes for search performance
- [ ] Full-text search indexes
- [ ] Category seed data

## 🎯 **Success Criteria**

### **Functional Requirements**
- [ ] Users can create, edit, and delete stories
- [ ] Users can add/edit/delete chapters
- [ ] Stories can be categorized
- [ ] File upload works for cover images
- [ ] Search functionality works
- [ ] Content moderation workflow

### **Technical Requirements**
- [ ] All APIs properly documented
- [ ] Frontend components are reusable
- [ ] Search performance is acceptable
- [ ] File uploads are secure
- [ ] Proper error handling

### **User Experience**
- [ ] Intuitive story creation flow
- [ ] Rich text editing experience
- [ ] Fast search results
- [ ] Responsive design
- [ ] Loading states and feedback

## 🚀 **Phase 2 Deliverables**

1. **Complete Story Management System**
2. **Chapter Creation and Editing**
3. **Category Management**
4. **File Upload Functionality**
5. **Search Implementation**
6. **Content Moderation Tools**
7. **Updated Documentation**
8. **Comprehensive Testing**

## 📝 **Next Steps**

1. **Review and approve** this Phase 2 plan
2. **Set up development environment** for new features
3. **Begin with Story Management** implementation
4. **Implement in weekly sprints** as outlined
5. **Regular testing and feedback** throughout development

---

**Ready to begin Phase 2 implementation!** 🚀

This plan provides a comprehensive roadmap for implementing the content management system while maintaining code quality and user experience standards established in Phase 1. 