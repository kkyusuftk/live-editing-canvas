import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, helperText, id, className = "", ...props }, ref) => {
		const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

		return (
			<div className="w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={`
            appearance-none relative block w-full px-3 py-2 
            border rounded-md
            placeholder-gray-500 dark:placeholder-gray-400 
            text-gray-900 dark:text-white 
            bg-white dark:bg-gray-700
            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 
            sm:text-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
							error
								? "border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300 dark:border-gray-600"
						}
            ${className}
          `}
					aria-invalid={error ? "true" : "false"}
					aria-describedby={
						error
							? `${inputId}-error`
							: helperText
								? `${inputId}-helper`
								: undefined
					}
					{...props}
				/>
				{error && (
					<p
						id={`${inputId}-error`}
						className="mt-1 text-xs text-red-600 dark:text-red-400"
						role="alert"
					>
						{error}
					</p>
				)}
				{!error && helperText && (
					<p
						id={`${inputId}-helper`}
						className="mt-1 text-xs text-gray-500 dark:text-gray-400"
					>
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

Input.displayName = "Input";
