import { DotsVerticalIcon, ImageIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { Deck } from "../types/deckTypes";

interface DeckCardProps {
	deck: Deck;
	onClick: () => void;
	onDelete?: () => void;
	deleting?: boolean;
}

export function DeckCard({
	deck,
	onClick,
	onDelete,
	deleting = false,
}: DeckCardProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!menuRef.current) return;
			if (menuRef.current.contains(event.target as Node)) return;
			setMenuOpen(false);
		};
		if (menuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [menuOpen]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInHours = diffInMs / (1000 * 60 * 60);

		if (diffInHours < 24) {
			const hours = Math.floor(diffInHours);
			if (hours === 0) {
				const minutes = Math.floor(diffInMs / (1000 * 60));
				return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
			}
			return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
		} else if (diffInHours < 48) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
			});
		}
	};

	return (
		<div className="relative">
			{/* Action menu */}
			<div className="absolute top-2 right-2 z-10" ref={menuRef}>
				<button
					type="button"
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					onClick={(e) => {
						e.stopPropagation();
						setMenuOpen((v) => !v);
					}}
					className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{/* Dots icon */}
					<DotsVerticalIcon className="w-5 h-5" />
				</button>
				{menuOpen && (
					<div
						role="menu"
						className="absolute mt-2 w-44 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
					>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setMenuOpen(false);
								if (onDelete && !deleting) onDelete();
							}}
							disabled={deleting}
							className={`w-full text-left px-3 py-2 text-sm ${
								deleting
									? "text-red-400 cursor-not-allowed"
									: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
							}`}
						>
							{deleting ? "Deleting…" : "Delete deck"}
						</button>
					</div>
				)}
			</div>

			{/* Clickable card area */}
			<div
				onClick={onClick}
				className="w-full cursor-pointer text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
			>
				<div className="flex items-start justify-between">
					<div className="flex-1 min-w-0">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-2">
							{deck.title}
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Last edited {formatDate(deck.updated_at)}
						</p>
					</div>
				</div>

				{/* Placeholder for thumbnail - future enhancement */}
				<div className="mt-4 aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-md flex items-center justify-center">
					<ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
				</div>
			</div>
		</div>
	);
}
