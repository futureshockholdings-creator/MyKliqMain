import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { enterpriseFetch, enterpriseApiRequest } from "./enterprise/enterpriseFetch";
import { performanceMonitor } from "./enterprise/performanceMonitor";
import { offlineStore } from "./offlineStore";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enterprise-optimized API request (uses request scheduler, circuit breaker, cache, performance monitor)
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  return enterpriseApiRequest(method, url, data);
}

type UnauthorizedBehavior = "returnNull" | "throw";
// Endpoints that should skip disk cache to ensure fresh data on page load
const SKIP_DISK_CACHE_ENDPOINTS = [
  '/api/auth/user',  // User profile data must always be fresh after mutations
];

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    try {
      const url = queryKey.join("/") as string;
      
      // Skip disk cache for critical endpoints that need fresh data on page load
      const skipDisk = SKIP_DISK_CACHE_ENDPOINTS.some(ep => url.includes(ep));
      
      // Use enterprise fetch for optimized caching, deduplication, and resilience
      const data = await enterpriseFetch<T>(url, {
        credentials: "include",
        skipDisk,  // Skip IndexedDB cache for critical user data
      });
      
      return data;
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error?.message?.includes('401')) {
        return null as T;
      }

      if (offlineStore.shouldCache(url)) {
        const isNetworkError = error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError') ||
          error?.message?.includes('Load failed') ||
          !offlineStore.getOnlineStatus();

        if (isNetworkError) {
          const offlineData = await offlineStore.getOfflineData<T>(url);
          if (offlineData !== null) {
            console.log(`[QueryFn] Serving offline data for ${url}`);
            return offlineData;
          }
        }
      }

      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,      // 5 minutes instead of Infinity for better data freshness
      gcTime: 10 * 60 * 1000,        // Garbage collect after 10 minutes to prevent memory leaks
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
        if (error?.message?.includes('400')) return false;
        if (!offlineStore.getOnlineStatus()) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry client errors
        if (error?.message?.includes('400') || error?.message?.includes('401') || error?.message?.includes('403')) return false;
        return failureCount < 1; // Only retry once for mutations
      },
    },
  },
});
