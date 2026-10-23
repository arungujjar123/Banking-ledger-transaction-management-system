import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Auth and permission errors will not fix themselves on retry
      retry: (failureCount, error) => ![401, 403, 404].includes(error?.status) && failureCount < 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});
