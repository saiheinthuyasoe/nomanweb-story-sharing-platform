package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.RefundTransaction;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundTransactionRepository extends JpaRepository<RefundTransaction, UUID> {

    // Find by author
    Page<RefundTransaction> findByAuthorOrderByCreatedAtDesc(User author, Pageable pageable);

    // Find by buyer
    Page<RefundTransaction> findByBuyerOrderByCreatedAtDesc(User buyer, Pageable pageable);

    // Find by story
    List<RefundTransaction> findByStoryOrderByCreatedAtDesc(Story story);

    // Find by chapter
    List<RefundTransaction> findByChapterOrderByCreatedAtDesc(Chapter chapter);

    // Find by status
    Page<RefundTransaction> findByRefundStatusOrderByCreatedAtDesc(RefundTransaction.RefundStatus status,
            Pageable pageable);

    // Find by author and status
    List<RefundTransaction> findByAuthorAndRefundStatusOrderByCreatedAtDesc(User author,
            RefundTransaction.RefundStatus status);

    // Find by buyer and status
    List<RefundTransaction> findByBuyerAndRefundStatusOrderByCreatedAtDesc(User buyer,
            RefundTransaction.RefundStatus status);

    // Check if refund exists for specific purchase
    boolean existsByAuthorAndBuyerAndStoryAndRefundStatus(User author, User buyer, Story story,
            RefundTransaction.RefundStatus status);

    boolean existsByAuthorAndBuyerAndChapterAndRefundStatus(User author, User buyer, Chapter chapter,
            RefundTransaction.RefundStatus status);

    // Find refunds for book purchases (chapter is null)
    List<RefundTransaction> findByStoryAndBuyerAndChapterIsNullAndRefundStatus(Story story, User buyer,
            RefundTransaction.RefundStatus status);

    // Find refunds for chapter purchases
    List<RefundTransaction> findByStoryAndBuyerAndChapterAndRefundStatus(Story story, User buyer, Chapter chapter,
            RefundTransaction.RefundStatus status);

    // Get total pending refunds for author
    @Query("SELECT COALESCE(SUM(rt.refundAmount), 0) FROM RefundTransaction rt WHERE rt.author.id = :authorId AND rt.refundStatus = :status")
    java.math.BigDecimal getTotalRefundAmountByAuthorAndStatus(@Param("authorId") UUID authorId,
            @Param("status") RefundTransaction.RefundStatus status);

    // Get refund statistics
    @Query("SELECT COUNT(rt) FROM RefundTransaction rt WHERE rt.refundStatus = :status")
    long countByRefundStatus(@Param("status") RefundTransaction.RefundStatus status);
}