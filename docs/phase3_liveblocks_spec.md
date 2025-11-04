# Phase 3 – Liveblocks Integration Specification

**Authentication Mode: Client-side using `publicApiKey` (MVP)**

We will begin with the simplest integration path—passing a public Liveblocks API key from an environment variable. The server-side `authEndpoint` flow remains documented in an appendix for future hardening.

---
## 1. Dependencies
- `@liveblocks/react`
- `@liveblocks/client`
- (Optional) `@liveblocks/zustand` for global presence state

> Ensure TS compiler target ≥ ES2020.

---
## 2. Authentication & Security (MVP)
> We are shipping the MVP with client-side auth for speed. Replace `authEndpoint` with `publicApiKey`.

```tsx
// src/main.tsx (excerpt)
import { LiveblocksProvider } from "@liveblocks/react/suspense";

<LiveblocksProvider publicApiKey={import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY}>
  <Router>
    <App />
  </Router>
</LiveblocksProvider>
```

Set `VITE_LIVEBLOCKS_PUBLIC_KEY` in `.env` files.

### Security Caveats
- Anyone with the link can join & edit.
- Rate-limits tied to the public key; monitor usage.
- Presence will show anonymous unless we inject user data in `RoomProvider` (`initialPresence`).

---
## 3. React Tree Setup
```tsx
// src/main.tsx (excerpt)
import { LiveblocksProvider } from "@liveblocks/react/suspense";

<LiveblocksProvider authEndpoint="/api/liveblocks-auth">
  <Router>
    <App />
  </Router>
</LiveblocksProvider>
```

> Suspense variant ensures hooks never run on server side during SSR/SSG.

---
## 4. Room Model & Shareable Links
- **Room ID** = `slide_<slideId>`
- Share URL: `/slides/<slideId>?room=<roomId>` — simply copying current URL is enough.
- Future: create short share codes stored in Supabase for public rooms.

---
## 5. Liveblocks Storage Schema
```
root
├─ content : LiveText   // Rich text body (CRDT)
└─ title   : LiveText   // Optional slide title
```
CRDT structure automatically merges edits, preventing collisions.

---
## 6. SlideEditor Component Flow
```tsx
<RoomProvider
  id={roomId}
  initialStorage={{ content: new LiveText("") }}
>
  <ClientSideSuspense fallback={<LoadingSpinner />}>
    <SlideEditor />
  </ClientSideSuspense>
</RoomProvider>
```

Inside `SlideEditor`:
```tsx
const content = useStorage(root => root.content);

const updateContent = useMutation(({ storage }, newVal: string) => {
  storage.get("content").setValue(newVal);
}, []);

return (
  <div
    contentEditable
    className="prose mx-auto max-w-3xl outline-none"
    onInput={e => updateContent(e.currentTarget.textContent ?? "")}
  >
    {content}
  </div>
);
```

---
## 7. Presence & Awareness
- `useMyPresence()` ➜ share `{ cursor, name, color }`.
- `useOthers()` ➜ render colored carets or `<LiveAvatars />`.

---
## 8. Persistence to Supabase  *(Detailed)*

### 8.1 Data model
The `decks` table (or `slides` table) already stores `content` `text` column. No schema changes required.

### 8.2 Initial load (SSR / first mount)
1. React Query (or our existing `decks.ts` helper) fetches slide row.
2. When `SlideEditorPage` mounts **before** joining the room, we call:
   ```ts
   const { data } = await decks.fetchSlide(slideId);
   const initialText = data?.content ?? "";
   ```
3. Pass `initialStorage={{ content: new LiveText(initialText) }}` to `RoomProvider` so first client seeds the room.
4. Subsequent clients simply sync from Liveblocks.

### 8.3 Live → Supabase (debounced save)
Implement `useDebouncedSave` hook:
```ts
function useDebouncedSave(slideId: string, liveText: LiveText) {
  const save = useCallback(async () => {
    const current = liveText.toString();
    await decks.updateSlide(slideId, { content: current });
  }, [slideId, liveText]);

  useEffect(() => {
    const id = setInterval(save, 10000); // every 10s
    return () => {
      clearInterval(id);
      // flush on unmount
      save();
    };
  }, [save]);
}
```
- Hook subscribes to `liveText` changes via Liveblocks’ `subscribe` API so we always send latest value.
- We also trigger `save()` on `pagehide`/`beforeunload` to avoid losing last edits.

### 8.4 Avoid redundant writes
Use `useSyncStatus()`:
```ts
const status = useSyncStatus();
if (status === "synchronizing") return; // wait
```
Save only when status === `"synchronized"` to ensure local ops merged.

### 8.5 Supabase → Live (remote edit)
If another system updates the Supabase row (e.g., API, legacy client), we can subscribe to Postgres changes using Supabase Realtime:
```ts
supabase
  .channel('public:slides')
  .on('postgres_changes', { event: 'UPDATE', table: 'slides', filter: `id=eq.${slideId}` }, payload => {
    room?.history?.batch(() => {
      liveText.setValue(payload.new.content);
    });
  })
  .subscribe();
```
This ensures two-way sync.

### 8.6 Conflict strategy
- Liveblocks CRDT is source of truth during a session.
- Supabase serves as periodic snapshot; last write wins when saving.
- Real-time Supabase events merge by overwriting LiveText value (rare).

### 8.7 Error handling
- Catch API errors; back-off and retry.
- Show banner if save fails >3 times.

*(Section numbers shifted accordingly)*

---
## 9. Connectivity UX
- Status bar text:
  - `loading | synchronizing` → “Saving…”
  - `not-loaded` → “Connecting…”
  - Lost connection → sticky banner “Reconnecting…”

---
## 9. Shareable Sessions  *(Live collaboration link)*

### 9.1 URL design
`/slides/<slideId>?room=slide_<slideId>`

• `slideId` already unique; using `slide_<id>` guarantees no clash with future room types.
• When a user copies the browser URL they inherently copy the `room` query param.

### 9.2 UI – “Share” button
```tsx
import { Button } from "components/ui/Button";

function ShareButton({ slideId }: { slideId: string }) {
  const url = `${window.location.origin}/slides/${slideId}?room=slide_${slideId}`;
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };
  return <Button onClick={copy}>Share</Button>;
}
```

### 9.3 Joining flow
1. `SlideEditorPage` reads `room` query param. If absent → derive `slide_<slideId>`.
2. Pass this `roomId` to `RoomProvider`.
3. Presence list reflects new user instantly.

### 9.4 Optional: public / private
- Add `is_public` boolean column on `slides`.
- If not public, generate **signed token** in URL (?token=jwt) after we migrate to `authEndpoint`.

### 9.5 Deep linking to selection / cursor (future)
We can append hash `#l=23` to indicate highlighted text range for review sessions.

---
## 10. Edge Cases
- First visit to empty slide ⇒ Liveblocks creates storage automatically.
- Slide deletion ⇒ background job removes Liveblocks room (optional).
- Multi-tab edits handled natively by CRDT.

---
## 11. Implementation Plan (per file)
| File | Responsibility |
| --- | --- |
| `package.json` | Add dependencies |
| `src/lib/liveblocks.ts` | Client helper + exported hooks (unit-test friendly) |
| `src/main.tsx` | Wrap with `LiveblocksProvider` |
| `src/pages/SlideEditorPage.tsx` | Instantiate `RoomProvider`, remove local state |
| `src/components/LiveEditor.tsx` | Collaborative editor UI |
| `pages/api/liveblocks-auth.ts` | Secure token endpoint |
| `src/hooks/useDebouncedSave.ts` | Persistence logic |
| `src/components/PresenceAvatars.tsx` | Optional custom avatars |

---
## 12. Roll-out Sequence
1. **Dependencies** – install packages.
2. **Auth endpoint** – verify token flow in dev.
3. **Provider** – application-wide wrapper.
4. **Minimal editor** – plain textarea using CRDT.
5. **Presence UI** – avatars & cursors.
6. **Supabase persistence** – debounce writes.
7. **Share link button** – copy current URL.
8. **Status banners** – handle sync/lost states.
9. **Polish & tests**.

---
### ✅ This specification covers
- Concurrent editing without collisions (LiveText CRDT)
- Shareable room links
- Periodic Supabase backups
- Reconnection handling & UX polish

---
## Appendix – Upgrading to Secure `authEndpoint` (Future)
When we move beyond the MVP we’ll switch to server-side authentication using an **auth endpoint** instead of the public key.

### 1. Serverless endpoint
Create `/api/liveblocks-auth.ts` that verifies the user’s Supabase session and returns a signed Liveblocks token.

```ts
import { authorize } from "@liveblocks/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  const { user } = await supabase.auth.getUser(req.headers["authorization"]);
  if (!user) return res.status(403).json({ error: "unauthorized" });

  const token = await authorize({
    room: req.body.room,
    userId: user.id,
    userInfo: {
      name: user.user_metadata.full_name,
      avatar: user.user_metadata.avatar_url,
    },
  }, { secret: process.env.LIVEBLOCKS_SECRET_KEY! });

  res.json(token);
}
```

### 2. Provider change

```tsx
<LiveblocksProvider authEndpoint="/api/liveblocks-auth">
  {/* App */}
</LiveblocksProvider>
```

### Benefits
| Benefit |
| --- |
| Secure mapping of Liveblocks user ↔ Supabase user |
| Ability to restrict room access (owner, invite-only) |
| No public key abuse / better rate-limit control |

### Migration steps
1. Add endpoint file above.
2. Store `LIVEBLOCKS_SECRET_KEY` in environment variables.
3. Replace `publicApiKey` prop with `authEndpoint`.
4. Deploy to environment supporting serverless functions (Vercel, Netlify, etc.).

Once this is live we can also enhance presence info (names, avatars) automatically via the token payload.
