import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { monetizationApi, PurchaseChapterRequest, PurchaseResponse } from '@/lib/api/monetization';

export const usePurchaseChapter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: PurchaseChapterRequest): Promise<PurchaseResponse> => {
      return monetizationApi.purchaseChapter(request);
    },
    onSuccess: (data, variables) => {
      // Invalidate chapter access queries
      queryClient.invalidateQueries({ queryKey: ['chapter-access'] });
      queryClient.invalidateQueries({ queryKey: ['chapter-access-batch'] });
      
      // Invalidate coin balance
      queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
      
      // Invalidate purchase history
      queryClient.invalidateQueries({ queryKey: ['purchase-history'] });
      
      // Invalidate library purchased content
      queryClient.invalidateQueries({ queryKey: ['reading-lists', 'purchased'] });
      
      toast.success('Chapter purchased successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to purchase chapter');
    },
  });
}; 