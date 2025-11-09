import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { useAuthStore } from "./store/auth";

function App() {
	const { initialize, initialized } = useAuthStore();

	useEffect(() => {
		initialize();
	}, [initialize]);

	// Show loading while initializing
	if (!initialized) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<BrowserRouter>
			<Toaster position="bottom-right" />
			<AppRoutes />
		</BrowserRouter>
	);
}

export default App;
