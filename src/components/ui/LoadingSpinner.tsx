export interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	message?: string;
	fullScreen?: boolean;
}

export function LoadingSpinner({
	size = "md",
	message,
	fullScreen = false,
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-12 w-12",
		lg: "h-16 w-16",
	};

	const spinner = (
		<>
			<div
				className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
			></div>
			{message && (
				<p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
			)}
		</>
	);

	if (fullScreen) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<div className="text-center">{spinner}</div>
			</div>
		);
	}

	return <div className="text-center">{spinner}</div>;
}
