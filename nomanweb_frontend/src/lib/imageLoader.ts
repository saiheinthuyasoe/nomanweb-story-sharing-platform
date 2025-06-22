export interface ImageLoadResult {
  success: boolean;
  url: string;
  error?: string;
}

export const preloadImage = (src: string): Promise<ImageLoadResult> => {
  return new Promise((resolve) => {
    if (!src || !src.trim()) {
      const result = { success: false, url: src, error: 'Empty image URL' };
      resolve(result);
      return;
    }

    // Check cache first
    const cachedResult = getCachedImageResult(src);
    if (cachedResult) {
      resolve(cachedResult);
      return;
    }

    // Check if it's an external OAuth provider image that might be rate limited
    const isExternalOAuthImage = isOAuthImage(src);

    if (isExternalOAuthImage) {
      // Check rate limiting for OAuth images
      const domain = new URL(src).hostname;
      const now = Date.now();
      
      // Check global cooldown first
      const cooldownEnd = OAUTH_GLOBAL_COOLDOWN.get(domain) || 0;
      if (now < cooldownEnd) {
        const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
        logOAuthError(domain, `Provider in cooldown - ${remainingTime}s remaining`, false);
        const result = { 
          success: false, 
          url: src, 
          error: `OAuth provider in cooldown - ${remainingTime}s remaining` 
        };
        markImageAsCached(src, false, result.error);
        resolve(result);
        return;
      }
      
      const requests = oauthRequestTracker.get(domain) || [];
      
      // Clean old requests (older than 1 minute)
      const recentRequests = requests.filter(time => now - time < 60000);
      
      if (recentRequests.length >= OAUTH_MAX_REQUESTS_PER_MINUTE) {
        logOAuthError(domain, `Rate limit reached (${recentRequests.length}/${OAUTH_MAX_REQUESTS_PER_MINUTE} requests/min) - activating 5-minute cooldown`, true);
        // Set a 5-minute cooldown
        OAUTH_GLOBAL_COOLDOWN.set(domain, now + 5 * 60 * 1000);
        const result = { 
          success: false, 
          url: src, 
          error: 'OAuth provider rate limited - 5 minute cooldown activated' 
        };
        markImageAsCached(src, false, result.error);
        resolve(result);
        return;
      }
      
      // Track this request
      recentRequests.push(now);
      oauthRequestTracker.set(domain, recentRequests);
      
      // For external OAuth images, reduce timeout and handle errors gracefully
      logOAuthError(domain, 'Attempting to load external OAuth image - may be rate limited', false);
    }

    const img = new Image();
    
    const handleLoad = () => {
      cleanup();
      const result = { success: true, url: src };
      markImageAsCached(src, true);
      resolve(result);
    };

    const handleError = (e: any) => {
      cleanup();
      let errorMessage = isExternalOAuthImage 
        ? 'OAuth provider temporarily unavailable'
        : 'Failed to load image';
      
      // If it's an OAuth image error, trigger immediate cooldown
      if (isExternalOAuthImage) {
        const domain = new URL(src).hostname;
        const now = Date.now();
        // Set immediate 5-minute cooldown on any OAuth error
        OAUTH_GLOBAL_COOLDOWN.set(domain, now + 5 * 60 * 1000);
        errorMessage = 'OAuth provider rate limited - 5 minute cooldown activated';
        logOAuthError(domain, 'Image load failed - activating 5-minute cooldown', true);
      } else {
        console.error('Image load error:', errorMessage, e);
      }
      
      const result = { success: false, url: src, error: errorMessage };
      markImageAsCached(src, false, errorMessage);
      resolve(result);
    };

    const cleanup = () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };

    // Set up event listeners
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Add CORS for Cloudinary images only (external OAuth images may not support CORS)
    if (!isExternalOAuthImage) {
      img.crossOrigin = 'anonymous';
    }
    
    // Start loading
    img.src = src;

    // Shorter timeout for external OAuth images
    const timeout = isExternalOAuthImage ? 3000 : 10000; // Even shorter timeout
    setTimeout(() => {
      cleanup();
      let timeoutMessage = isExternalOAuthImage 
        ? 'External provider timeout (likely rate limited)'
        : 'Image load timeout';
      
      // If it's an OAuth timeout, trigger cooldown
      if (isExternalOAuthImage) {
        const domain = new URL(src).hostname;
        const now = Date.now();
        OAUTH_GLOBAL_COOLDOWN.set(domain, now + 5 * 60 * 1000);
        timeoutMessage = 'OAuth provider timeout - 5 minute cooldown activated';
        logOAuthError(domain, 'Image load timeout - activating 5-minute cooldown', true);
      }
      
      const result = { success: false, url: src, error: timeoutMessage };
      markImageAsCached(src, false, timeoutMessage);
      resolve(result);
    }, timeout);
  });
};

export const preloadImages = async (urls: string[]): Promise<ImageLoadResult[]> => {
  const promises = urls.map(url => preloadImage(url));
  return Promise.all(promises);
};

// Cache for loaded images to prevent re-loading
const imageCache = new Map<string, { success: boolean; timestamp: number; error?: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FAILED_CACHE_DURATION = 30 * 1000; // 30 seconds for failed images
const OAUTH_FAILED_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for OAuth failures (longer to prevent rate limiting)

// Rate limiting for OAuth providers
const oauthRequestTracker = new Map<string, number[]>();
const OAUTH_MAX_REQUESTS_PER_MINUTE = 3; // Very conservative limit
const OAUTH_GLOBAL_COOLDOWN = new Map<string, number>(); // Global cooldown per domain

// Add a silent error mode for OAuth rate limiting
const OAUTH_SILENT_ERRORS = new Set<string>(); // Track domains we've already warned about

const isOAuthImage = (url: string): boolean => {
  return url.includes('googleusercontent.com') || 
         url.includes('profile-cdn.line-scdn.net') ||
         url.includes('graph.facebook.com');
};

// Helper function to log OAuth errors only once per domain per session
const logOAuthError = (domain: string, message: string, isInitialError: boolean = false) => {
  const key = `${domain}-${isInitialError ? 'initial' : 'cooldown'}`;
  if (!OAUTH_SILENT_ERRORS.has(key)) {
    console.warn(`OAuth Image Loading: ${message} (Domain: ${domain})`);
    OAUTH_SILENT_ERRORS.add(key);
  }
};

export const isImageCached = (url: string): boolean => {
  const cached = imageCache.get(url);
  if (!cached) return false;
  
  const now = Date.now();
  const isOAuth = isOAuthImage(url);
  const maxAge = cached.success 
    ? CACHE_DURATION 
    : (isOAuth ? OAUTH_FAILED_CACHE_DURATION : FAILED_CACHE_DURATION);
  
  if (now - cached.timestamp > maxAge) {
    imageCache.delete(url);
    return false;
  }
  
  return true;
};

export const getCachedImageResult = (url: string): ImageLoadResult | null => {
  const cached = imageCache.get(url);
  if (!cached) return null;
  
  const now = Date.now();
  const isOAuth = isOAuthImage(url);
  const maxAge = cached.success 
    ? CACHE_DURATION 
    : (isOAuth ? OAUTH_FAILED_CACHE_DURATION : FAILED_CACHE_DURATION);
  
  if (now - cached.timestamp > maxAge) {
    imageCache.delete(url);
    return null;
  }
  
  return {
    success: cached.success,
    url: url,
    error: cached.error
  };
};

export const markImageAsCached = (url: string, success: boolean = true, error?: string): void => {
  imageCache.set(url, {
    success,
    timestamp: Date.now(),
    error
  });
};

export const removeFromImageCache = (url: string): void => {
  imageCache.delete(url);
};

export const clearImageCache = (): void => {
  imageCache.clear();
  oauthRequestTracker.clear();
  OAUTH_GLOBAL_COOLDOWN.clear();
  OAUTH_SILENT_ERRORS.clear();
};

export const shouldAttemptOAuthImageLoad = (url: string): boolean => {
  if (!isOAuthImage(url)) return true;
  
  const domain = new URL(url).hostname;
  const now = Date.now();
  
  // Check if in cooldown
  const cooldownEnd = OAUTH_GLOBAL_COOLDOWN.get(domain) || 0;
  if (now < cooldownEnd) {
    return false;
  }
  
  // Check recent requests
  const requests = oauthRequestTracker.get(domain) || [];
  const recentRequests = requests.filter(time => now - time < 60000);
  
  return recentRequests.length < OAUTH_MAX_REQUESTS_PER_MINUTE;
};

// Debug function - call from browser console
export const getOAuthStatus = () => {
  const now = Date.now();
  const status = {
    cooldowns: Array.from(OAUTH_GLOBAL_COOLDOWN.entries()).map(([domain, end]) => ({
      domain,
      cooldownEnds: new Date(end).toLocaleTimeString(),
      remainingMs: Math.max(0, end - now)
    })),
    recentRequests: Array.from(oauthRequestTracker.entries()).map(([domain, times]) => ({
      domain,
      requestsInLastMinute: times.filter(time => now - time < 60000).length,
      maxAllowed: OAUTH_MAX_REQUESTS_PER_MINUTE
    })),
    cacheSize: imageCache.size,
    silentErrorKeys: Array.from(OAUTH_SILENT_ERRORS)
  };
  console.log('OAuth Status:', status);
  console.table(status.cooldowns);
  console.table(status.recentRequests);
  return status;
};

// Function to reset OAuth cooldowns and errors (useful for testing)
export const resetOAuthStatus = () => {
  oauthRequestTracker.clear();
  OAUTH_GLOBAL_COOLDOWN.clear();
  OAUTH_SILENT_ERRORS.clear();
  console.log('OAuth status reset - all cooldowns and errors cleared');
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).clearImageCache = clearImageCache;
  (window as any).getOAuthStatus = getOAuthStatus;
  (window as any).resetOAuthStatus = resetOAuthStatus;
} 