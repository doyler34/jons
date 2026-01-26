# Audit Report (read-only)

This report summarizes a static audit of the repository for **correctness, persistence, security, caching, performance, and UX**.  
Scope: **report only** (no fixes applied as part of this report).

## Key takeaways

- **Data persistence** for admin-managed content is mostly solid (Postgres + Vercel Blob), but there is **schema drift risk** in the DB setup endpoint.
- The largest production risk is **admin authentication** (cookie presence is treated as authenticated).
- Music is functional but has **redundant “source of truth” logic** (overrides applied both server-side and client-side) and typical mobile autoplay constraints.
- Newsletter/subscriber flows are **Brevo-based** in current code; older MailerLite expectations do not apply unless you intentionally switch providers.

---

## Findings (prioritized)

### Blocker

1) Admin auth is cookie-presence only
- **Impact**: Any client can set an `admin_session` cookie value and become “authenticated” because server checks only that the cookie exists.
- **Where**: `y/app/api/admin/auth/route.ts` (`GET` checks presence only; other routes rely on this cookie existing).
- **Recommended fix**: Use a signed session cookie (HMAC) or server-side sessions. At minimum: issue/verify a signed token using a server secret and validate expiry.

2) DB schema drift: `song_overrides` created inconsistently
- **Impact**: If `y/app/api/db/setup/route.ts` was ever run first, it creates a `song_overrides` table that does **not** match what other routes expect (different `id` type, missing `hidden` column). This can cause subtle breakage.
- **Where**:
  - `y/app/api/db/setup/route.ts` (UUID id, no `hidden`)
  - `y/app/api/songs/overrides/route.ts` (expects `hidden`, uses `SERIAL`)
  - `y/app/api/spotify/route.ts` (creates table with `hidden`)
- **Recommended fix**: Remove/replace `db/setup` with a single canonical migration approach, or align schemas everywhere.

### High

3) Newsletter immediate sends are capped at 1000 recipients
- **Impact**: once list grows beyond 1000, sends will silently omit recipients.
- **Where**: `y/app/api/admin/newsletter/route.ts` (send mode slices contacts `slice(0, 1000)`).
- **Recommended fix**: paginate list contacts and batch send, or use a bulk/campaign API that supports list recipients (plan-dependent), or queue jobs.

4) Newsletter scheduling semantics depend on DB + cron (and UI text must match)
- **Impact**: “Schedule” in UI is not native provider scheduling; it depends on DB rows + cron hitting `/api/admin/newsletter/process`.
- **Where**:
  - `y/app/api/cron/route.ts`
  - `y/app/api/admin/newsletter/process/route.ts`
  - UI: `y/app/spirit-admin-x7k9/page.tsx`
- **Recommended fix**: Ensure cron is configured and UI/labels accurately describe DB+cron scheduling.

5) Admin logout endpoint response is not returned
- **Impact**: response may be empty/undefined; clients may not reliably handle logout.
- **Where**: `y/app/api/admin/auth/route.ts` (`DELETE` calls `NextResponse.json` without `return`).
- **Recommended fix**: `return NextResponse.json({ success: true })`.

### Medium

6) Music overrides are applied twice (server and client)
- **Impact**: two sources of truth → drift risk and unnecessary network call.
- **Where**:
  - server-side merge: `y/app/api/spotify/route.ts`
  - client-side re-merge: `y/app/music/page.tsx` (fetches `/api/songs/overrides` and re-applies)
- **Recommended fix**: pick one approach (server-only or client-only) and remove the other.

7) Manual songs exist but are not shown on public music page
- **Impact**: admins can upload manual songs but users never see them (unless intentionally hidden).
- **Where**:
  - persisted: `y/app/api/songs/manual/route.ts`
  - admin UI uses it: `y/app/spirit-admin-x7k9/page.tsx`
  - missing from public: `y/app/music/page.tsx` (no fetch/merge)
- **Recommended fix**: decide intended behavior; if public, add a public read endpoint + merge into `MusicPage`.

8) Music playback reliability: autoplay/user-gesture constraints + play() rejection handling
- **Impact**: mobile Safari often blocks `audio.play()` without a user gesture; current flow attempts play on state changes and may end up in a confusing state.
- **Where**: `y/components/player-bar.tsx`
- **Recommended fix**: only call `play()` directly inside a user gesture handler; if `play()` rejects, set `isPlaying=false` and show “Tap to play”.

9) Images not optimized (performance/layout shift risk)
- **Impact**: larger downloads and potential CLS; no automatic resizing/format selection.
- **Where**:
  - `y/app/music/page.tsx` (covers)
  - `y/app/page.tsx` (artist image)
  - `y/app/events/page.tsx` (future event images)
- **Recommended fix**: use `next/image` with `sizes` + lazy-loading where appropriate.

10) Events date parsing can shift by timezone
- **Impact**: `DATE` values interpreted as UTC/local may render off-by-one day depending on runtime timezone.
- **Where**: `y/app/events/page.tsx` (`new Date(dateString)`).
- **Recommended fix**: parse `YYYY-MM-DD` manually into a local date representation.

### Low

11) Home page includes dead player state
- **Impact**: `showPlayer` never becomes true; code is unused.
- **Where**: `y/app/page.tsx`.
- **Recommended fix**: remove or wire to a real action.

12) Navigation “active” state is exact-match only
- **Impact**: section highlighting won’t work for nested routes.
- **Where**: `y/components/navigation.tsx`.
- **Recommended fix**: use `pathname.startsWith(...)` for section roots.

13) Font display strategy may cause FOIT
- **Impact**: `font-display: block` can delay text rendering.
- **Where**: `y/app/globals.css` (`@font-face`).
- **Recommended fix**: consider `font-display: swap`.

---

## Data persistence map (what survives deploys)

- **Uploads**: Vercel Blob via `y/app/api/admin/upload/route.ts` (persistent).
- **Song overrides**: Postgres `song_overrides` via `y/app/api/songs/overrides/route.ts` (persistent).
- **Manual songs**: Postgres `manual_songs` via `y/app/api/songs/manual/route.ts` (persistent).
- **Events**: Postgres `events` via `y/app/api/events/route.ts`, `y/app/api/events/[id]/route.ts` (persistent).
- **Settings**: Postgres `site_settings` via `y/app/api/settings/route.ts` (persistent).
- **Newsletter sends + tracking**: Postgres `newsletter_sends` and `newsletter_events` via `y/app/api/admin/newsletter/*` and `y/app/api/newsletter/open|click` (persistent history + analytics).
- **Subscribers list**: External provider (Brevo) via `y/app/api/newsletter/route.ts` + admin subscriber routes (provider persistence).

---

## Suggested “fix next” order (if you want a minimal patch series)

1) Harden admin auth (signed sessions) + fix logout response.
2) Unify `song_overrides` schema/migrations (remove drift).
3) Make newsletter send-to-all scale beyond 1000 and ensure schedule flow is accurate.
4) Music cleanup: eliminate overrides duplication; decide manual song public behavior; image optimization.

