import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Input } from "../components/ui";
import { useAuthStore } from "../store/auth";

export function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { signIn, loading, session, initialized } = useAuthStore();
	const navigate = useNavigate();
	const location = useLocation();

	const from =
		(location.state as { from?: { pathname: string } })?.from?.pathname ||
		"/home";

	// Redirect if already authenticated
	if (initialized && session) {
		return <Navigate to="/home" replace />;
	}

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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (!email || !password) {
			setError("Please fill in all fields");
			return;
		}

		const { error: signInError } = await signIn(email, password);

		if (signInError) {
			setError(signInError.message);
			toast.error("Login failed");
		} else {
			toast.success("Welcome back!");
			navigate(from, { replace: true });
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Sign in to your account
					</h2>
				</div>
				<form
					className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow"
					onSubmit={handleSubmit}
				>
					{error && <Alert variant="error">{error}</Alert>}

					<div className="space-y-4">
						<Input
							id="email"
							label="Email or Username"
							name="email"
							type="text"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email address"
							disabled={loading}
						/>
						<Input
							id="password"
							label="Password"
							name="password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							disabled={loading}
						/>
					</div>

					<div>
						<Button type="submit" disabled={loading} fullWidth>
							{loading ? "Signing in..." : "Sign in"}
						</Button>
					</div>

					<div className="text-center">
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Don't have an account?{" "}
							<Link
								to="/signup"
								className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
							>
								Sign up
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
}
