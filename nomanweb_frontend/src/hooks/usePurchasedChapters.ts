import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface PurchasedChapter {
  id: string;
  title: string;
  chapterNumber: number;
  coinPrice: number;
  purchasedAt: string;
  story: {
    id: string;
    title: string;
    coverImageUrl?: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

export const usePurchasedChapters = (enabled: boolean = true) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['purchased-chapters'],
    queryFn: async (): Promise<PurchasedChapter[]> => {
      const response = await fetch('/api/monetization/purchases/history?size=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchased chapters');
      }
      
      const data = await response.json();
      return data.content || [];
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 