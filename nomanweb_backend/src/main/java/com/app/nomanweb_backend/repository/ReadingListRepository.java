package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.ReadingList;
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
public interface ReadingListRepository extends JpaRepository<ReadingList, UUID> {

    // Find by user and story
    List<ReadingList> findByUserIdAndStoryId(UUID userId, UUID storyId);

    // Find by user, story and list type
    Optional<ReadingList> findByUserIdAndStoryIdAndListType(UUID userId, UUID storyId, ReadingList.ListType listType);

    // Find by user and list type
    List<ReadingList> findByUserIdAndListTypeOrderByAddedAtDesc(UUID userId, ReadingList.ListType listType);

    // Find all by user
    List<ReadingList> findByUserIdOrderByAddedAtDesc(UUID userId);

    // Delete by user, story and list types
    @Modifying
    @Transactional
    @Query("DELETE FROM ReadingList rl WHERE rl.user.id = :userId AND rl.story.id = :storyId AND rl.listType IN :listTypes")
    void deleteByUserIdAndStoryIdAndListTypeIn(@Param("userId") UUID userId,
            @Param("storyId") UUID storyId,
            @Param("listTypes") List<ReadingList.ListType> listTypes);

    // Check if exists
    boolean existsByUserIdAndStoryIdAndListType(UUID userId, UUID storyId, ReadingList.ListType listType);

    // Count by story and list type
    long countByStoryIdAndListType(UUID storyId, ReadingList.ListType listType);
}