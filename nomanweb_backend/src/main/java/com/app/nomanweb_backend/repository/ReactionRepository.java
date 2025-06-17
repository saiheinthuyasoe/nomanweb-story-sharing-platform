package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, UUID> {

    List<Reaction> findByTargetTypeAndTargetId(Reaction.TargetType targetType, UUID targetId);

    Optional<Reaction> findByUserIdAndTargetTypeAndTargetId(UUID userId, Reaction.TargetType targetType, UUID targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(UUID userId, Reaction.TargetType targetType, UUID targetId);

    @Query("SELECT COUNT(r) FROM Reaction r WHERE r.targetType = :targetType AND r.targetId = :targetId")
    long countByTargetTypeAndTargetId(@Param("targetType") Reaction.TargetType targetType,
            @Param("targetId") UUID targetId);

    void deleteByUserIdAndTargetTypeAndTargetId(UUID userId, Reaction.TargetType targetType, UUID targetId);
}