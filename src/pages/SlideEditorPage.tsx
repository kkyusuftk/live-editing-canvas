import { useEffect, useState, useRef, memo, useCallback } from "react";
import type { CSSProperties, FormEventHandler } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { updateSlideYDoc } from "../lib/api/decksApi";
import {
	useDeck,
	useUpdateDeckTitle,
	useUpdateDeckVisibility,
	useCreateSlide,
} from "../lib/queries/decksQueries";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Button, Modal } from "../components/ui";
import {
	RoomProvider,
	ClientSideSuspense,
	useOthers,
} from "@liveblocks/react/suspense";
import { useMyPresence } from "@liveblocks/react";
import { useAuthStore } from "../store/auth";
import {
	PlusIcon,
	Pencil1Icon,
	CheckIcon,
	Cross1Icon,
	ArrowLeftIcon,
} from "@radix-ui/react-icons";

export function SlideEditorPage() {
	const { slideId } = useParams<{ slideId: string }>();
	const navigate = useNavigate();
	const {
		data: deck,
		isLoading: loading,
		isError: deckIsError,
	} = useDeck(slideId ?? "");
	const error = !slideId
		? "No slide ID provided"
		: deckIsError
			? "Slide not found or you don't have access."
			: null;
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [editedTitle, setEditedTitle] = useState("");
	const [isSavingTitle, setIsSavingTitle] = useState(false);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const slidesEndRef = useRef<HTMLDivElement | null>(null);
	const insertMenuRef = useRef<HTMLDivElement | null>(null);
	const slideContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const initializedSlidesRef = useRef(false);

	type CanvasElement = {
		id: string;
		type: "text";
		content: string;
		xPercent: number;
		yPercent: number;
		fontSize?: number;
		isBold?: boolean;
		isItalic?: boolean;
	};

	type CanvasSlide = {
		id: string;
		elements: CanvasElement[];
	};

	const [canvasSlides, setCanvasSlides] = useState<CanvasSlide[]>([]);
	const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
	const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
	const [selectedElement, setSelectedElement] = useState<{
		slideId: string;
		elementId: string;
	} | null>(null);
	const [editingElementId, setEditingElementId] = useState<string | null>(null);
	const [dragState, setDragState] = useState<{
		slideId: string;
		elementId: string;
		offsetXPercent: number;
		offsetYPercent: number;
	} | null>(null);
	const saveTimersRef = useRef<Record<string, number | undefined>>({});
	const [confirmShareOpen, setConfirmShareOpen] = useState(false);

	const encodeElementsToBytes = (elements: CanvasElement[]): Uint8Array => {
		try {
			const json = JSON.stringify({ elements });
			return new TextEncoder().encode(json);
		} catch (e) {
			return new Uint8Array();
		}
	};

	const decodeUnknownToUint8Array = (value: unknown): Uint8Array | null => {
		try {
			if (value == null) return null;
			if (value instanceof Uint8Array) return value;
			if (value instanceof ArrayBuffer) return new Uint8Array(value);
			if (typeof value === "string") {
				if (value.startsWith("\\x")) {
					const hex = value.slice(2);
					const bytes = new Uint8Array(hex.length / 2);
					for (let i = 0; i < bytes.length; i++)
						bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
					return bytes;
				}
				try {
					const bin = atob(value);
					const bytes = new Uint8Array(bin.length);
					for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
					return bytes;
				} catch (_) {
					try {
						const arr = JSON.parse(value);
						if (Array.isArray(arr)) return new Uint8Array(arr);
					} catch (_) {}
				}
				return null;
			}
			if (Array.isArray(value)) return new Uint8Array(value as number[]);
			return null;
		} catch (_) {
			return null;
		}
	};

	const decodeElementsFromYDoc = (value: unknown): CanvasElement[] => {
		try {
			const bytes = decodeUnknownToUint8Array(value);
			if (!bytes || bytes.length === 0) return [];
			const json = new TextDecoder().decode(bytes);
			const parsed = JSON.parse(json);
			if (parsed && Array.isArray(parsed.elements)) return parsed.elements;
			return [];
		} catch (_) {
			return [];
		}
	};

	const scheduleSaveSlide = (slideId: string) => {
		const existing = saveTimersRef.current[slideId];
		if (existing) window.clearTimeout(existing);
		const timer = window.setTimeout(async () => {
			const slide = canvasSlides.find((s) => s.id === slideId);
			if (!slide) return;
			const bytes = encodeElementsToBytes(slide.elements);
			try {
				await updateSlideYDoc(slideId, bytes);
			} catch (e) {
				console.error("Failed to persist slide elements", e);
			}
		}, 800);
		saveTimersRef.current[slideId] = timer;
	};

	// Hooks must be declared before any early returns
	const updateTitleMutation = useUpdateDeckTitle();
	const updateVisibilityMutation = useUpdateDeckVisibility();
	const createSlideMutation = useCreateSlide();
	const totalSlides = canvasSlides.length;
	// Index helper (unused currently)
	const roomId = deck ? `deck_${deck.id}` : undefined;

	const { user } = useAuthStore();
	const isOwner = !!(deck && user && user.id === deck.owner_id);
	const deckVisibility: "private" | "users" =
		(deck as any)?.visibility ?? "private";

	// Close insert menu on outside click
	useEffect(() => {
		if (!isInsertMenuOpen) return;
		const handleClick = (e: MouseEvent) => {
			const container = insertMenuRef.current;
			if (container && !container.contains(e.target as Node)) {
				setIsInsertMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isInsertMenuOpen]);

	// Handle element dragging across the slide
	useEffect(() => {
		if (!dragState) return;
		const handleMove = (e: MouseEvent) => {
			const slideEl = slideContainerRefs.current[dragState.slideId];
			if (!slideEl) return;
			const rect = slideEl.getBoundingClientRect();
			const pointerX = ((e.clientX - rect.left) / rect.width) * 100;
			const pointerY = ((e.clientY - rect.top) / rect.height) * 100;
			let nextX = pointerX - dragState.offsetXPercent;
			let nextY = pointerY - dragState.offsetYPercent;
			nextX = Math.max(0, Math.min(100, nextX));
			nextY = Math.max(0, Math.min(100, nextY));
			setCanvasSlides((prev) =>
				prev.map((s) =>
					s.id === dragState.slideId
						? {
								...s,
								elements: s.elements.map((el) =>
									el.id === dragState.elementId
										? { ...el, xPercent: nextX, yPercent: nextY }
										: el,
								),
							}
						: s,
				),
			);
			// Debounced persistence
			scheduleSaveSlide(dragState.slideId);
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
	}, [dragState]);

	const handleElementMouseDown = (
		slideId: string,
		element: CanvasElement,
		e: React.MouseEvent,
	) => {
		e.preventDefault();
		const slideEl = slideContainerRefs.current[slideId];
		if (!slideEl) return;
		const rect = slideEl.getBoundingClientRect();
		const pointerXPercent = ((e.clientX - rect.left) / rect.width) * 100;
		const pointerYPercent = ((e.clientY - rect.top) / rect.height) * 100;
		const offsetXPercent = pointerXPercent - element.xPercent;
		const offsetYPercent = pointerYPercent - element.yPercent;
		setDragState({
			slideId,
			elementId: element.id,
			offsetXPercent,
			offsetYPercent,
		});
	};

	useEffect(() => {
		if (deckIsError) {
			toast.error("Could not load slide deck");
		}
	}, [deckIsError]);

	useEffect(() => {
		if (!deck || initializedSlidesRef.current) return;
		const mapped: CanvasSlide[] = (deck.slides || [])
			.sort((a, b) => a.position - b.position)
			.map((s) => ({ id: s.id, elements: decodeElementsFromYDoc(s.y_doc) }));
		if (mapped.length === 0) {
			const fallbackId = crypto?.randomUUID
				? crypto.randomUUID()
				: `${Date.now()}`;
			setCanvasSlides([{ id: fallbackId, elements: [] }]);
			setActiveSlideId(fallbackId);
		} else {
			setCanvasSlides(mapped);
			setActiveSlideId(mapped[0].id);
		}
		initializedSlidesRef.current = true;
	}, [deck]);

	const handleBack = () => {
		navigate("/home");
	};

	const handleStartEditingTitle = () => {
		if (deck) {
			setEditedTitle(deck.title);
			setIsEditingTitle(true);
			// Focus the input after it renders
			setTimeout(() => titleInputRef.current?.focus(), 0);
		}
	};

	const handleCancelEditingTitle = () => {
		setIsEditingTitle(false);
		setEditedTitle("");
	};

	const handleSaveTitle = async () => {
		if (!deck || !editedTitle.trim()) {
			toast.error("Title cannot be empty");
			return;
		}

		// If title hasn't changed, just exit edit mode
		if (editedTitle.trim() === deck.title) {
			setIsEditingTitle(false);
			return;
		}

		setIsSavingTitle(true);
		try {
			await updateTitleMutation.mutateAsync({
				deckId: deck.id,
				title: editedTitle.trim(),
			});
		} catch (_) {
			toast.error("Failed to update title");
			setIsSavingTitle(false);
			return;
		}
		setIsEditingTitle(false);
		setIsSavingTitle(false);
		toast.success("Title updated!");
	};

	const handleGlobalMouseDownCapture = (e: React.MouseEvent) => {
		if (!editingElementId) return;
		const t = e.target as HTMLElement;
		const inToolbar = !!t.closest('[data-inline-toolbar="true"]');
		const inCurrentText = !!t.closest(
			`[data-canvas-text="true"][data-element-id="${editingElementId}"]`,
		);
		if (inToolbar || inCurrentText) return;
		const active = document.activeElement as HTMLElement | null;
		if (active && active.hasAttribute("data-canvas-text")) {
			active.blur();
		}
		setEditingElementId(null);
	};

	const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSaveTitle();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancelEditingTitle();
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
				<LoadingSpinner />
			</div>
		);
	}

	if (error || !deck) {
		return (
			<div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
				{/* Top bar */}
				<div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
					<div className="flex items-center space-x-4">
						<Button
							variant="secondary"
							size="sm"
							onClick={handleBack}
							className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
							aria-label="Back to dashboard"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
						</Button>
						<h1 className="text-lg font-semibold text-gray-900 dark:text-white">
							Error
						</h1>
					</div>
				</div>

				{/* Error content */}
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="text-center">
						<svg
							className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
							{error || "Something went wrong"}
						</h2>
						<Button onClick={handleBack} className="mt-4">
							Back to Dashboard
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const handleAddSlide = () => {
		if (!deck) return;
		(async () => {
			try {
				const { slide: newSlideRow } = await createSlideMutation.mutateAsync({
					deckId: deck.id,
					position: canvasSlides.length,
				});
				if (!newSlideRow) {
					toast.error("Failed to add slide");
					return;
				}
				const newSlide: CanvasSlide = { id: newSlideRow.id, elements: [] };
				setCanvasSlides((prev) => [...prev, newSlide]);
				setActiveSlideId(newSlide.id);
				// Scroll to the bottom after the DOM updates
				setTimeout(() => {
					slidesEndRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "end",
					});
				}, 0);
				// Persist initial blank elements
				scheduleSaveSlide(newSlide.id);
			} catch (_) {
				toast.error("Failed to add slide");
			}
		})();
	};

	const handleInsertText = () => {
		if (!activeSlideId) return;
		const newElement: CanvasElement = {
			id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-text`,
			type: "text",
			content: "Double-click to edit",
			xPercent: 50,
			yPercent: 20,
			fontSize: 20,
			isBold: false,
			isItalic: false,
		};
		setCanvasSlides((prev) =>
			prev.map((s) =>
				s.id === activeSlideId
					? { ...s, elements: [...s.elements, newElement] }
					: s,
			),
		);
		scheduleSaveSlide(activeSlideId);
	};

	return (
		<div
			className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900"
			onMouseDownCapture={handleGlobalMouseDownCapture}
		>
			{/* Top bar */}
			<div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
				<div className="flex items-center space-x-4">
					<Button
						variant="secondary"
						size="sm"
						onClick={handleBack}
						className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label="Back to dashboard"
					>
						<ArrowLeftIcon className="w-5 h-5" />
					</Button>

					<div className="flex-1 min-w-0 flex items-center group">
						{isEditingTitle ? (
							<div className="flex items-center space-x-2 flex-1">
								<input
									ref={titleInputRef}
									type="text"
									value={editedTitle}
									onChange={(e) => setEditedTitle(e.target.value)}
									onKeyDown={handleTitleKeyDown}
									disabled={isSavingTitle}
									className="flex-1 px-3 py-1.5 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
									placeholder="Enter deck title"
									maxLength={100}
								/>
								<Button
									onClick={handleSaveTitle}
									disabled={isSavingTitle || !editedTitle.trim()}
									size="sm"
									className="p-2 rounded-md"
									aria-label="Save title"
									title="Save (Enter)"
								>
									<CheckIcon className="w-5 h-5" />
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleCancelEditingTitle}
									disabled={isSavingTitle}
									className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
									aria-label="Cancel editing"
									title="Cancel (Esc)"
								>
									<Cross1Icon className="w-5 h-5" />
								</Button>
							</div>
						) : (
							<>
								<h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
									{deck.title}
								</h1>
								<Button
									variant="secondary"
									size="sm"
									onClick={handleStartEditingTitle}
									className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:opacity-100"
									aria-label="Edit title"
									title="Edit title"
								>
									<Pencil1Icon className="w-5 h-5" />
								</Button>
							</>
						)}
					</div>

					<div className="flex items-center space-x-2">
						<span className="text-sm text-gray-500 dark:text-gray-400">
							{totalSlides} {totalSlides === 1 ? "slide" : "slides"}
						</span>
						{deck?.id && isOwner && (
							<div className="flex items-center space-x-2">
								{deckVisibility === "private" ? (
									<>
										<Button
											onClick={() => setConfirmShareOpen(true)}
											className="ml-2"
										>
											Share
										</Button>
										<Modal
											isOpen={confirmShareOpen}
											onModalClose={() => setConfirmShareOpen(false)}
											onClose={() => setConfirmShareOpen(false)}
											onConfirm={async () => {
												if (!deck) return;
												try {
													await updateVisibilityMutation.mutateAsync({
														deckId: deck.id,
														visibility: "users",
													});
												} catch (_) {
													toast.error("Failed to enable sharing");
													return;
												}
												const url = `${window.location.origin}/slide/${deck.id}`;
												await navigator.clipboard.writeText(url);
												toast.success("Sharing enabled. Link copied!");
												setConfirmShareOpen(false);
											}}
										>
											<div>
												<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
													Enable sharing?
												</h3>
												<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
													This will allow all authenticated users to view and
													edit this deck. We'll also copy a share link to your
													clipboard.
												</p>
											</div>
										</Modal>
									</>
								) : (
									<>
										<Button
											onClick={async () => {
												const url = `${window.location.origin}/slide/${deck.id}`;
												await navigator.clipboard.writeText(url);
												toast.success("Link copied!");
											}}
											className="ml-2"
										>
											Share
										</Button>
										<Button
											variant="secondary"
											onClick={async () => {
												const ok = window.confirm(
													"Disable sharing for all users? Collaborators will lose access.",
												);
												if (!ok) return;
												try {
													await updateVisibilityMutation.mutateAsync({
														deckId: deck.id,
														visibility: "private",
													});
												} catch (_) {
													toast.error("Failed to disable sharing");
													return;
												}
												toast.success("Sharing disabled");
											}}
										>
											Disable sharing
										</Button>
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{roomId ? (
				<RoomProvider id={roomId}>
					<ClientSideSuspense
						fallback={
							<div className="py-6">
								<LoadingSpinner />
							</div>
						}
					>
						<PresenceMouseTracker
							activeSlideId={activeSlideId}
							slideContainerRefs={slideContainerRefs}
						/>

						{/* Canvas area with vertical slides list */}
						<div className="flex-1 overflow-y-auto">
							<div className="mx-auto max-w-6xl px-4 py-8">
								<div className="flex flex-col items-center space-y-10">
									{canvasSlides.map((slide) => {
										const isActive = slide.id === activeSlideId;
										return (
											<div
												key={slide.id}
												onClick={() => setActiveSlideId(slide.id)}
												className={`w-full max-w-5xl aspect-video bg-white dark:bg-gray-800 rounded-lg shadow ${isActive ? "ring-2 ring-blue-500" : "border border-gray-200 dark:border-gray-700"} relative cursor-pointer`}
												ref={(el) => {
													slideContainerRefs.current[slide.id] = el;
												}}
											>
												{/* Render elements */}
												{slide.elements.map((el) => (
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
															setSelectedElement({
																slideId: slide.id,
																elementId: el.id,
															});
														}}
														onDoubleClick={(e) => {
															e.stopPropagation();
															setEditingElementId(el.id);
															setSelectedElement({
																slideId: slide.id,
																elementId: el.id,
															});
															const node = (
																e.currentTarget as HTMLElement
															).querySelector(
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
															if (
																t &&
																t.closest('[data-inline-toolbar="true"]')
															)
																return;
															// Allow focusing/editing on double-click inside the text content; single click still enables drag
															if (t && t.closest('[data-canvas-text="true"]')) {
																if ((e as any).detail >= 2) return;
															}
															if (editingElementId !== el.id)
																handleElementMouseDown(slide.id, el, e);
														}}
													>
														{el.type === "text" && (
															<>
																{selectedElement?.elementId === el.id &&
																	selectedElement?.slideId === slide.id && (
																		<div
																			className="absolute -top-14 left-1/2 -translate-x-1/2 z-10"
																			data-inline-toolbar="true"
																			onMouseDown={(e) => e.stopPropagation()}
																		>
																			<div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-md px-2 py-1">
																				<Button
																					variant={
																						el.isBold ? "primary" : "secondary"
																					}
																					size="sm"
																					onClick={() => {
																						setCanvasSlides((prev) =>
																							prev.map((s) =>
																								s.id === slide.id
																									? {
																											...s,
																											elements: s.elements.map(
																												(inner) =>
																													inner.id === el.id
																														? {
																																...inner,
																																isBold:
																																	!inner.isBold,
																															}
																														: inner,
																											),
																										}
																									: s,
																							),
																						);
																						scheduleSaveSlide(slide.id);
																					}}
																				>
																					<span className="font-bold">B</span>
																				</Button>
																				<Button
																					variant={
																						el.isItalic
																							? "primary"
																							: "secondary"
																					}
																					size="sm"
																					onClick={() => {
																						setCanvasSlides((prev) =>
																							prev.map((s) =>
																								s.id === slide.id
																									? {
																											...s,
																											elements: s.elements.map(
																												(inner) =>
																													inner.id === el.id
																														? {
																																...inner,
																																isItalic:
																																	!inner.isItalic,
																															}
																														: inner,
																											),
																										}
																									: s,
																							),
																						);
																						scheduleSaveSlide(slide.id);
																					}}
																				>
																					<span className="italic">I</span>
																				</Button>
																				<div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
																				<div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-md px-1 py-0.5 space-x-1 border border-gray-200 dark:border-gray-600">
																					<Button
																						variant="secondary"
																						size="sm"
																						onClick={() => {
																							setCanvasSlides((prev) =>
																								prev.map((s) =>
																									s.id === slide.id
																										? {
																												...s,
																												elements:
																													s.elements.map(
																														(inner) =>
																															inner.id === el.id
																																? {
																																		...inner,
																																		fontSize:
																																			Math.max(
																																				8,
																																				(inner.fontSize ??
																																					20) -
																																					2,
																																			),
																																	}
																																: inner,
																													),
																											}
																										: s,
																								),
																							);
																							scheduleSaveSlide(slide.id);
																						}}
																						title="Decrease font size"
																					>
																						-
																					</Button>
																					<span className="text-xs text-gray-700 dark:text-gray-300 w-10 text-center">
																						{el.fontSize ?? 20}px
																					</span>
																					<Button
																						variant="secondary"
																						size="sm"
																						onClick={() => {
																							setCanvasSlides((prev) =>
																								prev.map((s) =>
																									s.id === slide.id
																										? {
																												...s,
																												elements:
																													s.elements.map(
																														(inner) =>
																															inner.id === el.id
																																? {
																																		...inner,
																																		fontSize:
																																			Math.min(
																																				120,
																																				(inner.fontSize ??
																																					20) +
																																					2,
																																			),
																																	}
																																: inner,
																													),
																											}
																										: s,
																								),
																							);
																							scheduleSaveSlide(slide.id);
																						}}
																						title="Increase font size"
																					>
																						+
																					</Button>
																				</div>
																			</div>
																		</div>
																	)}

																<CanvasText
																	content={el.content}
																	className={`px-2 py-1 text-gray-900 dark:text-white bg-white/70 dark:bg-gray-900/50 rounded border ${selectedElement?.elementId === el.id && selectedElement?.slideId === slide.id ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200 dark:border-gray-700"} outline-none focus:ring-2 focus:ring-blue-500`}
																	style={{
																		fontWeight: el.isBold ? 700 : 400,
																		fontStyle: el.isItalic
																			? "italic"
																			: "normal",
																		fontSize: `${el.fontSize ?? 20}px`,
																	}}
																	isEditing={editingElementId === el.id}
																	elementId={el.id}
																	onInputText={(text) => {
																		setCanvasSlides((prev) =>
																			prev.map((s) =>
																				s.id === slide.id
																					? {
																							...s,
																							elements: s.elements.map(
																								(inner) =>
																									inner.id === el.id
																										? {
																												...inner,
																												content: text,
																											}
																										: inner,
																							),
																						}
																					: s,
																			),
																		);
																		scheduleSaveSlide(slide.id);
																	}}
																	onFocus={() => {
																		setEditingElementId(el.id);
																		setSelectedElement({
																			slideId: slide.id,
																			elementId: el.id,
																		});
																	}}
																	onBlur={() => {
																		setEditingElementId(null);
																	}}
																/>
															</>
														)}
													</div>
												))}

												{/* Others' cursors for this slide */}
												<SlideCursors slideId={slide.id} />
											</div>
										);
									})}
									<div ref={slidesEndRef} />
								</div>
							</div>
						</div>

						{/* Bottom floating toolbar */}
						<div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
							<div className="pointer-events-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-full px-3 py-2 flex items-center space-x-2">
								{/* Insert element button with hover menu */}
								<div className="relative" ref={insertMenuRef}>
									<Button
										variant="secondary"
										size="sm"
										className="rounded-full"
										onClick={() => setIsInsertMenuOpen((v) => !v)}
									>
										<span className="flex items-center">
											<PlusIcon className="mr-2" />
											Insert element
										</span>
									</Button>
									{isInsertMenuOpen && (
										<div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2">
											<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2 min-w-[160px]">
												<Button
													variant="secondary"
													size="sm"
													onClick={() => {
														handleInsertText();
														setIsInsertMenuOpen(false);
													}}
													className="w-full text-left px-3 py-2"
												>
													Text
												</Button>
											</div>
										</div>
									)}
								</div>

								{/* Divider */}
								<div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

								{/* Add Slide */}
								<Button
									onClick={handleAddSlide}
									size="sm"
									className="rounded-full"
								>
									<span className="flex items-center">
										<svg
											className="w-4 h-4 mr-1.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 4v16m8-8H4"
											/>
										</svg>
										Add slide
									</span>
								</Button>
							</div>
						</div>
					</ClientSideSuspense>
				</RoomProvider>
			) : (
				<>
					{/* Canvas area with vertical slides list (no presence as fallback) */}
					<div className="flex-1 overflow-y-auto">
						<div className="mx-auto max-w-6xl px-4 py-8">
							<div className="flex flex-col items-center space-y-10">
								{canvasSlides.map((slide) => {
									const isActive = slide.id === activeSlideId;
									return (
										<div
											key={slide.id}
											onClick={() => setActiveSlideId(slide.id)}
											className={`w-full max-w-5xl aspect-video bg-white dark:bg-gray-800 rounded-lg shadow ${isActive ? "ring-2 ring-blue-500" : "border border-gray-200 dark:border-gray-700"} relative cursor-pointer`}
											ref={(el) => {
												slideContainerRefs.current[slide.id] = el;
											}}
										>
											{slide.elements.map((el) => (
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
														setSelectedElement({
															slideId: slide.id,
															elementId: el.id,
														});
													}}
													onDoubleClick={(e) => {
														e.stopPropagation();
														setEditingElementId(el.id);
														setSelectedElement({
															slideId: slide.id,
															elementId: el.id,
														});
														const node = (
															e.currentTarget as HTMLElement
														).querySelector(
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
														if (t && t.closest('[data-inline-toolbar="true"]'))
															return;
														// Allow focusing/editing on double-click inside the text content; single click still enables drag
														if (t && t.closest('[data-canvas-text="true"]')) {
															if ((e as any).detail >= 2) return;
														}
														if (editingElementId !== el.id)
															handleElementMouseDown(slide.id, el, e);
													}}
												>
													{el.type === "text" && (
														<>
															{selectedElement?.elementId === el.id &&
																selectedElement?.slideId === slide.id && (
																	<div
																		className="absolute -top-9 left-1/2 -translate-x-1/2 z-10"
																		data-inline-toolbar="true"
																		onMouseDown={(e) => e.stopPropagation()}
																	>
																		<div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow rounded-full px-2 py-1">
																			<Button
																				variant={
																					el.isBold ? "primary" : "secondary"
																				}
																				size="sm"
																				className="rounded-full px-3"
																				onClick={() => {
																					setCanvasSlides((prev) =>
																						prev.map((s) =>
																							s.id === slide.id
																								? {
																										...s,
																										elements: s.elements.map(
																											(inner) =>
																												inner.id === el.id
																													? {
																															...inner,
																															isBold:
																																!inner.isBold,
																														}
																													: inner,
																										),
																									}
																								: s,
																						),
																					);
																					scheduleSaveSlide(slide.id);
																				}}
																				title="Bold"
																			>
																				<span className="font-bold">B</span>
																			</Button>
																			<Button
																				variant={
																					el.isItalic ? "primary" : "secondary"
																				}
																				size="sm"
																				className="rounded-full px-3"
																				onClick={() => {
																					setCanvasSlides((prev) =>
																						prev.map((s) =>
																							s.id === slide.id
																								? {
																										...s,
																										elements: s.elements.map(
																											(inner) =>
																												inner.id === el.id
																													? {
																															...inner,
																															isItalic:
																																!inner.isItalic,
																														}
																													: inner,
																										),
																									}
																								: s,
																						),
																					);
																					scheduleSaveSlide(slide.id);
																				}}
																				title="Italic"
																			>
																				<span className="italic">I</span>
																			</Button>
																			<div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
																			<div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-full px-1 py-0.5 space-x-1 border border-gray-200 dark:border-gray-600">
																				<Button
																					variant="secondary"
																					size="sm"
																					className="rounded-full px-3"
																					onClick={() => {
																						setCanvasSlides((prev) =>
																							prev.map((s) =>
																								s.id === slide.id
																									? {
																											...s,
																											elements: s.elements.map(
																												(inner) =>
																													inner.id === el.id
																														? {
																																...inner,
																																fontSize:
																																	Math.max(
																																		8,
																																		(inner.fontSize ??
																																			20) - 2,
																																	),
																															}
																														: inner,
																											),
																										}
																									: s,
																							),
																						);
																						scheduleSaveSlide(slide.id);
																					}}
																					title="Decrease font size"
																				>
																					-
																				</Button>
																				<span className="text-xs text-gray-700 dark:text-gray-300 w-10 text-center">
																					{el.fontSize ?? 20}px
																				</span>
																				<Button
																					variant="secondary"
																					size="sm"
																					className="rounded-full px-3"
																					onClick={() => {
																						setCanvasSlides((prev) =>
																							prev.map((s) =>
																								s.id === slide.id
																									? {
																											...s,
																											elements: s.elements.map(
																												(inner) =>
																													inner.id === el.id
																														? {
																																...inner,
																																fontSize:
																																	Math.min(
																																		120,
																																		(inner.fontSize ??
																																			20) + 2,
																																	),
																															}
																														: inner,
																											),
																										}
																									: s,
																							),
																						);
																						scheduleSaveSlide(slide.id);
																					}}
																					title="Increase font size"
																				>
																					+
																				</Button>
																			</div>
																		</div>
																	</div>
																)}

															<CanvasText
																content={el.content}
																className={`px-2 py-1 text-gray-900 dark:text-white bg-white/70 dark:bg-gray-900/50 rounded border ${selectedElement?.elementId === el.id && selectedElement?.slideId === slide.id ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200 dark:border-gray-700"} outline-none focus:ring-2 focus:ring-blue-500`}
																style={{
																	fontWeight: el.isBold ? 700 : 400,
																	fontStyle: el.isItalic ? "italic" : "normal",
																	fontSize: `${el.fontSize ?? 20}px`,
																}}
																isEditing={editingElementId === el.id}
																elementId={el.id}
																onInputText={(text) => {
																	setCanvasSlides((prev) =>
																		prev.map((s) =>
																			s.id === slide.id
																				? {
																						...s,
																						elements: s.elements.map((inner) =>
																							inner.id === el.id
																								? { ...inner, content: text }
																								: inner,
																						),
																					}
																				: s,
																		),
																	);
																	scheduleSaveSlide(slide.id);
																}}
																onFocus={() => {
																	setEditingElementId(el.id);
																	setSelectedElement({
																		slideId: slide.id,
																		elementId: el.id,
																	});
																}}
																onBlur={() => {
																	setEditingElementId(null);
																}}
															/>
														</>
													)}
												</div>
											))}
										</div>
									);
								})}
								<div ref={slidesEndRef} />
							</div>
						</div>
					</div>

					{/* Bottom floating toolbar */}
					<div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
						<div className="pointer-events-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-full px-3 py-2 flex items-center space-x-2">
							<div className="relative" ref={insertMenuRef}>
								<Button
									variant="secondary"
									size="sm"
									className="rounded-full"
									onClick={() => setIsInsertMenuOpen((v) => !v)}
								>
									<span className="flex items-center">
										<svg
											className="w-4 h-4 mr-1.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 4v16m8-8H4"
											/>
										</svg>
										Insert element
									</span>
								</Button>
								{isInsertMenuOpen && (
									<div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2">
										<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2 min-w-[160px]">
											<Button
												variant="secondary"
												size="sm"
												onClick={() => {
													handleInsertText();
													setIsInsertMenuOpen(false);
												}}
												className="w-full text-left px-3 py-2"
											>
												Text
											</Button>
										</div>
									</div>
								)}
							</div>
							<div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

							<Button
								onClick={handleAddSlide}
								size="sm"
								className="rounded-full"
							>
								<span className="flex items-center">
									<svg
										className="w-4 h-4 mr-1.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v16m8-8H4"
										/>
									</svg>
									Add slide
								</span>
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function PresenceMouseTracker({
	activeSlideId,
	slideContainerRefs,
}: {
	activeSlideId: string | null;
	slideContainerRefs: React.MutableRefObject<
		Record<string, HTMLDivElement | null>
	>;
}) {
	const [, updateMyPresence] = useMyPresence();

	useEffect(() => {
		// Update slideId even if no cursor yet
		updateMyPresence({ slideId: activeSlideId || null });
	}, [activeSlideId, updateMyPresence]);

	useEffect(() => {
		if (!activeSlideId) return;
		const el = slideContainerRefs.current[activeSlideId];
		if (!el) return;

		let raf = 0;
		const onMove = (e: MouseEvent) => {
			const rect = el.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;
			const xPercent = Math.max(0, Math.min(100, x));
			const yPercent = Math.max(0, Math.min(100, y));
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				updateMyPresence({
					cursor: { xPercent, yPercent },
					slideId: activeSlideId,
				});
			});
		};
		const onLeave = () => updateMyPresence({ cursor: null });

		el.addEventListener("mousemove", onMove);
		el.addEventListener("mouseleave", onLeave);
		return () => {
			if (raf) cancelAnimationFrame(raf);
			el.removeEventListener("mousemove", onMove);
			el.removeEventListener("mouseleave", onLeave);
		};
	}, [activeSlideId, slideContainerRefs, updateMyPresence]);

	return null;
}

function SlideCursors({ slideId }: { slideId: string }) {
	const others = useOthers();

	const colors = [
		"#ef4444",
		"#f59e0b",
		"#10b981",
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
	];

	return (
		<>
			{others
				.map((o) => ({
					id: o.connectionId,
					cursor: (o.presence as any)?.cursor,
					sId: (o.presence as any)?.slideId,
				}))
				.filter((o) => o.cursor && o.sId === slideId)
				.map((o) => {
					const color = colors[o.id % colors.length];
					return (
						<div
							key={o.id}
							className="pointer-events-none absolute"
							style={{
								left: `${o.cursor.xPercent}%`,
								top: `${o.cursor.yPercent}%`,
								transform: "translate(-50%, -50%)",
							}}
						>
							<div className="flex items-center">
								<svg
									className="w-4 h-4 drop-shadow"
									viewBox="0 0 24 24"
									fill={color}
								>
									<path d="M3 2l7 18 2-7 7-2L3 2z" />
								</svg>
							</div>
						</div>
					);
				})}
		</>
	);
}

type CanvasTextProps = {
	content: string;
	className?: string;
	style?: CSSProperties;
	isEditing: boolean;
	onInputText: (text: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	elementId: string;
};

const shallowEqual = (
	a?: Record<string, unknown>,
	b?: Record<string, unknown>,
) => {
	if (a === b) return true;
	if (!a || !b) return false;
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	for (const k of aKeys) {
		if (a[k] !== b[k]) return false;
	}
	return true;
};

const CanvasText = memo(
	function CanvasText({
		content,
		className,
		style,
		isEditing: _isEditing,
		onInputText,
		onFocus,
		onBlur,
		elementId,
	}: CanvasTextProps) {
		const handleInput = useCallback<FormEventHandler<HTMLDivElement>>(
			(e) => {
				const text = e.currentTarget.textContent ?? "";
				onInputText(text);
			},
			[onInputText],
		);

		return (
			<div
				contentEditable
				suppressContentEditableWarning
				data-canvas-text="true"
				data-element-id={elementId}
				className={className}
				style={style}
				onInput={handleInput}
				onFocus={onFocus}
				onBlur={onBlur}
			>
				{content}
			</div>
		);
	},
	(prev, next) => {
		if (next.isEditing) return true;
		return (
			prev.content === next.content &&
			prev.className === next.className &&
			shallowEqual(prev.style as any, next.style as any) &&
			prev.isEditing === next.isEditing
		);
	},
);
