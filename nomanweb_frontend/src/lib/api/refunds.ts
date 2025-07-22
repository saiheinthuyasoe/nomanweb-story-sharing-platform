import { apiClient } from './client';
import { 
  RefundRequest, 
  RefundCalculationResponse, 
  RefundTransaction, 
  RefundListResponse 
} from '@/types/refund';

export const refundApi = {
  // Refund calculations
  async calculateStoryRefund(storyId: string): Promise<RefundCalculationResponse> {
    const response = await apiClient.post(`/refunds/stories/${storyId}/calculate`);
    return response.data;
  },

  async calculateChapterRefund(chapterId: string): Promise<RefundCalculationResponse> {
    const response = await apiClient.post(`/refunds/chapters/${chapterId}/calculate`);
    return response.data;
  },

  async calculatePricingChangeRefund(storyId: string, newPricingType: string): Promise<RefundCalculationResponse> {
    const response = await apiClient.post(`/refunds/stories/${storyId}/pricing-change/calculate?newPricingType=${newPricingType}`);
    return response.data;
  },

  async checkPricingChangeRequiresRefund(storyId: string, newPricingType: string): Promise<boolean> {
    const response = await apiClient.post(`/refunds/stories/${storyId}/pricing-change/check?newPricingType=${newPricingType}`);
    return response.data;
  },

  // Refund initiation
  async initiateStoryRefund(storyId: string, request: RefundRequest): Promise<RefundTransaction[]> {
    const response = await apiClient.post(`/refunds/stories/${storyId}/initiate`, request);
    return response.data;
  },

  async initiateChapterRefund(chapterId: string, request: RefundRequest): Promise<RefundTransaction[]> {
    const response = await apiClient.post(`/refunds/chapters/${chapterId}/initiate`, request);
    return response.data;
  },

  // Refund management
  async getAuthorRefunds(page: number = 0, size: number = 20): Promise<RefundListResponse> {
    const response = await apiClient.get('/refunds/author/my-refunds', {
      params: { page, size }
    });
    return response.data;
  },

  async getBuyerRefunds(page: number = 0, size: number = 20): Promise<RefundListResponse> {
    const response = await apiClient.get('/refunds/buyer/my-refunds', {
      params: { page, size }
    });
    return response.data;
  },

  async getRefundById(refundId: string): Promise<RefundTransaction> {
    const response = await apiClient.get(`/refunds/${refundId}`);
    return response.data;
  },

  // Protection status
  async getStoryProtectionStatus(storyId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking story protection status for: ${storyId}`);
      const response = await apiClient.get(`/refunds/stories/${storyId}/protection-status`);
      console.log(`💰 Story protection status response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error checking story protection status for ${storyId}:`, error);
      throw error;
    }
  },

  async getChapterProtectionStatus(chapterId: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking chapter protection status for: ${chapterId}`);
      const response = await apiClient.get(`/refunds/chapters/${chapterId}/protection-status`);
      console.log(`💰 Chapter protection status response:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error checking chapter protection status for ${chapterId}:`, error);
      throw error;
    }
  },

  // Admin operations
  async getPendingRefunds(page: number = 0, size: number = 20): Promise<RefundListResponse> {
    const response = await apiClient.get('/admin/refunds/pending', {
      params: { page, size }
    });
    return response.data;
  },

  async approveRefund(refundId: string): Promise<RefundTransaction> {
    const response = await apiClient.post(`/admin/refunds/${refundId}/approve`);
    return response.data;
  },

  async rejectRefund(refundId: string, reason: string): Promise<RefundTransaction> {
    const response = await apiClient.post(`/admin/refunds/${refundId}/reject`, { reason });
    return response.data;
  },

  async executeRefund(refundId: string): Promise<void> {
    await apiClient.post(`/admin/refunds/${refundId}/execute`);
  }
}; 