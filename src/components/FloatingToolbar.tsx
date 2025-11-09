import { Button } from "./ui";
import { PlusIcon } from "@radix-ui/react-icons";

interface FloatingToolbarProps {
	onAddText: () => void;
	onAddSlide: () => void;
	isAddTextDisabled?: boolean;
}

export function FloatingToolbar({
	onAddText,
	onAddSlide,
	isAddTextDisabled = false,
}: FloatingToolbarProps) {
	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
			<div className="pointer-events-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md px-3 py-2 flex items-center space-x-2">
				{/* Add Text */}
				<Button
					onClick={onAddText}
					size="sm"
					variant="secondary"
					className="rounded-full"
					disabled={isAddTextDisabled}
				>
					<span className="flex items-center">
						<PlusIcon className="mr-1.5" />
						Add text
					</span>
				</Button>

				{/* Add Slide */}
				<Button
					onClick={onAddSlide}
					size="sm"
					className="rounded-full"
				>
					<span className="flex items-center">
						<PlusIcon className="mr-1.5" />
						Add slide
					</span>
				</Button>
			</div>
		</div>
	);
}

