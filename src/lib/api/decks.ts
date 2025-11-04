import { supabase } from '../supabase'
import { Deck, DeckWithSlides, Slide } from '../../types/deck'

/**
 * Fetch all decks for the authenticated user
 * Sorted by most recently updated first
 */
export async function fetchUserDecks(): Promise<{ data: Deck[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching decks:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Deck[], error: null }
  } catch (err) {
    console.error('Unexpected error fetching decks:', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Fetch a single deck by ID with its slides
 * Returns null if not found or user doesn't have access
 */
export async function fetchDeckById(deckId: string): Promise<{ data: DeckWithSlides | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .select(`
        *,
        slides (*)
      `)
      .eq('id', deckId)
      .single()

    if (error) {
      console.error('Error fetching deck:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as DeckWithSlides, error: null }
  } catch (err) {
    console.error('Unexpected error fetching deck:', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Create a new deck with a default slide
 * Returns the created deck with its slides
 */
export async function createDeck(title: string = 'Untitled deck'): Promise<{ data: DeckWithSlides | null; error: Error | null }> {
  try {
    // Get current user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', userError)
      return { data: null, error: new Error('Failed to get user: ' + userError.message) }
    }
    
    if (!user) {
      console.error('No user found in session')
      return { data: null, error: new Error('User not authenticated') }
    }

    console.log('Creating deck for user:', user.id)

    // Create the deck
    const { data: deck, error: deckError } = await supabase
      .from('decks')
      .insert({
        owner_id: user.id,
        title,
      })
      .select()
      .single()

    if (deckError || !deck) {
      console.error('Error creating deck:', deckError)
      console.error('Full error details:', JSON.stringify(deckError, null, 2))
      return { data: null, error: new Error(deckError?.message || 'Failed to create deck') }
    }

    // Create a default slide for the deck
    const { data: slide, error: slideError } = await supabase
      .from('slides')
      .insert({
        deck_id: deck.id,
        position: 0,
      })
      .select()
      .single()

    if (slideError) {
      console.error('Error creating default slide:', slideError)
      // Deck was created but slide failed - still return the deck
      return { 
        data: { ...deck, slides: [] } as DeckWithSlides, 
        error: new Error('Deck created but failed to create default slide') 
      }
    }

    return { 
      data: { 
        ...deck, 
        slides: [slide] 
      } as DeckWithSlides, 
      error: null 
    }
  } catch (err) {
    console.error('Unexpected error creating deck:', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Update a deck's title
 */
export async function updateDeckTitle(deckId: string, title: string): Promise<{ data: Deck | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .update({ title })
      .eq('id', deckId)
      .select()
      .single()

    if (error) {
      console.error('Error updating deck:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Deck, error: null }
  } catch (err) {
    console.error('Unexpected error updating deck:', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Update a deck's visibility (private | users)
 */
export async function updateDeckVisibility(
  deckId: string,
  visibility: 'private' | 'users'
): Promise<{ data: Deck | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('decks')
      .update({ visibility })
      .eq('id', deckId)
      .select()
      .single()

    if (error) {
      console.error('Error updating deck visibility:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Deck, error: null }
  } catch (err) {
    console.error('Unexpected error updating deck visibility:', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Delete a deck (cascades to delete all slides)
 */
export async function deleteDeck(deckId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)

    if (error) {
      console.error('Error deleting deck:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error deleting deck:', err)
    return { error: err as Error }
  }
}

/**
 * Update a slide's Yjs document snapshot (bytea)
 */
export async function updateSlideYDoc(slideId: string, yDoc: Uint8Array): Promise<{ error: Error | null }> {
  try {
    // Encode to Postgres bytea hex format (e.g., "\\xDEADBEEF") to avoid JSON corruption
    const hex = Array.from(yDoc).map((b) => b.toString(16).padStart(2, '0')).join('')
    const bytea = `\\x${hex}`

    const { error } = await supabase
      .from('slides')
      .update({ y_doc: bytea })
      .eq('id', slideId)

    if (error) {
      console.error('Error updating slide y_doc:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (err) {
    console.error('Unexpected error updating slide y_doc:', err)
    return { error: err as Error }
  }
}

/**
 * Create a slide for a deck at a given position
 */
export async function createSlide(
  deckId: string,
  position: number
): Promise<{ data: Slide | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('slides')
      .insert({ deck_id: deckId, position })
      .select()
      .single()

    if (error) {
      console.error('Error creating slide:', error)
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Slide, error: null }
  } catch (err) {
    console.error('Unexpected error creating slide:', err)
    return { data: null, error: err as Error }
  }
}

