# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js (App Router), React 19, TypeScript, Tailwind CSS, MapLibre GL JS, Supabase (PostgreSQL & Storage), Zod, React Hook Form

## Users
Food hunters, students, office workers, tourists, and culinary explorers in Indonesia looking for hidden gem food spots, humble warungs, street food, and authentic local delicacies. Also everyday foodies wishing to pin and share recommendations frictionlessly without an account.

## Product Purpose
MakanGuys is a community-driven culinary discovery map ("Temukan yang enak, tandai tempatnya") where anyone can discover, pin, and share interesting food spots on an interactive 3D/flat map without needing to register or log in.

## Positioning
Zero-friction, map-first community food discovery emphasizing real humble eateries, warung, and street food with exact map coordinates, honest recommendations, and authentic photos—rather than algorithmically manipulated corporate restaurant rankings or sponsored reviews.

## Operating Context
Mobile and desktop browsers outdoors or at home; discovering food nearby or exploring specific areas, viewing photos, getting instant directions to Google Maps, filtering by price and cuisine categories, saving spots locally to browser storage, and submitting new discoveries directly with coordinate picking and photo uploads.

## Capabilities and Constraints
- Public exploration: Interactive MapLibre GL JS map with vector tiles (OpenFreeMap), custom MakanGuys markers, clustering, 3D tilt/pitch toggle, locate-me GPS, place preview card.
- Place discovery: Real-time debounced search by name, food item, category, address; category chips; price range filters; sort orders (Newest, Oldest, A-Z).
- Public recommendation submission without account: Multi-step accessible form, coordinates picked from interactive map, photo upload with camera/gallery preview (up to 5 photos, max 5MB, raster formats), contributor name or anonymous toggle, price range, featured dishes, and honeypot anti-spam protection.
- Place detail page: `/tempat/[slug]` with responsive gallery, mini map, Google Maps navigation link, Web Share API with copy fallback, and reporting modal.
- Local bookmarks: `/tersimpan` saves places to device localStorage with transparent explanation that it lives locally on that device.
- Moderation system: All user submissions land in `pending` status. Moderation admin panel at `/admin` protected with server-validated session cookie (`ADMIN_PASSWORD` & `ADMIN_SESSION_SECRET`), place approval/rejection/deletion, and user report handling.
- Security: Server-side validation with Zod, RLS policies, safe file uploads, sanitized outputs, no leaking of server secrets or database internals.

## Brand Commitments
- Name: MakanGuys
- Tagline: "Temukan yang enak, tandai tempatnya."
- Primary Language: Indonesian (natural, casual, modern, clear).
- Color Identity: Vibrant, curated electric blue (`#2563EB`) as primary with Navy (`#102A56`) accents, clean surfaces (`#FFFFFF`), subtle slate borders (`#E2E8F0`), and soft neutral background (`#F8FAFC`). No generic AI slop, no purple gradient washes, no gratuitous glassmorphism.
- Iconography: Lucide React (clean, consistent stroke width).
- Typography: Geist / Inter modern sans with solid visual hierarchy and tabular numerals for prices.

## Evidence on Hand
- Full database schema with PostgreSQL tables (`places`, `place_photos`, `reports`), RLS policies, spatial indices, seed data for Indonesian culinary spots.
- Vector map style via OpenFreeMap (`https://tiles.openfreemap.org/styles/bright`).

## Product Principles
1. Map is the core product, not a decorative background.
2. Zero barrier to contribute: No account or login required for public discovery and submission.
3. Radical honesty: Every recommendation has verifiable coordinates, real photos, and no fake ratings or bots.
4. Mobile-first ergonomics: Smooth touch gestures, bottom sheets, accessible controls reachable with one hand.
5. Trust & Community Safety: Default `pending` moderation, reporting mechanisms, and resilient anti-spam.

## Accessibility & Inclusion
Semantic HTML5, fully labeled form controls, keyboard-accessible dialogs and map alternatives (list view), high contrast text ratios (≥4.5:1), and honoring `prefers-reduced-motion`.
