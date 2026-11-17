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
- [x] Test and deploy the export function.

# Warrior Pass
- [x] Phase 1a: additive database tables, policies, settings seed and has_course_access (switched off).
- [x] Phase 1b: fail-open course gate, child locked screen, forced parent PIN, parent notification (switched off).
- [x] Phase 2: Yoco checkout (create-checkout, yoco-webhook, unlock card, return page, parent status card), switched off.
- [ ] Phase 2 go-live: add Yoco secret key and webhook secret, register the webhook URL with Yoco, run one real test payment.
- [x] Phase 3: Warrior Points (award-points), Armour Kit release + save-delivery, certificate, family library (book checkout, library-link), tests. Switched off.
- [x] Phase 3 go-live prep: kit contents confirmed (coin + wristband), book PDF uploaded privately, library_book_path and book price set (Phase 5a).
- [x] Phase 4: admin-orders (orders, refunds, rewards, settings, master switch, passes, stats, bulk codes), redeem-code, admin tabs, parent code entry, tests. Switched off.
- [ ] Phase 4 go-live: live Yoco key for refunds; signed-in admin walkthrough of the new tabs.
- [x] Phase 5a: approved prices, kits sold separately with one delivery fee, kit and pendant stock, bonus pendants, new book cover, admin PDF upload, receipt business name and reply-to. Switched off.
- [ ] Phase 5a go-live: confirm the placeholder delivery fees (or add Courier Guy live rates); set support_email if parents should reply to a real inbox.
