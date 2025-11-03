# Collaborative Slide Editor – Technical Specification

## 1. Project Overview
Build a web-based slide editor that supports real-time, multi-user editing of slides containing text (phase 1) with an intuitive sharing model for single or multiple slides. The MVP focuses on text elements, but the architecture must be extensible to images, shapes, and rich components.

## 2. Functional Requirements
1. **Slide CRUD** – Users can create, duplicate, reorder, and delete slides.
2. **Text Elements** – Within a slide, users can add, edit, resize, drag, and delete text boxes.
3. **Real-time Collaboration**
   - Live cursor presence & selection.
   - Concurrent edits merged via CRDT (Yjs) or Liveblocks primitives.
   - Latency budget: < 150 ms 95p for remote updates under normal network conditions.
4. **Sharing & Permissions**
   - Generate share links scoped to **single slide** or **entire deck**.
   - Roles: _viewer_ (read-only) and _editor_ (read-write).
   - Links embed deck-id (+ optional slide-id) and ephemeral auth token.
5. **Undo / Redo**
   - Local (per-user) history. Should not undo changes made by other collaborators.
6. **Offline Support (Stretch)** – Allow editing while offline; changes sync on reconnect.

## 3. Non-Functional Requirements
| Category | Requirement |
|----------|-------------|
| Performance | First meaningful paint < 2 s on 4G; bundle ≤ 200 kB gzipped for MVP |
| Accessibility | WCAG 2.1 AA for keyboard navigation & screen readers |
| Security | XSS/CSRF protection, token-based link sharing, HTTPS only |
| Scalability | Support 100 concurrent editors per deck with linear memory growth |
| Reliability | 99.9 % SLA uptime for collaboration service |

## 4. Tech Stack
- **Frontend**: React 18 + TypeScript, Vite, Zustand (local state), Tailwind CSS.
- **Real-time**: Yjs CRDT with [@liveblocks/yjs-room](https://liveblocks.io) provider. (Fallback: y-webrtc for local dev.)
- **Storage**: Supabase Postgres for persistent deck & slide data; Object storage for future media.
- **Auth**: Supabase Auth (username & password) + JWT tokens in share links.
- **Deployment**: Vercel (frontend) & Supabase (backend).
- **Testing**: Vitest + React Testing Library; Playwright for E2E.

## 5. System Architecture
```
Browser                Supabase Edge             DB
┌──────────────┐       ┌──────────────┐       ┌──────────┐
│ React + Yjs  │◀────► │  Relay (WS)  │◀────►│  Postgres │
└──────────────┘       └──────────────┘       └──────────┘
    ▲  ▲  ▲                  ▲                      ▲
    │  │  │                  │                      │
 Presence  Updates    Auth + Persistence      Deck & Slide
```
1. Each deck is a Yjs `Doc` synced via Liveblocks WebSocket room.
2. On connection, the latest persisted state is loaded from Postgres, merged into the Yjs doc, then broadcast.
3. Periodic checkpoints (every 30 s or on large ops) persist Yjs updates back to Postgres.
4. REST endpoints for deck metadata; realtime handled via WS provider.

## 6. Data Model (Relational – Supabase Postgres)
We’ll persist state in Supabase’s managed Postgres. CRDT deltas remain in memory/WebSocket; Postgres is our durable source of truth and powers SQL queries.

### 6.1 Tables
```sql
-- users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid text UNIQUE NOT NULL,       -- Supabase auth.uid (Google sub)
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz
);

-- decks
CREATE TABLE decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- slides
CREATE TABLE slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  position int NOT NULL,
  y_doc bytea NOT NULL                -- Yjs snapshot (binary)
);

-- share_tokens
CREATE TABLE share_tokens (
  token text PRIMARY KEY,             -- 256-bit random (base58)
  deck_id uuid REFERENCES decks(id) ON DELETE CASCADE,
  slide_id uuid REFERENCES slides(id),
  role text CHECK (role IN ('viewer','editor')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  revoked_at timestamptz
);
```

### 6.2 Row-Level Security
```sql
-- Users can always read their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self view" ON users
  FOR SELECT USING (auth.uid() = auth_uid);

-- Deck access based on owner or share token claim
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or token" ON decks
  USING (
    owner_id = (SELECT id FROM users WHERE auth_uid = auth.uid())
    OR (auth.jwt() ->> 'deck_id')::uuid = id
  );
```

### 6.3 Indexes
• `slides.deck_id, slides.position` for ordered fetches  
• `share_tokens.deck_id`, `share_tokens.token` (hashed) for fast lookup  
• `users.email` unique index for quick lookup during OAuth provisioning

### 6.4 Presence Data
Real-time presence (cursor, selection, assigned color) is transmitted via Liveblocks’ awareness API and not persisted.

---

### 10.1 Authentication (Username + Password)
1. **Signup** – User provides `username`, `email`, and `password` on `/signup`.
   - Frontend calls `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
   - Supabase returns a session immediately; email confirmation is disabled for faster onboarding.
2. **Login** – On `/login`, user enters `username` (or email) & `password`.
   - Frontend resolves username → email via an RPC or uses email directly.
   - Calls `supabase.auth.signInWithPassword({ email, password })`.
3. **Session Storage** – Supabase JS stores `access_token` & `refresh_token` in `localStorage`; React context hydrated via `onAuthStateChange`.
4. **Password Reset** – User can request reset; Supabase emails a magic link to choose a new password.
5. **Security** – Passwords are hashed with `bcrypt` by Supabase; enforce min length & rate-limit login attempts.

## 7. Collaboration & CRDT Strategy
- **Granularity**: One Yjs doc per deck. Slides & elements live in nested Yjs maps/arrays.
- **Conflict Resolution**: Yjs ensures commutative, associative, idempotent merges.
- **Awareness**: Liveblocks presence API broadcasts user cursors, selections, and color.
- **Undo/Redo**: Use Yjs `UndoManager` scoped to the local client’s origin.

## 8. Undo / Redo Design
```ts
const undoManager = new Y.UndoManager(yDeck, {
  trackedOrigins: new Set([localOrigin]) // ignore remote updates
});
```
- Bind `Ctrl+Z / Cmd+Z` and `Shift+Ctrl+Z / Shift+Cmd+Z` to `undoManager.undo/redo`.

## 9. API Endpoints (REST)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/decks` | Create a new deck |
| `GET` | `/decks/:id` | Fetch deck metadata & checkpoint |
| `PATCH` | `/decks/:id` | Rename deck |
| `POST` | `/decks/:id/share` | Generate share link (scope, role) |

WebSocket handled by Liveblocks rooms (`wss://liveblocks.app/v5?room=<deckId>`).

### 10.2 Deck Sharing via Links
1. **Generate Link** – In the editor, owner clicks “Share.” UI chooses scope: _single slide_ or _entire deck_, and role: _viewer_ / _editor_.
2. **Backend Endpoint** – Frontend `POST /decks/:id/share` with `{ scope, role }`.
3. **Token Creation** – Server creates a 256-bit random token, stores row `deck_id`, `slide_id?`, `role`, `created_by`.
4. **Link Format** – `https://app.io/d/:deckId?slide=:slideId&token=:shareToken`.
5. **Sending** – User copies or emails the link.
6. **Access Flow**
- ⚠️ **Auth Gate** – When a visitor opens the link, the app checks `supabase.auth.getSession()`.
  - If **no session**, the visitor is redirected to `/login?redirect=<encodedLink>`; after signing in with **username + password** the app resumes the flow below.
- With a valid session, the frontend reads `token` query param and calls `POST /auth/exchange` **(requires auth header)** → returns a short-lived JWT with `role`, `deck_id`, optional `slide_id` claims.
- JWT stored for session; RLS policies gate DB rows accordingly.
- Editor loads deck via Liveblocks room `deckId`; presence message includes role.
7. **Revocation** – Owner can list & revoke tokens. Revoked token rows marked `revoked_at`, making future exchanges fail.

## 11. Deployment & DevOps
- **CI**: GitHub Actions – lint, test, build, Cypress smoke.
- **Preview**: Vercel Preview URLs on PRs.
- **Prod**: Auto-deploy `main` branch.

## 12. Milestones & Timeline (2 weeks)
| Day | Milestone |
|-----|-----------|
| 1-2 | Project scaffolding (Vite + Tailwind + Supabase) |
| 3-4 | Deck & slide CRUD (no realtime) |
| 5-6 | Integrate Yjs & Liveblocks; basic text editing |
| 7-8 | Presence, cursors, remote updates, latency tests |
| 9   | Undo/Redo implementation |
| 10  | Share link flows, permissions |
| 11  | Polish UI/UX, accessibility pass |
| 12  | Testing (unit + E2E) |
| 13  | Deployment, README, walkthrough video |
| 14  | Buffer / stretch goals (offline, images) |

## 13. Risk & Mitigations
| Risk | Mitigation |
|------|-----------|
| Yjs learning curve | Start with official demos; isolate CRDT logic |
| Supabase WS limits | Use Liveblocks hosted service for production |
| Undo edge cases | Write integration tests around UndoManager |

## 14. Future Enhancements
- Image/embed support
- Slide templates & themes
- Comments & inline annotations
- Export to PDF / PPTX

---
_Last updated: 2025-11-03_
