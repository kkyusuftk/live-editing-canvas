import { useState, FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/auth";
import { Button, Input, Alert } from "../components/ui";

export function SignupPage() {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { signUp, loading, session, initialized } = useAuthStore();
	const navigate = useNavigate();

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

	const validateForm = () => {
		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address");
			return false;
		}

		// Username validation (3-24 characters)
		if (username.length < 3 || username.length > 24) {
			setError("Username must be between 3 and 24 characters");
			return false;
		}

		// Password validation (8+ characters)
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		// Validation
		if (!email || !username || !password) {
			setError("Please fill in all fields");
			return;
		}

		if (!validateForm()) {
			return;
		}

		const { error: signUpError } = await signUp(email, password, username);

		if (signUpError) {
			setError(signUpError.message);
			toast.error("Signup failed");
		} else {
			toast.success("Account created successfully!");
			// Redirect to home on successful signup
			navigate("/home");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						Create your account
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
							label="Email address"
							name="email"
							type="email"
							autoComplete="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							disabled={loading}
						/>
						<Input
							id="username"
							label="Username"
							name="username"
							type="text"
							autoComplete="username"
							required
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="username"
							helperText="3-24 characters"
							disabled={loading}
						/>
						<Input
							id="password"
							label="Password"
							name="password"
							type="password"
							autoComplete="new-password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							helperText="At least 8 characters"
							disabled={loading}
						/>
					</div>

					<div>
						<Button type="submit" disabled={loading} fullWidth>
							{loading ? "Creating account..." : "Create account"}
						</Button>
					</div>

					<div className="text-center">
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Already have an account?{" "}
							<Link
								to="/login"
								className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
							>
								Log in
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
}
