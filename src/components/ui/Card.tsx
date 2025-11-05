import { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
	({ children, noPadding = false, className = "", ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={`bg-white dark:bg-gray-800 shadow rounded-lg ${
					noPadding ? "" : "p-6"
				} ${className}`}
				{...props}
			>
				{children}
			</div>
		);
	},
);

Card.displayName = "Card";
