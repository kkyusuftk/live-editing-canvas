import { useEffect, useRef, useState } from "react";
import {
	RoomProvider,
	ClientSideSuspense,
	useStorage,
	useMutation,
	useRoom,
	useUpdateMyPresence,
} from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { CanvasText } from "./CanvasText";
import { SlideCursors } from "./SlideCursors";
import { PresenceMouseTracker } from "./PresenceMouseTracker";
import { ElementToolbar } from "./ElementToolbar";
import { getSlideRoomId, createInitialStorage, deserializeStorage, getUserDisplayName, generateUserColor } from "../lib/liveblocks";
import type { TextElement } from "../types/liveblocks";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { useSlideStoragePersistence } from "../hooks/useSlideStoragePersistence";
import { fetchSlideStorage } from "../lib/api/decksApi";
import { useAuthStore } from "../store/auth";

interface LiveSlideCanvasProps {
	slideId: string;
	isActive: boolean;
	onActivate: () => void;
	selectedElement: { slideId: string; elementId: string } | null;
	onSelectElement: (elementId: string) => void;
	editingElementId: string | null;
	onStartEditing: (elementId: string) => void;
	onStopEditing: () => void;
	addTextTrigger?: number;
}

function LiveSlideCanvasInner({
	slideId,
	isActive,
	onActivate,
	selectedElement,
	onSelectElement,
	editingElementId,
	onStartEditing,
	onStopEditing,
	addTextTrigger,
}: LiveSlideCanvasProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [dragState, setDragState] = useState<{
		elementId: string;
		offsetXPercent: number;
		offsetYPercent: number;
	} | null>(null);
	const room = useRoom();
	const [isSeeded, setIsSeeded] = useState(false);
	const lastAddTextTriggerRef = useRef(0);
	const updateMyPresence = useUpdateMyPresence();
	const { user } = useAuthStore();

	// Set user info in presence when component mounts
	useEffect(() => {
		if (user) {
			console.log("user", user);
			const userName = getUserDisplayName(user);
			const userColor = generateUserColor();
			
			updateMyPresence({
				user: {
					name: userName,
					color: userColor,
				},
			});
		}
	}, [user, updateMyPresence]);

	// Enable automatic persistence to Supabase
	useSlideStoragePersistence(slideId);

	// Seed initial data from Supabase on first load
	useEffect(() => {
		if (isSeeded) return;

		(async () => {
			const { data: storageJson } = await fetchSlideStorage(slideId);
			
			if (storageJson) {
				const { elements: elementsMap } = deserializeStorage(storageJson);
				
				// Populate Liveblocks storage with initial data
				const storage = await room.getStorage();
				const elementsLiveMap = storage.root.get("elements");
				
				if (elementsLiveMap && elementsLiveMap.size === 0) {
					// Only seed if storage is empty
					elementsMap.forEach((element, id) => {
						elementsLiveMap.set(id, new LiveObject(element));
					});
				}
			}
			
			setIsSeeded(true);
		})();
	}, [slideId, room, isSeeded]);

	// Get elements from Liveblocks storage
	const elements = useStorage((root) => {
		const elementsMap = root.elements;
		const result: TextElement[] = [];
		elementsMap.forEach((element) => {
			result.push({
				id: element.id,
				type: element.type,
				content: element.content,
				xPercent: element.xPercent,
				yPercent: element.yPercent,
				fontSize: element.fontSize,
				isBold: element.isBold,
				isItalic: element.isItalic,
			});
		});
		return result;
	});

	// Mutation to add a new element
	const addElement = useMutation(({ storage }, element: TextElement) => {
		const elementsMap = storage.get("elements");
		elementsMap.set(element.id, new LiveObject(element));
		storage.get("metadata").set("lastModified", Date.now());
	}, []);

	// Handle add text trigger from parent
	useEffect(() => {
		if (!addTextTrigger || addTextTrigger === 0) return;
		if (addTextTrigger === lastAddTextTriggerRef.current) return;

		lastAddTextTriggerRef.current = addTextTrigger;

		const newElement: TextElement = {
			id: crypto.randomUUID(),
			type: "text",
			content: "New Text",
			xPercent: 50,
			yPercent: 50,
			fontSize: 20,
			isBold: false,
			isItalic: false,
		};
    console.log("newElement", newElement);
		addElement(newElement);
		onSelectElement(newElement.id);
		onStartEditing(newElement.id);
	}, [addTextTrigger]);

	// Mutation to update an element
	const updateElement = useMutation(
		({ storage }, elementId: string, updates: Partial<TextElement>) => {
			const elementsMap = storage.get("elements");
			const element = elementsMap.get(elementId);
			if (element) {
				Object.entries(updates).forEach(([key, value]) => {
					element.set(key as keyof TextElement, value);
				});
				storage.get("metadata").set("lastModified", Date.now());
			}
		},
		[],
	);

	// Mutation to delete an element
	const deleteElement = useMutation(({ storage }, elementId: string) => {
		const elementsMap = storage.get("elements");
		elementsMap.delete(elementId);
		storage.get("metadata").set("lastModified", Date.now());
	}, []);

	// Handle element dragging
	useEffect(() => {
		if (!dragState) return;

		const handleMove = (e: MouseEvent) => {
			const slideEl = containerRef.current;
			if (!slideEl) return;

			const rect = slideEl.getBoundingClientRect();
			const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
			const pointerY = ((e.clientY - rect.top) / rect.height) * 100;

			let nextX = pointerX - dragState.offsetXPercent;
			let nextY = pointerY - dragState.offsetYPercent;
			nextX = Math.max(0, Math.min(100, nextX));
			nextY = Math.max(0, Math.min(100, nextY));

			updateElement(dragState.elementId, {
				xPercent: nextX,
				yPercent: nextY,
			});
		};

		const stop = () => setDragState(null);

		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", stop);
		window.addEventListener("mouseleave", stop);

		return () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", stop);
			window.removeEventListener("mouseleave", stop);
		};
	}, [dragState, updateElement]);

	const handleElementMouseDown = (
		element: TextElement,
		e: React.MouseEvent,
	) => {
		e.preventDefault();
		const slideEl = containerRef.current;
		if (!slideEl) return;

		const rect = slideEl.getBoundingClientRect();
		const pointerXPercent = ((e.clientX - rect.left) / rect.width) * 100;
		const pointerYPercent = ((e.clientY - rect.top) / rect.height) * 100;
		const offsetXPercent = pointerXPercent - element.xPercent;
		const offsetYPercent = pointerYPercent - element.yPercent;

		setDragState({
			elementId: element.id,
			offsetXPercent,
			offsetYPercent,
		});
	};

	return (
		<>
			<div
				ref={containerRef}
				onClick={(e) => {
					onActivate();
					// Clear selection if clicking on empty canvas area
					if (e.target === e.currentTarget) {
						onSelectElement("");
					}
				}}
				className={`w-full max-w-5xl aspect-video bg-white dark:bg-gray-800 rounded-lg shadow ${
					isActive
						? "ring-2 ring-blue-500"
						: "border border-gray-200 dark:border-gray-700"
				} relative cursor-pointer`}
			>
				{isActive && containerRef.current && <PresenceMouseTracker activeSlideId={slideId} slideContainerRefs={{ current: { [slideId]: containerRef.current } }} />}
			
			{/* Render elements */}
			{elements.map((el) => (
				<div
					key={el.id}
					className="absolute group cursor-move"
					style={{
						left: `${el.xPercent}%`,
						top: `${el.yPercent}%`,
						transform: "translate(-50%, -50%)",
					}}
					onDragStart={(ev) => ev.preventDefault()}
					onClick={(e) => {
						e.stopPropagation();
						onSelectElement(el.id);
					}}
					onDoubleClick={(e) => {
						e.stopPropagation();
						onStartEditing(el.id);
						onSelectElement(el.id);
						const node = (e.currentTarget as HTMLElement).querySelector(
							`[data-canvas-text="true"][data-element-id="${el.id}"]`,
						) as HTMLElement | null;
						if (node) {
							node.focus();
							const sel = window.getSelection();
							const range = document.createRange();
							range.selectNodeContents(node);
							range.collapse(false);
							sel?.removeAllRanges();
							sel?.addRange(range);
						}
					}}
					onMouseDownCapture={(e) => {
						const t = e.target as HTMLElement;
						if (t && t.closest('[data-inline-toolbar="true"]')) return;
						if (t && t.closest('[data-canvas-text="true"]')) {
							if ((e as any).detail >= 2) return;
						}
						if (editingElementId !== el.id) handleElementMouseDown(el, e);
					}}
				>
					{el.type === "text" && (
						<>
							{selectedElement?.elementId === el.id &&
								selectedElement?.slideId === slideId && (
									<ElementToolbar
										element={el}
										onUpdateElement={updateElement}
										onDeleteElement={(elementId) => {
											deleteElement(elementId);
											onSelectElement("");
										}}
									/>
								)}

							<CanvasText
								content={el.content}
								className={`px-2 py-1 text-gray-900 dark:text-white bg-white/70 dark:bg-gray-900/50 rounded border ${
									selectedElement?.elementId === el.id &&
									selectedElement?.slideId === slideId
										? "border-blue-400 ring-2 ring-blue-200"
										: "border-gray-200 dark:border-gray-700"
								} outline-none focus:ring-2 focus:ring-blue-500`}
								style={{
									fontWeight: el.isBold ? 700 : 400,
									fontStyle: el.isItalic ? "italic" : "normal",
									fontSize: `${el.fontSize ?? 20}px`,
								}}
								isEditing={editingElementId === el.id}
								elementId={el.id}
								onInputText={(text) => {
									updateElement(el.id, { content: text });
								}}
								onFocus={() => {
									onStartEditing(el.id);
									onSelectElement(el.id);
								}}
								onBlur={onStopEditing}
							/>
						</>
					)}
				</div>
			))}

			{/* Others' cursors for this slide */}
			{isActive && <SlideCursors slideId={slideId} />}
			</div>
		</>
	);
}

export function LiveSlideCanvas(props: LiveSlideCanvasProps) {
	const roomId = getSlideRoomId(props.slideId);

	return (
		<RoomProvider
			id={roomId}
			initialPresence={{
				cursor: null,
				slideId: props.slideId,
				selection: null,
				user: null,
			}}
			initialStorage={createInitialStorage}
		>
			<ClientSideSuspense
				fallback={
					<div className="w-full max-w-5xl aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg shadow flex items-center justify-center">
						<LoadingSpinner />
					</div>
				}
			>
				<LiveSlideCanvasInner {...props} />
			</ClientSideSuspense>
		</RoomProvider>
	);
}

