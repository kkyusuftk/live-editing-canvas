import {
	ArrowLeftIcon,
	CheckIcon,
	Cross1Icon,
	Pencil1Icon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { FloatingToolbar } from "../components/FloatingToolbar";
import { LiveSlideCanvas } from "../components/LiveSlideCanvas";
import { Button, Modal } from "../components/ui";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
	useCreateSlide,
	useDeck,
	useUpdateDeckTitle,
	useUpdateDeckVisibility,
} from "../lib/queries/decksQueries";
import { useAuthStore } from "../store/auth";

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

	const [slideIds, setSlideIds] = useState<string[]>([]);
	const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
	const [selectedElement, setSelectedElement] = useState<{
		slideId: string;
		elementId: string;
	} | null>(null);
	const [editingElementId, setEditingElementId] = useState<string | null>(null);
	const [confirmShareOpen, setConfirmShareOpen] = useState(false);
	const [addTextTrigger, setAddTextTrigger] = useState(0);

	// Hooks must be declared before any early returns
	const updateTitleMutation = useUpdateDeckTitle();
	const updateVisibilityMutation = useUpdateDeckVisibility();
	const createSlideMutation = useCreateSlide();
	const totalSlides = slideIds.length;

	const { user } = useAuthStore();
	const isOwner = !!(deck && user && user.id === deck.owner_id);
	const deckVisibility: "private" | "users" =
		deck?.visibility ?? "private";

	const handleConfirmShare = async () => {
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
	};

	useEffect(() => {
		if (deckIsError) {
			toast.error("Could not load slide deck");
		}
	}, [deckIsError]);

	useEffect(() => {
		if (!deck) return;
		const ids = (deck.slides || [])
			.sort((a, b) => a.position - b.position)
			.map((s) => s.id);
		if (ids.length === 0) {
			// Should not happen as deck always has at least one slide from createDeck
			const fallbackId = crypto?.randomUUID
				? crypto.randomUUID()
				: `${Date.now()}`;
			setSlideIds([fallbackId]);
			setActiveSlideId(fallbackId);
		} else {
			setSlideIds(ids);
			setActiveSlideId(ids[0]);
		}
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
							<ArrowLeftIcon className="w-5 h-5" />
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
					position: slideIds.length,
				});
				if (!newSlideRow) {
					toast.error("Failed to add slide");
					return;
				}
				setSlideIds((prev) => [...prev, newSlideRow.id]);
				setActiveSlideId(newSlideRow.id);
				// Scroll to the bottom after the DOM updates
				setTimeout(() => {
					slidesEndRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "end",
					});
				}, 0);
			} catch (_) {
				toast.error("Failed to add slide");
			}
		})();
	};

	const handleAddText = () => {
		if (!activeSlideId) return;
		setAddTextTrigger((prev) => prev + 1);
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
											onConfirm={handleConfirmShare}
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

			{/* Canvas area with vertical slides list */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-6xl px-4 py-8">
					<div className="flex flex-col items-center space-y-10">
						{slideIds.map((slideId) => {
							const isActive = slideId === activeSlideId;
							return (
								<LiveSlideCanvas
									key={slideId}
									slideId={slideId}
									isActive={isActive}
									onActivate={() => setActiveSlideId(slideId)}
									selectedElement={selectedElement}
									onSelectElement={(elementId) =>
										setSelectedElement({ slideId, elementId })
									}
									editingElementId={editingElementId}
									onStartEditing={setEditingElementId}
									onStopEditing={() => setEditingElementId(null)}
									addTextTrigger={isActive ? addTextTrigger : 0}
								/>
							);
						})}
						<div ref={slidesEndRef} />
					</div>
				</div>
			</div>

			{/* Bottom floating toolbar */}
			<FloatingToolbar
				onAddText={handleAddText}
				onAddSlide={handleAddSlide}
				isAddTextDisabled={!activeSlideId}
			/>
		</div>
	);
}
