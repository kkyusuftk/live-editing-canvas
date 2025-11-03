# Phase 1 — Authentication (Login & Signup) Implementation Plan

This document lays out every task required to deliver the first working slice of the app: username-/email-based authentication with `/login` and `/signup` pages, hooked up to Supabase Auth.

---

## 0. Prerequisites
1. **Project bootstrapped** with Vite + React 19 + TypeScript + Tailwind (per Technical Spec).
2. **Supabase project** created with Auth enabled (email/password provider on).
3. `.env` populated with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. **Dependencies installed**:
   ```bash
   npm install react-router-dom@^6 zustand @supabase/supabase-js
   ```
   (Feel free to use yarn/pnpm equivalents.)

---

## 1. Routing Skeleton
1. Install **React Router v6** if not already.
2. Define top-level routes:
   - `/login` → `LoginPage`
   - `/signup` → `SignupPage`
   - `/home` → `HomePage` (protected; default landing post-login)
3. Make `/` redirect to `/home` if authenticated, otherwise to `/login`.
4. Add a catch-all `*` route that behaves the same as `/`.

---

## 2. Supabase Client Setup
1. Add `@supabase/supabase-js` to dependencies.
2. Create `src/lib/supabase.ts` that exports a singleton Supabase client using env vars.
3. Confirm connection by logging `supabase.auth.getSession()` on app load.

---

## 3. Global Auth Context
1. Create `AuthProvider` component (Zustand or React Context) that:
   - Subscribes to `supabase.auth.onAuthStateChange`.
   - Exposes `session`, `user`, `signIn`, `signUp`, `signOut` helpers.
2. Wrap `App` with `AuthProvider` so children can consume auth state.

---

## 4. Protected Route Helper
1. Implement `<RequireAuth>` wrapper that:
   - Renders children if `session` exists.
   - Otherwise redirects to `/login` with `redirect` query param.
2. Wrap `/home` (and every future private route) in `<RequireAuth>`.

---

## 5. Login Page (`/login`)
1. UI: two inputs (username/email, password) + **Log in** button.
2. Secondary link: “Don’t have an account? **Sign up**” → `/signup`.
3. Validation:
   - Both fields required.
4. Submit handler:
   - Resolve username → email (call RPC placeholder or treat field as email for now).
   - Call `supabase.auth.signInWithPassword({ email, password })`.
   - On success, redirect to `redirect` param or `/home`.
   - On failure, surface error message.
5. UX niceties: disabled button while loading, keyboard `Enter`, focus management.

---

## 6. Signup Page (`/signup`)
1. UI: three inputs (email, username, password) + **Create account** button.
2. Link back: “Already have an account? **Log in**”.
3. Validation:
   - Email format, username 3-24 chars, password 8+ chars.
4. Submit handler:
   - `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
   - On success, Supabase returns session (email confirmation disabled per spec).
   - Redirect to `/`.
5. Handle edge cases (username/email already in use).

---

## 7. Styling & Accessibility
1. Use Tailwind to match future design language (simple card-centered form).
2. Ensure labels are linked with inputs, aria-live region for errors.
3. Dark-mode friendly colors (Tailwind `dark:` variants).

---

## 8. Error & Loading States
1. Inline field errors + top-level banner for auth errors.
2. Global toast or alert system (simple context) to surface unexpected errors.

---

## 9. (Post-MVP) Tests — Deferred
*Testing (unit, integration, E2E) will be planned and implemented in a future phase once core flows are stable.*

---

## 10. CI Integration
1. Update GitHub Actions workflow to install Supabase CLI and run tests.
2. Set Supabase project keys as repo secrets for CI auth tests (or mock network).

---

## 11. Documentation
1. Update `README.md` with local setup steps (`supabase start`, env vars).
2. Add screenshots/GIF of auth flows.

---

## 12. Definition of Done
- Forms fully functional against Supabase Auth.
- Authenticated session persisted & reflected in UI.
- CI pipeline green (build & lint).
- Code merged into `main`; Vercel preview deploy succeeds.
