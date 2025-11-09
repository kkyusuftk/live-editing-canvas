import { Button } from "./ui";
import { Cross1Icon, FontItalicIcon, FontBoldIcon, MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import type { TextElement } from "../types/liveblocks";

interface ElementToolbarProps {
	element: TextElement;
	onUpdateElement: (elementId: string, updates: Partial<TextElement>) => void;
	onDeleteElement: (elementId: string) => void;
}

export function ElementToolbar({
	element,
	onUpdateElement,
	onDeleteElement,
}: ElementToolbarProps) {
	return (
		<div
			className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 animate-slide-down-fade"
			data-inline-toolbar="true"
			onMouseDown={(e) => e.stopPropagation()}
		>
			<div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md px-2 py-1">
				<Button
					variant={element.isBold ? "primary" : "secondary"}
					size="sm"
					onlyIcon={true}
					onClick={() => {
						onUpdateElement(element.id, { isBold: !element.isBold });
					}}
				>
					<FontBoldIcon />
				</Button>
				<Button
					variant={element.isItalic ? "primary" : "secondary"}
					size="sm"
					onlyIcon={true}
					onClick={() => {
						onUpdateElement(element.id, { isItalic: !element.isItalic });
					}}
				>
					<FontItalicIcon />
				</Button>
				<div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
				<div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-md px-1 py-0.5 space-x-1 border border-gray-200 dark:border-gray-600">
					<Button
						variant="secondary"
						size="sm"
						onlyIcon={true}
						onClick={() => {
							onUpdateElement(element.id, {
								fontSize: Math.max(8, (element.fontSize ?? 20) - 2),
							});
						}}
						title="Decrease font size"
					>
						<MinusIcon />
					</Button>
					<span className="text-xs text-gray-700 dark:text-gray-300 w-10 text-center">
						{element.fontSize ?? 20}px
					</span>
					<Button
						variant="secondary"
						size="sm"
						onlyIcon={true}
						onClick={() => {
							onUpdateElement(element.id, {
								fontSize: Math.min(120, (element.fontSize ?? 20) + 2),
							});
						}}
						title="Increase font size"
					>
						<PlusIcon />
					</Button>
				</div>
				<div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
				<Button
					variant="danger"
					size="lg"
					onlyIcon={true}
					onClick={() => {
						onDeleteElement(element.id);
					}}
					title="Delete element"
				>
					<Cross1Icon />
				</Button>
			</div>
		</div>
	);
}

