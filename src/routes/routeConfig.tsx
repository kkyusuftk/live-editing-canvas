import { lazy } from "react";
import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";

export type AppRouteItem = {
	path: string;
	element: ReactElement;
	requiresAuth?: boolean;
};

const RootRedirect = () => {
	const { session } = useAuthStore();
	return <Navigate to={session ? "/home" : "/login"} replace />;
};

const LoginPage = lazy(() =>
	import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
	import("../pages/SignupPage").then((m) => ({ default: m.SignupPage })),
);
const HomePage = lazy(() =>
	import("../pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const SlideEditorPage = lazy(() =>
	import("../pages/SlideEditorPage").then((m) => ({
		default: m.SlideEditorPage,
	})),
);

export const appRoutes: AppRouteItem[] = [
	{ path: "/login", element: <LoginPage /> },
	{ path: "/signup", element: <SignupPage /> },
	{ path: "/home", element: <HomePage />, requiresAuth: true },
	{ path: "/slide/:slideId", element: <SlideEditorPage />, requiresAuth: true },
	{ path: "/", element: <RootRedirect /> },
	{ path: "*", element: <Navigate to="/" replace /> },
];
