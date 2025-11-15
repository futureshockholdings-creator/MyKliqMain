import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { enterpriseFetch, enterpriseApiRequest } from "./enterprise/enterpriseFetch";
import { performanceMonitor } from "./enterprise/performanceMonitor";

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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Use enterprise fetch for optimized caching, deduplication, and resilience
      // (cache tracking handled inside enterpriseFetch/enhancedCache)
      const data = await enterpriseFetch<T>(queryKey.join("/") as string, {
        credentials: "include",
      });
      
      return data;
    } catch (error: any) {
      // Handle 401 unauthorized
      if (unauthorizedBehavior === "returnNull" && error?.message?.includes('401')) {
        return null;
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,      // 5 minutes instead of Infinity for better data freshness
      gcTime: 10 * 60 * 1000,        // Garbage collect after 10 minutes to prevent memory leaks
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors or client errors
        if (error?.message?.includes('401') || error?.message?.includes('403')) return false;
        if (error?.message?.includes('400')) return false;
        return failureCount < 2; // Only retry twice for network issues
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
