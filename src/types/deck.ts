// TypeScript types for Deck and Slide entities

export interface Deck {
  id: string              // UUID
  owner_id: string        // References auth.users(id)
  title: string           // "Untitled deck" by default
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}

export interface Slide {
  id: string              // UUID
  deck_id: string         // References decks(id)
  position: number        // Order in deck
  y_doc: Uint8Array | null // Yjs binary snapshot (Phase 3+)
  created_at: string      // ISO timestamp
  updated_at: string      // ISO timestamp
}

export interface DeckWithSlides extends Deck {
  slides: Slide[]
}

