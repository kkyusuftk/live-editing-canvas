export const queryKeys = {
	decks: {
		all: ["decks"] as const,
		list: () => [...queryKeys.decks.all, "list"] as const,
		detail: (deckId: string) => [...queryKeys.decks.all, deckId] as const,
		slides: (deckId: string) =>
			[...queryKeys.decks.detail(deckId), "slides"] as const,
		slide: (deckId: string, slideId: string) =>
			[...queryKeys.decks.slides(deckId), slideId] as const,
	},
};

export const serialize = (obj: unknown) =>
	JSON.stringify(obj, Object.keys(obj as object).sort());
