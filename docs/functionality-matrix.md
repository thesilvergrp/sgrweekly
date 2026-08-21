# Functionality Matrix

Every user-facing capability of the existing frontend, its backend dependency, whether the rebuild
must keep it, and how the rebuild implements it. "New implementation" names files in the new
`src/` tree; none of them reuse the old markup, styling, or component structure.

## Global / shell

| Existing function | Backend dependency | Required in new app | New implementation |
|---|---|---|---|
| Fixed top bar, hamburger-only menu panel (Contact / About / Properties + phone + email) | None | Yes (navigation), No (its design) | `components/layout/SiteHeader.tsx` — inline desktop nav with a scroll-spy underline, full-height slide-in drawer on mobile, focus trap + Escape, skip-to-content link |
| Smooth-scroll section navigation with `IntersectionObserver` scroll spy | None | Yes | `hooks/useSectionSpy.ts` + `lib/scroll.ts` (`prefers-reduced-motion` aware, header-height offset) |
| Footer: brand, quick links, contact details, back-to-top | None | Yes | `components/layout/SiteFooter.tsx` — 4-column editorial footer, new copy, contact facts preserved |
| Brand mark: S3 `sgLogo.png` + Lucide house glyph + script wordmark | S3 (public read) | Facts yes, artwork no | `components/brand/BrandMark.tsx` — original inline SVG monogram; S3 URL retained/documented in `config/assets.ts` |
| `?property=<slug>` deep link consumed then stripped from the URL | None | **Yes (contract)** | `app/router.ts` + `hooks/useStayRoute.ts` — same parameter, now kept in the URL with `pushState`, so Back/refresh/copy-link work |
| `or_*` params stripped on load | OwnerRez widget return trip | **Yes (contract)** | `lib/url.ts#stripTransientParams`, called from `main.tsx` before render |
| Static catalog rendered first, live catalog swapped in silently on success | `GET /api/properties` | Yes | `features/catalog/useStayCatalog.ts` — same optimistic strategy, plus an explicit `source: 'offline' \| 'live'` state surfaced as a dismissible notice |

## Home page

| Existing function | Backend dependency | Required in new app | New implementation |
|---|---|---|---|
| Hero: full-bleed stock photo, centred serif headline, dark gradient overlay | None | No (it is pure presentation) | `features/home/HeroSection.tsx` — split editorial layout: type column + asymmetric photo mosaic sourced from live stay photography, no stock imagery |
| Airbnb-style rounded pill search (Where / When / Who) with three dropdown panels | None (client-side over the catalog) | Yes (find a stay) | `features/search/StayFinder.tsx` — labelled inline field row on a bordered card; combobox with keyboard navigation (↑/↓/Enter/Escape) and ARIA `listbox` semantics; matches name, location and property type |
| Date range picker in the hero ("When") | None | Yes | `features/booking/DateRangeField.tsx` + `components/calendar/MonthGrid.tsx` (one shared calendar primitive drives hero, detail and finder) |
| Guests / pets counters | None | Yes | `components/ui/Stepper.tsx` |
| "Our Portfolio" grid, 6 curated ids, 3-up cards, image + location + name + bed/bath | `GET /api/properties` | Yes | `features/catalog/StayGrid.tsx` + `StayCard.tsx` — new card composition (index badge, meta rule, hover reveal), plus loading skeletons, empty state and error state with retry |
| Curated home list of 6 OwnerRez ids while all stays remain searchable | Business rule | **Changed on request** | `featuredStayIds` in the content document is now the site's *entire* published inventory, not just the grid. Properties outside it are invisible to the public site — no grid, no search, no `?property=` resolution, no map pin — while staying active in OwnerRez. Enforced once in `useStayCatalog`, so no component can leak one by forgetting to filter. The admin editor still sees every property, so copy can be written before a property goes live. |
| "Resort-Style Amenities" 3-card section | None | Yes (concept) | `features/home/AmenitiesSection.tsx` — new copy, custom icons, 2×2 editorial grid with numbered rules |
| "About Us" split section with S3 logo image | S3 | Yes (concept) | `features/home/AboutSection.tsx` — new copy, stat row, no logo image dependency |
| Contact section: form (name/email/phone/topic/message/consent) that only `setTimeout`s — **no backend** | **None (stubbed)** | Yes, honestly | `features/contact/ContactSection.tsx` — real validation, accessible errors, and a genuine `mailto:` handoff to `Bookings@silvergrouprentals.com`; the UI never claims a message was transmitted to a server that does not exist |
| Leaflet map of property locations, house pins, area-centre fallback | `GET /api/properties` (lat/lng) | Yes | `features/map/StayMap.tsx` — new pin artwork, new popup card, keyboard-reachable list of locations beside the map for a11y, same OSM tiles + attribution |

## Stay (property) detail

| Existing function | Backend dependency | Required in new app | New implementation |
|---|---|---|---|
| 1-large + 2×2 photo collage header | Content layer / OwnerRez thumbnail | Yes (browse photos) | `features/stay/StayGallery.tsx` — full-width lead image with a scrollable filmstrip and counter |
| "View all photos" scrolling grid overlay | — | Yes | `features/stay/GalleryViewer.tsx` — modal lightbox: ←/→ keys, counter, thumbnail rail, focus trap, scroll lock |
| Title block, location, bed/bath/guest facts | `GET /api/properties` | Yes | `features/stay/StayHeader.tsx` + `StayFacts.tsx` (definition-list markup) |
| Share via Web Share API → clipboard fallback → toast | — | Yes | `lib/share.ts` + `hooks/useToast.tsx` — same three-tier strategy, `AbortError` still swallowed |
| Long description | Content layer | Yes | `features/stay/StayOverview.tsx` — clamped with "Read the full description" disclosure |
| Amenity list with icon mapping (incl. verbatim OwnerRez amenity vocabulary) | Content layer | Yes | `features/stay/StayAmenities.tsx` + `lib/amenity-icons.ts` — original SVG icon set, same vocabulary keys preserved so live data still maps |
| "Things to know": cancellation policy, rules preview, safety list | Business data | Yes | `features/stay/StayPolicies.tsx` — policy **table** + "All house rules" modal |
| Per-property cancellation policy by id, pet allow-list, 4 PM / 11 AM, max 2 pets | Business data | **Yes** | `content/policies.ts` — same ids, same policies, new API (`resolveStayPolicies`) |
| Availability calendar greying out bookings and owner blocks | `GET /api/properties/{id}/bookings` | **Yes** | `features/booking/AvailabilityCalendar.tsx` + `lib/availability.ts` (independent implementation: merged, sorted intervals + binary search) |
| "Checking availability…" spinner before dates are selectable | Same | **Yes** | Calendar skeleton; selection stays disabled until every page has merged |
| Availability failure → treat everything as open, log a warning | Same | **Yes** | Same fallback, now with a visible "live availability unavailable" notice so the visitor is not misled |
| Whole-week stays, 7-night minimum, snap-to-week, shrink to fit before a conflict | Business rule | **Yes** | `lib/stay-rules.ts` — same rule, new interaction: pick an arrival, then choose the number of weeks with a stepper capped by `maxWeeksFrom()`; arrivals with no room for the minimum stay are disabled with an explanation |
| Guest stepper capped at `max_guests`; pet stepper only when pets allowed, capped at 2 | `GET /api/properties` + business data | **Yes** | `features/booking/ReservationPanel.tsx` |
| "Reserve" → OwnerRez widget iframe modal, prefilled `or_*` params, `postMessage` → top-window redirect | **OwnerRez widget** | **Yes — verbatim** | `features/booking/ReservationHandoffDialog.tsx` + `services/ownerrez-widget.ts` (widget id, param names, origin check and redirect preserved exactly) |
| Nightly pricing endpoint defined but never displayed | `GET /api/properties/{id}/pricing` | Optional | **Newly wired:** `features/booking/useStayPricing.ts` renders per-night rates in calendar cells and an itemised stay-total table; silently degrades if the v1 endpoint is unavailable |
| Direct inquiry POST defined but never called | `POST /api/inquiries` | Optional | **Newly wired:** `features/booking/EnquiryDialog.tsx` — "Ask about these dates" secondary action, client-side mirror of the server's required-field validation |
| Back to "All Properties" | — | Yes | Breadcrumb + browser Back (now correct thanks to real history entries) |

## Cross-cutting states

| Existing behaviour | New implementation |
|---|---|
| No skeletons — static data shown instantly, live data swapped in | `components/ui/Skeleton.tsx`; card/gallery/calendar/table skeletons |
| No empty states except "No properties available right now." | Purpose-built empty states for catalog, search results, gallery and availability |
| Errors only `console.warn`ed | `components/ui/Notice.tsx` + `lib/errors.ts` — visitor-safe messages by status class (network / 4xx / 5xx / credential), retry actions, technical detail behind a disclosure |
| No toasts except the "Link copied" pill | `hooks/useToast.tsx` — polite live region, auto-dismiss, stacking |
| Modals: bespoke per component, no focus trap | `components/ui/Modal.tsx` — one primitive: `role="dialog"`, `aria-modal`, focus trap, restore focus, Escape, scroll lock, reduced-motion aware |

## Not applicable

* **Dashboards / admin surfaces** — the application has no authenticated area and no admin data; the
  only tabular data available from the backend is nightly pricing, which is presented as a rates
  table on the stay page.
* **File upload / download** — no S3 upload path, no signed URLs, no downloadable artefacts exist.
  The only S3 interaction is a public-read `<img>`.
* **Authentication / authorisation** — no Cognito, no sign-in, no protected route. Authorisation is
  entirely server-side: the Lambda holds the OwnerRez credentials and the browser never sees them.
  That property is preserved — the new frontend sends no credentials, tokens, or auth headers.
