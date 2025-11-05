import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { appRoutes } from "./routeConfig";
import { RequireAuth } from "../components/RequireAuth";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const AppRoutes = () => {
	return (
		<Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
			<Routes>
				{appRoutes.map(({ path, element, requiresAuth }) => (
					<Route
						key={path}
						path={path}
						element={
							requiresAuth ? <RequireAuth>{element}</RequireAuth> : element
						}
					/>
				))}
			</Routes>
		</Suspense>
	);
};

export { AppRoutes };
