// TypeScript types for Deck and Slide entities

export interface Deck {
	id: string; // UUID
	owner_id: string; // References auth.users(id)
	title: string; // "Untitled deck" by default
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
	visibility: "private" | "users"; // Sharing scope for Phase 4
}

export interface Slide {
	id: string; // UUID
	deck_id: string; // References decks(id)
	position: number; // Order in deck
	y_doc: string | null; // Liveblocks storage JSON (stored in y_doc column for backward compatibility)
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
}

export interface DeckWithSlides extends Deck {
	slides: Slide[];
}
