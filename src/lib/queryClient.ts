import { QueryClient, QueryCache } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Request failed");
			console.error("[React Query] onError", error);
		},
	}),
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 30_000,
			gcTime: 5 * 60_000,
		},
		mutations: {
			retry: 0,
		},
	},
});
