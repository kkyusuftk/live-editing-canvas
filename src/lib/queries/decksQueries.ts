import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
	fetchUserDecks,
	fetchDeckById,
	createDeck,
	deleteDeck,
	updateDeckTitle,
	updateDeckVisibility,
	createSlide,
} from "../api/decksApi";
import { useAuthStore } from "../../store/auth";
import type { Deck, DeckWithSlides } from "../../types/deckTypes";

export function useUserDecks() {
	const { initialized, session } = useAuthStore();
	return useQuery({
		queryKey: queryKeys.decks.list(),
		enabled: initialized && !!session,
		queryFn: async () => {
			const { data, error } = await fetchUserDecks();
			if (error) throw error;
			return data ?? [];
		},
		staleTime: 60_000,
	});
}

export function useDeck(deckId: string) {
	const { initialized, session } = useAuthStore();
	return useQuery({
		queryKey: queryKeys.decks.detail(deckId),
		enabled: initialized && !!session && !!deckId,
		queryFn: async () => {
			const { data, error } = await fetchDeckById(deckId);
			if (error) throw error;
			return data;
		},
	});
}

export function useCreateDeck() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (title?: string) => {
			const { data, error } = await createDeck(title);
			if (error) throw error;
			return data!;
		},
		onSuccess: (newDeck) => {
			qc.setQueryData(queryKeys.decks.list(), (prev: DeckWithSlides[] | undefined) => [
				newDeck,
				...(prev ?? []),
			]);
		},
	});
}

export function useDeleteDeck() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (deckId: string) => {
			const { error } = await deleteDeck(deckId);
			if (error) throw error;
			return deckId;
		},
		onMutate: async (deckId) => {
			const key = queryKeys.decks.list();
			const prev = qc.getQueryData<Deck[]>(key);
			qc.setQueryData<Deck[]>(key, (curr) =>
				(curr ?? []).filter((d) => d.id !== deckId),
			);
			return { prev };
		},
		onError: (_err, _id, ctx) => {
			if (ctx?.prev) qc.setQueryData(queryKeys.decks.list(), ctx.prev);
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: queryKeys.decks.list() });
		},
	});
}

export function useUpdateDeckTitle() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			deckId,
			title,
		}: { deckId: string; title: string }) => {
			const { data, error } = await updateDeckTitle(deckId, title);
			if (error || !data) throw error ?? new Error("Failed to update title");
			return data;
		},
		onSuccess: (updated) => {
			qc.setQueryData(queryKeys.decks.detail(updated.id), (prev: DeckWithSlides | undefined) =>
				prev ? { ...prev, ...updated } : updated,
			);
			qc.setQueryData<Deck[]>(queryKeys.decks.list(), (prev) =>
				(prev ?? []).map((d) =>
					d.id === updated.id
						? { ...d, title: updated.title, updated_at: updated.updated_at }
						: d,
				),
			);
		},
	});
}

export function useUpdateDeckVisibility() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			deckId,
			visibility,
		}: { deckId: string; visibility: "private" | "users" }) => {
			const { data, error } = await updateDeckVisibility(deckId, visibility);
			if (error || !data)
				throw error ?? new Error("Failed to update visibility");
			return data;
		},
		onSuccess: (updated) => {
			qc.setQueryData(queryKeys.decks.detail(updated.id), (prev: DeckWithSlides | undefined) =>
				prev ? { ...prev, ...updated } : updated,
			);
			qc.setQueryData<Deck[]>(queryKeys.decks.list(), (prev) =>
				(prev ?? []).map((d) =>
					d.id === updated.id
						? {
								...d,
								visibility: updated.visibility,
								updated_at: updated.updated_at,
							}
						: d,
				),
			);
		},
	});
}

export function useCreateSlide() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			deckId,
			position,
		}: { deckId: string; position: number }) => {
			const { data, error } = await createSlide(deckId, position);
			if (error || !data) throw error ?? new Error("Failed to create slide");
			return { deckId, slide: data };
		},
		onSuccess: ({ deckId, slide }) => {
			const key = queryKeys.decks.detail(deckId);
			qc.setQueryData<DeckWithSlides>(key, (prev) =>
				prev ? { ...prev, slides: [...(prev.slides ?? []), slide] } : prev,
			);
		},
	});
}
