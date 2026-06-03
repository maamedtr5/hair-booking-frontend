import { QueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '../utils/apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests up to 3 times with exponential backoff
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      // Re-fetch on window focus (good for booking availability)
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Don't retry mutations by default — avoid duplicate submissions
      retry: 0,
      onError: (error) => {
        // Global mutation error handler — specific handlers can override in the hook
        console.error('[Mutation Error]', getErrorMessage(error));
      },
    },
  },
});