package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Library;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LibraryRepository extends JpaRepository<Library, UUID> {

    // Find by user and story
    List<Library> findByUserIdAndStoryId(UUID userId, UUID storyId);

    // Find by user, story and list type
    Optional<Library> findByUserIdAndStoryIdAndListType(UUID userId, UUID storyId, Library.ListType listType);

    // Find by user and list type
    List<Library> findByUserIdAndListTypeOrderByAddedAtDesc(UUID userId, Library.ListType listType);

    // Find all by user
    List<Library> findByUserIdOrderByAddedAtDesc(UUID userId);

    // Delete by user, story and list types
    @Modifying
    @Transactional
    @Query("DELETE FROM Library rl WHERE rl.user.id = :userId AND rl.story.id = :storyId AND rl.listType IN :listTypes")
    void deleteByUserIdAndStoryIdAndListTypeIn(@Param("userId") UUID userId,
            @Param("storyId") UUID storyId,
            @Param("listTypes") List<Library.ListType> listTypes);

    // Check if exists
    boolean existsByUserIdAndStoryIdAndListType(UUID userId, UUID storyId, Library.ListType listType);

    // Count by story and list type
    long countByStoryIdAndListType(UUID storyId, Library.ListType listType);

    // Find by story and list type
    @Query("SELECT l FROM Library l WHERE l.story.id = :storyId AND l.listType = :listType")
    List<Library> findByStoryIdAndListType(@Param("storyId") UUID storyId,
            @Param("listType") Library.ListType listType);
}