import { ReactNode } from "react";

export interface AlertProps {
	children: ReactNode;
	variant?: "error" | "success" | "warning" | "info";
	className?: string;
}

export function Alert({
	children,
	variant = "info",
	className = "",
}: AlertProps) {
	const variantClasses = {
		error:
			"bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
		success:
			"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
		warning:
			"bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
		info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
	};

	return (
		<div
			className={`border px-4 py-3 rounded ${variantClasses[variant]} ${className}`}
			role="alert"
			aria-live="polite"
		>
			{children}
		</div>
	);
}
