package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    // Find notifications by user
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Find unread notifications by user
    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Count unread notifications
    long countByUserIdAndIsReadFalse(UUID userId);

    // Find notifications by type
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, Notification.NotificationType type);

    // Find notifications by related content
    List<Notification> findByRelatedTypeAndRelatedIdOrderByCreatedAtDesc(
            Notification.RelatedType relatedType, UUID relatedId);

    // Mark all notifications as read for a user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);

    // Mark specific notification as read
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :notificationId")
    void markAsRead(@Param("notificationId") UUID notificationId, @Param("readAt") LocalDateTime readAt);

    // Delete old notifications (cleanup)
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Find notifications for specific users (for batch operations)
    @Query("SELECT n FROM Notification n WHERE n.user.id IN :userIds AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadByUserIds(@Param("userIds") List<UUID> userIds);

    // Get notification statistics
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.type = :type")
    long countByUserIdAndType(@Param("userId") UUID userId, @Param("type") Notification.NotificationType type);
}