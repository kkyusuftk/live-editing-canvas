import { PlusIcon } from "@radix-ui/react-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { DeckCard } from "../components/DeckCard";
import { EmptyState } from "../components/EmptyState";
import { Button, Modal } from "../components/ui";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { fetchDeckById } from "../lib/api/decksApi";
import {
	useCreateDeck,
	useDeleteDeck,
	useUserDecks,
} from "../lib/queries/decksQueries";
import { queryKeys } from "../lib/queryKeys";
import { useAuthStore } from "../store/auth";

export function HomePage() {
	const { user, signOut } = useAuthStore();
	const navigate = useNavigate();
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
	const { data: decks = [], isLoading } = useUserDecks();
	const createDeckMutation = useCreateDeck();
	const deleteDeckMutation = useDeleteDeck();
	const qc = useQueryClient();

	const handleSignOut = async () => {
		await signOut();
		navigate("/login");
	};

	const handleAddSlides = async () => {
		if (createDeckMutation.isPending) return;
		createDeckMutation.mutate(undefined, {
			onSuccess: (deck) => {
				toast.success("Slide deck created!");
				navigate(`/slide/${deck.id}`);
			},
		});
	};

	const handleDeckClick = (deckId: string) => {
		navigate(`/slide/${deckId}`);
	};

	const handleDeleteDeck = (deckId: string) => {
		setPendingDeleteId(deckId);
		setConfirmDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		const deckId = pendingDeleteId;
		if (!deckId) return;
		setConfirmDeleteOpen(false);
		setPendingDeleteId(null);
		deleteDeckMutation.mutate(deckId, {
			onSuccess: () => {
				toast.success("Deck deleted");
			},
		});
	};

	const prefetchDeck = (deckId: string) =>
		qc.prefetchQuery({
			queryKey: queryKeys.decks.detail(deckId),
			queryFn: async () => {
				const { data, error } = await fetchDeckById(deckId);
				if (error) throw error;
				return data;
			},
			staleTime: 60_000,
		});

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<nav className="bg-white dark:bg-gray-800 shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-bold text-gray-900 dark:text-white">
								Live Editing Canvas
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-gray-700 dark:text-gray-300 hidden sm:inline">
								{user?.user_metadata?.username || user?.email}
							</span>
							<Button variant="danger" onClick={handleSignOut}>
								Sign out
							</Button>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 sm:px-0">
					{/* Header with Add Slides button */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
						<div>
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
								My Slide Decks
							</h2>
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
								Create and manage your presentations
							</p>
						</div>
						<Button
							onClick={handleAddSlides}
							disabled={createDeckMutation.isPending}
							size="lg"
						>
							<>
								<PlusIcon className="mr-2" />
								Add Slides
							</>
						</Button>
					</div>

					{/* Deck list */}
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<LoadingSpinner />
						</div>
					) : decks.length === 0 ? (
						<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
							<EmptyState />
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{decks.map((deck) => (
								<div key={deck.id} onMouseEnter={() => prefetchDeck(deck.id)}>
									<DeckCard
										deck={deck}
										onClick={() => handleDeckClick(deck.id)}
										onDelete={() => handleDeleteDeck(deck.id)}
										deleting={
											deleteDeckMutation.isPending &&
											pendingDeleteId === deck.id
										}
									/>
								</div>
							))}
						</div>
					)}
				</div>
				<Modal
					isOpen={confirmDeleteOpen}
					onModalClose={() => {
						setConfirmDeleteOpen(false);
						setPendingDeleteId(null);
					}}
					onClose={() => {
						setConfirmDeleteOpen(false);
						setPendingDeleteId(null);
					}}
					onConfirm={handleConfirmDelete}
				>
					<div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
							Delete this deck?
						</h3>
						<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
							This action cannot be undone.
						</p>
					</div>
				</Modal>
			</main>
		</div>
	);
}
