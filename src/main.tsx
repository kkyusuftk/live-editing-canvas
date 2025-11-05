import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { LiveblocksProvider } from "@liveblocks/react/suspense";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<LiveblocksProvider
			publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY}
		>
			<QueryClientProvider client={queryClient}>
				<App />
				{import.meta.env.DEV ? (
					<ReactQueryDevtools initialIsOpen={false} />
				) : null}
			</QueryClientProvider>
		</LiveblocksProvider>
	</StrictMode>,
);
