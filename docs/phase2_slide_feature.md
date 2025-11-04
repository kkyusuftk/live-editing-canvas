# Phase 2 – Slides Feature and Canvas Editor

## Overview
Phase 2 adds the first real "content" feature to Live-Editing Canvas. Auth (Phase 1) already gates users into the application; now we let them create and edit slide decks.

Core deliverables:
1. **"Add Slides" CTA** – A prominent button in the main dashboard (`HomePage`) that creates a new slide deck.
2. **Dynamic route `/slide/:slideId`** – Navigating here opens the slide-editor canvas for the given `slideId`.
3. **Slide Editor Canvas** – Minimal UI scaffold ready for drawing / editing. For Phase 2 we ship a blank art-board with a title bar.

---

## UI/UX details
- Button label: **Add Slides**
- Placement: On `HomePage`, top of the main content area (flex-row end-aligned on desktop, full-width on mobile). The previous *Welcome* card is removed; the slide list now occupies the primary space.
- Clicking the button:
  1. Generates a new slide record on the backend (stubbed for now – random UUID on client).
  2. Redirects to `/slide/{slideId}`

### Slide Editor
- Full-screen page.
- Sticky top-bar with:
  - Back arrow → returns to `/home`.
  - Document title (placeholder).
- Canvas area — simple gray checkerboard placeholder.

---

## Routing changes
```tsx
<Route path="/slide/:slideId" element={<SlideEditorPage />} />
```

## Component breakdown
| Component | Responsibility |
|-----------|----------------|
| `HomePage` | Shows dashboard + **Add Slides** CTA |
| `SlideEditorPage` | Fetch slide data, host `Canvas` |
| `Canvas` | Core drawing surface (Phase 2 placeholder) |

---

## Data Model & User Association

Each slide deck is **owned by a single user**. We follow the schema defined in the technical spec:

### Database Schema (Supabase)

```sql
-- decks table
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- slides table (for future phases with multiple slides per deck)
CREATE TABLE slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  position int NOT NULL,
  y_doc bytea NOT NULL                -- Yjs snapshot (binary)
);
```

### TypeScript Interface

```typescript
interface Deck {
  id: string;              // UUID
  owner_id: string;        // References auth.users(id)
  title: string;           // "Untitled deck" by default
  created_at: string;      // ISO timestamp
  updated_at: string;      // ISO timestamp
}

interface Slide {
  id: string;              // UUID
  deck_id: string;         // References decks(id)
  position: number;        // Order in deck
  y_doc: Uint8Array;       // Yjs binary snapshot (Phase 3+)
}
```

### Key behaviors:
- **Creating a deck**: Insert with `owner_id` from `useAuthStore().user?.id`. For Phase 2, create a single default slide along with each deck.
- **Fetching decks**: Query `decks` table filtered by `owner_id = currentUser.id`.
- **Accessing a deck**: Join on `owner_id` to verify ownership. If mismatch or not found, show "Slide not found or you don't have access."
- **Phase 2 stub**: For now, we'll use a local in-memory array for rapid prototyping, then persist to Supabase in Phase 2.5.

This ensures each user sees only their own work and prevents unauthorized access.

---

## Dashboard – List Existing Slides

When the user lands on `/home` (dashboard):

1. **Fetch slide decks** belonging to the authenticated user (stubbed with local array until backend ready).
2. **Render cards** for each slide deck showing:
   - Deck title (or "Untitled deck")
   - Last modified timestamp
3. **Empty-state**
   - If the user has no decks, show an illustration + text: *"You don't have any slides yet. Click **Add Slides** to start your first deck!"*
4. **Interaction**
   - Clicking a deck card navigates to `/slide/{slideId}` to open the editor with the deck’s data pre-loaded.

```tsx
// pseudo-JSX for dashboard list
{decks.length === 0 ? <EmptyState /> : decks.map(deck => <DeckCard deck={deck} onClick={() => navigate(`/slide/${deck.id}`)} />)}
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| User navigates directly to `/slide/:slideId` without being authenticated | Route is wrapped with `<RequireAuth>`; unauthenticated users are redirected to `/login` just like the rest of the app. |
| `slideId` does not exist / user does not own the slide | Show a 404-style message inside the editor frame: *"Slide not found or you don’t have access."* Provide link back to dashboard. |
| Network error when fetching deck list | Display a non-blocking alert banner and allow retry. |
| Creating a new slide fails | Show toast “Failed to create slide, please try again.” |
| Large number of decks | Paginate / virtual-scroll the list. (Defer implementation until Phase 3.) |
| Rapidly clicking “Add Slides” multiple times | Disable button while the create request is in-flight to avoid duplicates. |

---

## Protected Routes Reminder

All slide editing pages are behind authentication:

```tsx
<Route
  path="/slide/:slideId"
  element={
    <RequireAuth>
      <SlideEditorPage />
    </RequireAuth>
  }
/>
```

---

## Notifications – Toasts

We’ll use [`react-hot-toast`](https://react-hot-toast.com/) for lightweight, Tailwind-friendly notifications.

### Installation
```bash
pnpm add react-hot-toast
# or
npm install react-hot-toast
```

### App wiring
Place the `<Toaster />` component **once** near the root (e.g., inside `App.tsx`, just under `<BrowserRouter>`):

```tsx
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      {/* routes ... */}
    </BrowserRouter>
  )
}
```

### Usage scenarios (Phase 2)
| Event | Toast |
|-------|-------|
| Successful login/signup | `toast.success('Welcome back!')` |
| Fetch error on deck list | `toast.error('Could not load slides')` |

> The library supports promise-based toasts; we can wrap async create/fetch calls to automatically show loading/success/error states.

---

