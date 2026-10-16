# Homepage refresh
- [x] Add design tokens, new navigation and footer.
- [x] Add five data-backed homepage sections and swap hero quest image only.
- [x] Remove unused old sections.
- [x] Verify build, mobile menus and screenshots at all four widths.

# Sitewide visual pass
- [x] Restyle public course preview, book, legal and not-found pages.
- [x] Restyle sign-in, password recovery and age verification.
- [x] Restyle course, learner, family and parent screens plus course, armour and survey UI.
- [x] Apply only background, heading and card-border changes to admin.
- [x] Check mobile/desktop pages and behavior-preservation diff; report unreachable protected views.

Verification limits: admin data view requires its separate magic link; password recovery form requires a valid recovery link; completion-triggered armour and child survey states were reviewed without changing learner progress.

# Admin stats export
- [x] Verify the four stats RPCs deny anon/authenticated and allow service_role.
- [x] Add one SiteChecker-authenticated export function without modifying existing functions or pages.
- [ ] Test and deploy the export function.
