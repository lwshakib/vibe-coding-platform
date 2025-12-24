"use client";

// Mock TRPC for UI demonstration
export const trpc = {
  getMessages: {
    useQuery: (params: { stackId: string }) => {
      return {
        data: { data: [] },
        isLoading: false,
      };
    },
  },
  useUtils: () => ({
    getStackDetails: {
      invalidate: async () => {},
    },
  }),
  updateStack: {
    useMutation: () => ({
      mutateAsync: async () => {},
    }),
  },
};
