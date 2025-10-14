import { useQuery } from '@tanstack/react-query';
import { homepageService } from '../services/homepageService';

export interface HomepageData {
  newReleases: any;
  bestRating: any;
  weeklyFeatures: any;
  bestOfAllTime: any;
  recommended: any;
  homepageCarousel: any;
  adventure: any;
  comedy: any;
  drama: any;
  fantasy: any;
  horror: any;
  mystery: any;
  romance: any;
  scienceFiction: any;
  thriller: any;
  youngAdult: any;
}

export const useHomepageData = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['homepage-all-sections', page, size],
    queryFn: () => homepageService.getAllHomepageSections(page, size),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
};

// Individual section hooks for specific use cases
export const useNewReleases = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['new-releases', page, size],
    queryFn: () => homepageService.getNewReleases(page, size),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useBestRating = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['best-rating', page, size],
    queryFn: () => homepageService.getBestRating(page, size),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useWeeklyFeatures = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['weekly-features', page, size],
    queryFn: () => homepageService.getWeeklyFeatures(page, size),
    staleTime: 2 * 60 * 1000, // 2 minutes for weekly features (more dynamic)
    gcTime: 5 * 60 * 1000,
  });
};

export const useBestOfAllTime = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['best-of-all-time', page, size],
    queryFn: () => homepageService.getBestOfAllTime(page, size),
    staleTime: 15 * 60 * 1000, // 15 minutes (less dynamic)
    gcTime: 30 * 60 * 1000,
  });
};

export const useRecommended = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['recommended', page, size],
    queryFn: () => homepageService.getRecommended(page, size),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCarousel = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['carousel', page, size],
    queryFn: () => homepageService.getCarousel(page, size),
    staleTime: 10 * 60 * 1000, // 10 minutes for carousel
    gcTime: 20 * 60 * 1000,
  });
};

// Genre-specific hooks
export const useAdventure = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['adventure', page, size],
    queryFn: () => homepageService.getAdventure(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useComedy = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['comedy', page, size],
    queryFn: () => homepageService.getComedy(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useDrama = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['drama', page, size],
    queryFn: () => homepageService.getDrama(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useFantasy = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['fantasy', page, size],
    queryFn: () => homepageService.getFantasy(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useHorror = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['horror', page, size],
    queryFn: () => homepageService.getHorror(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useMystery = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['mystery', page, size],
    queryFn: () => homepageService.getMystery(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useRomance = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['romance', page, size],
    queryFn: () => homepageService.getRomance(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useScienceFiction = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['science-fiction', page, size],
    queryFn: () => homepageService.getScienceFiction(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useThriller = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['thriller', page, size],
    queryFn: () => homepageService.getThriller(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};

export const useYoungAdult = (page: number = 0, size: number = 12) => {
  return useQuery({
    queryKey: ['young-adult', page, size],
    queryFn: () => homepageService.getYoungAdult(page, size),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};