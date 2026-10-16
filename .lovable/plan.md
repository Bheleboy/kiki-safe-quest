# Answer: SiteChecker dependencies (read-only, no changes)

## 1. Everything that touches SiteChecker
| File | What it does | Needs SiteChecker login? |
|---|---|---|
| `.env` | Defines `VITE_SITECHECKER_SUPABASE_URL` / `_KEY` (SiteChecker public anon key) | n/a |
| `src/integrations/sitechecker/client.ts` | Second browser client for SiteChecker, session stored under `sitechecker-admin-auth` | n/a (it is the login mechanism) |
| `src/hooks/useAdminAuth.ts` | Magic-link sign-in to SiteChecker (redirect to `/admin`), then checks SiteChecker `dashboard_user_clients` for the Kiki client id | Yes |
| `src/pages/AdminDashboard.tsx` ~L154 | Overview stats: calls SiteChecker function `kiki-admin-stats` with the SiteChecker token | Yes |
| `src/pages/AdminDashboard.tsx` ~L384 | Search tab: reads SiteChecker `gsc_daily_metrics`, `gsc_queries`, `gsc_pages` | Yes |
| `src/pages/AdminDashboard.tsx` ~L557 (reviews) and `src/components/admin/SecurityPanel.tsx` | Send SiteChecker token to Kiki functions | Yes |
| `supabase/functions/admin-parent-reviews` | Verifies SiteChecker token + client membership, then uses Kiki service role | Yes |
| `supabase/functions/admin-security` | Same verification pattern | Yes |
| `supabase/functions/admin-stats-export` | Same verification, then runs the 4 stats RPCs | Yes |

## 2. How Kiki admins get access
- The `/admin` page itself uses only SiteChecker magic-link auth plus SiteChecker `dashboard_user_clients`. It does not use Kiki's own login or `profiles.is_admin`.
- Kiki's own admin flag is `profiles.is_admin` (set by the `handle_admin_email` trigger for two emails, locked by `lock_is_admin`, checked by `is_admin()`). It is used only to: show the Admin link in Navbar / ParentDashboard, skip the AgeGate (`App.tsx`), and bypass the parent PIN / learner lock (`ParentGate`, `ManageChildren`, `Course`).
- So the whole admin area (stats, search, reviews, security) depends on SiteChecker. Nothing grants admin data access via Kiki auth alone.

## 3. Callers of `admin-stats-export`
None. Only its own test file references it. The dashboard still fetches stats from SiteChecker's `kiki-admin-stats`.
