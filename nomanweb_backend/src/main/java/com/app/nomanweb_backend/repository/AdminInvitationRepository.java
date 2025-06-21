package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.AdminInvitation;
import com.app.nomanweb_backend.entity.AdminInvitation.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminInvitationRepository extends JpaRepository<AdminInvitation, UUID> {

    Optional<AdminInvitation> findByInvitationToken(String invitationToken);

    Optional<AdminInvitation> findByEmailAndStatus(String email, Status status);

    List<AdminInvitation> findByStatus(Status status);

    Page<AdminInvitation> findByStatusOrderByCreatedAtDesc(Status status, Pageable pageable);

    Page<AdminInvitation> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByEmailAndStatus(String email, Status status);

    @Query("SELECT ai FROM AdminInvitation ai WHERE ai.status = 'PENDING' AND ai.expiresAt < :now")
    List<AdminInvitation> findExpiredInvitations(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE AdminInvitation ai SET ai.status = 'EXPIRED' WHERE ai.status = 'PENDING' AND ai.expiresAt < :now")
    int markExpiredInvitations(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(ai) FROM AdminInvitation ai WHERE ai.status = :status")
    long countByStatus(@Param("status") Status status);

    @Query("SELECT ai FROM AdminInvitation ai WHERE ai.invitedBy.id = :inviterId ORDER BY ai.createdAt DESC")
    List<AdminInvitation> findByInviterId(@Param("inviterId") UUID inviterId);
}