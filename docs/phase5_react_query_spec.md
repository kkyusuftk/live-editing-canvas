## Phase 5 — React Query Integration Plan

### Goals
- **Adopt React Query** for client-side data fetching, caching, and mutations.
- **Centralize query keys** with a clear, typed, and scalable design.
- **Standardize hooks** around our existing Supabase API layer.
- **Improve UX** via optimistic updates, prefetching, and sensible cache policies.

### Packages
- Install runtime and devtools:

```bash
npm i @tanstack/react-query
npm i -D @tanstack/react-query-devtools
```

---

## Architecture & Files

### 1) Query Client configuration
- File: `src/lib/queryClient.ts`
- Purpose: Single source of truth for `QueryClient` with defaults, error handling, and sensible caching.

```ts
// src/lib/queryClient.ts
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Any query or mutation error bubbles up here – one toast per failure by default
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Request failed')
      console.error('[React Query] onError', error)
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // default; override per-query as needed
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### 2) Provider wiring
- Update: `src/main.tsx` to wrap the app with `QueryClientProvider` (inside current `LiveblocksProvider`).

```tsx
// src/main.tsx (snippet)
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'

<LiveblocksProvider publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY}>
  <QueryClientProvider client={queryClient}>
    <App />
    {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
  {/* Keep Liveblocks as the outer context */}
</LiveblocksProvider>
```

### 3) Canonical query keys
- File: `src/lib/queryKeys.ts`
- Design principles:
  - **Stable arrays** using `as const`.
  - **Domain-first segments**: `['decks', 'list']`, `['decks', deckId, 'slides']`.
  - **Avoid raw objects** in keys. If filters are needed, pass scalars or a stable string.

```ts
// src/lib/queryKeys.ts
export const queryKeys = {
  decks: {
    all: ['decks'] as const,
    list: () => [...queryKeys.decks.all, 'list'] as const,
    detail: (deckId: string) => [...queryKeys.decks.all, deckId] as const,
    slides: (deckId: string) => [...queryKeys.decks.detail(deckId), 'slides'] as const,
    slide: (deckId: string, slideId: string) => [...queryKeys.decks.slides(deckId), slideId] as const,
  },
}

// Optional: util to safely include filters in keys
export const serialize = (obj: unknown) => JSON.stringify(obj, Object.keys(obj as object).sort())
```

### 4) Query/mutation hooks around Supabase API
- Directory: `src/lib/queries/`
- Strategy: Wrap current functions in `src/lib/api/*.ts`. For queries, **throw on error** so React Query handles it naturally. For mutations, prefer **optimistic updates** with rollback and/or targeted invalidation.

```ts
// src/lib/queries/decks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../queryKeys'
import {
  fetchUserDecks,
  fetchDeckById,
  createDeck,
  deleteDeck,
  updateDeckTitle,
  updateDeckVisibility,
  createSlide,
  updateSlideYDoc,
} from '../api/decks'
import { useAuthStore } from '../../store/auth'

export function useUserDecks() {
  const { initialized, session } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.decks.list(),
    enabled: initialized && !!session,
    queryFn: async () => {
      const { data, error } = await fetchUserDecks()
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

export function useDeck(deckId: string) {
  const { initialized, session } = useAuthStore()
  return useQuery({
    queryKey: queryKeys.decks.detail(deckId),
    enabled: initialized && !!session && !!deckId,
    queryFn: async () => {
      const { data, error } = await fetchDeckById(deckId)
      if (error) throw error
      return data
    },
  })
}

export function useCreateDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (title?: string) => {
      const { data, error } = await createDeck(title)
      if (error) throw error
      return data!
    },
    onSuccess: (newDeck) => {
      // Optimistically merge into list cache
      qc.setQueryData(queryKeys.decks.list(), (prev: any) => [newDeck, ...(prev ?? [])])
    },
  })
}

export function useDeleteDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (deckId: string) => {
      const { error } = await deleteDeck(deckId)
      if (error) throw error
      return deckId
    },
    onMutate: async (deckId) => {
      const key = queryKeys.decks.list()
      const prev = qc.getQueryData<any[]>(key)
      qc.setQueryData<any[]>(key, (curr) => (curr ?? []).filter((d) => d.id !== deckId))
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.decks.list(), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.decks.list() })
    },
  })
}
```

---

## Usage Examples (migration targets)

### Home Page (list + create + delete)
- Replace manual `useEffect` fetching with `useUserDecks()`.
- Replace imperative create/delete functions with `useCreateDeck()` / `useDeleteDeck()` mutations.
- Benefits: less local state, fewer edge cases, automatic revalidation.

```tsx
// src/pages/HomePage.tsx (snippet)
import { useUserDecks, useCreateDeck, useDeleteDeck } from '../lib/queries/decks'

const { data: decks = [], isLoading } = useUserDecks()
const createDeckMutation = useCreateDeck()
const deleteDeckMutation = useDeleteDeck()

// Create
createDeckMutation.mutate('Untitled deck', {
  onSuccess: (deck) => navigate(`/slide/${deck.id}`),
})

// Delete
deleteDeckMutation.mutate(deckId)
```

### Prefetch deck details on hover/click
```tsx
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchDeckById } from '../lib/api/decks'

const qc = useQueryClient()
const prefetchDeck = (deckId: string) =>
  qc.prefetchQuery({
    queryKey: queryKeys.decks.detail(deckId),
    queryFn: async () => {
      const { data, error } = await fetchDeckById(deckId)
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
```

---

## Key Design Guidelines
- **Be explicit and consistent**: use `queryKeys` helpers everywhere.
- **Never inline arrays**: always call `queryKeys.decks.list()` etc.
- **Avoid objects in keys**: if necessary, pass a serialized filter string.
- **Scope keys properly**: deck-specific data is nested under `['decks', deckId, ...]`.
- **Prefer targeted invalidation**: invalidate the smallest necessary scope (`detail(deckId)` vs entire `list`).

---

## Defaults & Policies
- **Queries**
  - `staleTime`: default 30s; `decks.list` can be 60s.
  - `refetchOnWindowFocus`: disabled globally; selectively enable where needed.
  - `retry`: 1 for queries, 0 for mutations.
- **Mutations**
  - Prefer `setQueryData` for instant UI; combine with `invalidateQueries` after success.
  - Roll back on errors using `onMutate` context.
- **Auth gating**
  - Use `enabled: initialized && !!session` with `useAuthStore()` to avoid unauthorized calls.

---

## Liveblocks & Realtime Considerations
- For Yjs/Liveblocks-driven content, React Query is not the primary sync mechanism.
- When a collaborative event implies server state changes (e.g., deck title), either:
  - Directly patch caches with `setQueryData`, or
  - Invalidate narrowly relevant keys.
- Avoid frequent invalidations while users edit; prefer targeted cache updates.

---

## Migration Plan
1) Install packages and add `src/lib/queryClient.ts`.
2) Wrap `App` with `QueryClientProvider` and add Devtools in `DEV`.
3) Add `src/lib/queryKeys.ts` with deck/slide keys.
4) Create `src/lib/queries/decks.ts` with queries/mutations.
5) Convert `HomePage` to React Query:
   - Replace manual state/effects with `useUserDecks()` and mutations.
   - Add optional prefetch on card hover/click.
6) Gradually adopt in `SlideEditorPage` for non-realtime operations (e.g., title/visibility, slide CRUD). Keep Yjs sync as-is.
7) Add patterns to other features as they emerge; keep keys in the registry.

### Acceptance
- Provider present and devtools work in development.
- Keys are centralized and used by all new hooks.
- `HomePage` loads decks via React Query and handles create/delete with optimistic UX.
- Mutations keep caches in sync without full-page refetches.

---

## Open Questions
- Should we refactor `src/lib/api/*` to throw on error (vs `{ data, error }`) to simplify hooks? Proposed: keep current API shape for now and throw in the hook layer.
- Should we add a small `toast` integration in `QueryCache.onError`? Proposed: yes, minimally, to standardize error surfacing.
- Do we want a `filters` helper for future list filtering? Proposed: add `serialize()` now for consistency.

---

### 5) Global toast handling for failures

React Query already exposes all network & mutation errors through the `QueryCache.onError` callback. We leverage this to show a **single toast per failure** app-wide using the existing `react-hot-toast` dependency.

```ts
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Request failed')
      console.error('[React Query] onError', error)
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // default; override per-query as needed
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

**Guidelines**
1. Mutation hooks may still surface domain-specific toasts (e.g., "Deck deleted") on success or custom errors; they should _not_ duplicate the generic error toast.
2. If a query error is _handled_ locally (e.g., fallback UI), we can silence the global reporting via `throwOnError: false` and manage messaging manually.
3. Error messages should be user-friendly. Map Supabase error codes to human-readable text where needed before throwing in API wrappers.

---


