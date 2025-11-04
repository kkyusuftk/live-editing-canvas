## Deck Sharing: Authenticated Public Editing (Phase 4)

### Overview
- Goal: Allow any authenticated user of the product to view AND edit a deck if the owner enables sharing, using a simple link like `/slide/:deckId`.
- Editing is collaborative for all authenticated users when sharing is enabled; presence cursors are visible to all.

### Goals
- Shareable link works for any logged-in user (no invite required).
- All authenticated users can edit slide content when sharing is enabled.
- Owner retains exclusive rights to toggle sharing on/off and change deck metadata.
- Presence cursors visible to all current viewers/editors.
- Simple toggle to enable/disable sharing.

### Non-goals (for this phase)
- Anonymous (non-auth) public access.
- Fine-grained per-user permissions or editor roles beyond owner.
- Link tokens/expirations, are out of scope.

### UX and Flows
1) Owner opens a deck editor page (`/slide/:deckId`).
   - Top bar shows a Share button (visible to owner only).
   - If deck is private, clicking Share prompts to “Enable sharing with all users” and then copies the link.
   - If sharing is already enabled, clicking Share copies the link directly and offers “Disable sharing.”

2) Collaborator (another logged-in user) opens the shared link.
   - Sees the deck and can edit slides (insert text, drag elements, add slides).
   - Presence cursors are shown.
   - Share button is hidden for non-owners.

3) Authentication flow
   - Route remains auth-gated. Non-auth users are redirected to login and then returned to `/slide/:deckId`.

### Data Model Changes
- Add new deck visibility state. Future-proof with an enum.

Proposed schema:
- Create enum `deck_visibility` with values: `private`, `users`.
- Add column to `decks`:
  - `visibility deck_visibility NOT NULL DEFAULT 'private'`
  
- Change tracking (deck-level):
  - `last_edited_by uuid` (nullable) — user id of the most recent editor
  - `last_edited_at timestamptz` (nullable) — timestamp of the most recent edit
  - Maintained via trigger on `slides` so collaborators don't need update access to `decks`.

### RLS Policies (Supabase)
Enable RLS if not already enabled.

Decks table policies:
- Owners full access
  - USING/ WITH CHECK: `owner_id = auth.uid()`
- Authenticated users can SELECT when shared
  - USING: `visibility = 'users'`
  - Note: Owners implicitly match the first policy.
  - Updates to deck metadata (e.g., `title`, `visibility`) remain owner-only for now (keeps scope simple and avoids policy complexity). Optional: expose `title` updates to all users later.
  - `last_edited_by` and `last_edited_at` are updated by a trigger; non-owners do not require `UPDATE` on `decks`.

Slides table policies:
- Owners full access (SELECT/INSERT/UPDATE/DELETE)
  - USING: `EXISTS (SELECT 1 FROM decks d WHERE d.id = slides.deck_id AND d.owner_id = auth.uid())`
  - WITH CHECK: same predicate for write operations.
- Authenticated users can SELECT and WRITE slides when deck is shared
  - FOR SELECT USING: `EXISTS (SELECT 1 FROM decks d WHERE d.id = slides.deck_id AND d.visibility = 'users')`
  - FOR INSERT/UPDATE/DELETE USING + WITH CHECK: same predicate as above to permit writes when the parent deck is shared.

Indexes (optional but recommended):
- On `slides(deck_id)`
- On `decks(owner_id)`
- On `decks(visibility)`

### Client Changes
- Types (`src/types/deck.ts`):
  - Add `visibility: 'private' | 'users'` to `Deck` and `DeckWithSlides`.

- Share button UI (existing top bar in `SlideEditorPage.tsx`):
  - Visibility: only render the Share button for the owner (`session.user.id === deck.owner_id`).
  - If `deck.visibility === 'private'`: clicking Share shows a confirm UI and calls `updateDeckVisibility(deck.id, 'users')` then copies link.
  - If `deck.visibility === 'users'`: clicking Share copies the link immediately; a small dropdown offers “Disable sharing,” which calls `updateDeckVisibility(deck.id, 'private')`.

- Editing behavior:
  - Determine owner: `isOwner = session?.user?.id === deck.owner_id` (optional for UI badges).
  - When `deck.visibility === 'users'`, all authenticated users can:
    - Insert elements, drag, edit text.
    - Add/delete slides.
  - Persistence calls (`createSlide`, `updateSlideYDoc`) proceed for all authenticated users; RLS ensures operations are permitted only when the deck is shared.

- Presence remains enabled for all; everyone’s cursors render.

- Optional UI: Show last edited info in the top bar
  - Display: "Last edited {relative_time} by {user}" if available.
  - If a `profiles` table exists, join on `last_edited_by` to render a display name; otherwise show a truncated user id or hide the name.

### API Changes
- New endpoint/helper: `updateDeckVisibility(deckId: string, visibility: 'private' | 'users')` in `src/lib/api/decks.ts`.
  - `UPDATE decks SET visibility = $1 WHERE id = $2 RETURNING *`.
- Existing `fetchDeckById` and slides fetch will auto-work once RLS is updated.
- No new endpoints are required for change tracking; a DB trigger updates `decks.last_edited_by/last_edited_at` on slide edits.

### Security Considerations
- RLS allows all authenticated users to SELECT and WRITE slides when `visibility = 'users'`.
- Only owners can toggle visibility and edit deck metadata; the Share button is hidden for non-owners.
- UI hints (like disabled controls) help, but RLS enforces the true permissions.

### Migration SQL (Supabase)
Note: Adjust schema names as needed.

```sql
-- 1) Enum and column
create type deck_visibility as enum ('private', 'users');
alter table public.decks add column if not exists visibility deck_visibility not null default 'private';

-- 1b) Deck change tracking columns
alter table public.decks add column if not exists last_edited_by uuid null;
alter table public.decks add column if not exists last_edited_at timestamptz null;
comment on column public.decks.last_edited_by is 'User ID of most recent editor (maintained by trigger)';
comment on column public.decks.last_edited_at is 'Timestamp of most recent edit (maintained by trigger)';

-- 2) Enable RLS
alter table public.decks enable row level security;
alter table public.slides enable row level security;

-- 3) Policies for decks
drop policy if exists "decks_owner_full" on public.decks;
create policy "decks_owner_full"
  on public.decks
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "decks_authenticated_can_select_shared" on public.decks;
create policy "decks_authenticated_can_select_shared"
  on public.decks
  for select
  to authenticated
  using (visibility = 'users');

-- 4) Policies for slides
drop policy if exists "slides_owner_full" on public.slides;
create policy "slides_owner_full"
  on public.slides
  for all
  using (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.owner_id = auth.uid()
  ));

drop policy if exists "slides_authenticated_can_select_shared" on public.slides;
create policy "slides_authenticated_can_select_shared"
  on public.slides
  for select
  to authenticated
  using (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.visibility = 'users'
  ));

-- 5) Trigger to update deck last edited fields on slide changes
create or replace function public.fn_decks_touch_last_edited()
returns trigger as $$
begin
  update public.decks
     set last_edited_by = auth.uid(),
         last_edited_at = timezone('utc', now())
   where id = coalesce(new.deck_id, old.deck_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_slides_touch_deck_last_edited_ins on public.slides;
create trigger trg_slides_touch_deck_last_edited_ins
after insert on public.slides
for each row execute function public.fn_decks_touch_last_edited();

drop trigger if exists trg_slides_touch_deck_last_edited_upd on public.slides;
create trigger trg_slides_touch_deck_last_edited_upd
after update on public.slides
for each row execute function public.fn_decks_touch_last_edited();

drop trigger if exists trg_slides_touch_deck_last_edited_del on public.slides;
create trigger trg_slides_touch_deck_last_edited_del
after delete on public.slides
for each row execute function public.fn_decks_touch_last_edited();

drop policy if exists "slides_authenticated_can_write_shared" on public.slides;
create policy "slides_authenticated_can_write_shared"
  on public.slides
  for insert
  to authenticated
  with check (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.visibility = 'users'
  ));

create policy "slides_authenticated_can_update_shared"
  on public.slides
  for update
  to authenticated
  using (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.visibility = 'users'
  ))
  with check (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.visibility = 'users'
  ));

create policy "slides_authenticated_can_delete_shared"
  on public.slides
  for delete
  to authenticated
  using (exists (
    select 1 from public.decks d
    where d.id = slides.deck_id and d.visibility = 'users'
  ));
```

### Testing Plan
- Owner can view and edit their deck when private.
- Non-owner cannot view when private (gets 401/404 due to RLS, still auth-gated route).
- Owner enables sharing; share link is copied.
- Non-owner (authenticated) can view and edit; toolbar visible; edits persist.
- Share button is not visible to non-owners.
- Presence shows cursors for both users.
- Last edited updates:
  - Owner edits -> deck.last_edited_by = owner id; last_edited_at updated.
  - Collaborator edits -> deck.last_edited_by = collaborator id; last_edited_at updated.

### Rollback Plan
- Set all decks to `visibility = 'private'`.
- Drop policies permitting shared view.
- Optionally drop the column/enum (data migration required if other features depend on it).

### Future Extensions
- Add `visibility = 'public'` for anonymous viewing.
- Secret links and expiring tokens.
- Collaborator roles with edit rights.
- Share analytics (views, unique users).


