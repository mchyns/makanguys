# MakanGuys Design System

## 1. Visual World & Philosophy
MakanGuys is a community culinary discovery map with an intentional, crisp, and tactile visual identity. It reflects modern digital mapping tools combined with an authentic, friendly local street food guide.

It avoids generic AI slop:
- No overwhelming purple-blue gradient soup
- No gratuitous blur/glassmorphism
- No decorative emoji in place of standard UI icons
- No fake social proof or fabricated review ratings
- Real map-first spatial hierarchy, purposeful micro-interactions, and accessible typography.

## 2. Color Palette & Tokens
| Token | Hex Value | Semantic Usage |
|---|---|---|
| `primary` | `#2563EB` | Main CTA buttons, active map pins, active filters, brand highlight |
| `primary-dark` | `#1D4ED8` | Button hover states, pressed states, deep links |
| `navy` | `#102A56` | Top navigation branding, key headers, distinct badges |
| `blue-light` | `#DBEAFE` | Selection pill background, active card ring, subtle highlight |
| `blue-pale` | `#EFF6FF` | Soft container background, active item tinted surface |
| `background` | `#F8FAFC` | Page backdrop, canvas background |
| `surface` | `#FFFFFF` | Cards, popups, modals, bottom sheets, form surfaces |
| `text-primary`| `#172033` | Headings, primary titles, high-contrast readable copy |
| `text-secondary`| `#64748B` | Subtext, timestamps, addresses, metadata |
| `border` | `#E2E8F0` | Subtle clean borders, divider lines |
| `success` | `#15803D` | Approved badges, success toasts, open indicators |
| `danger` | `#DC2626` | Reject actions, report buttons, error notifications |

## 3. Typography
- Display / Headings: Modern geometric sans (Geist / Inter) with tight letter-spacing (`tracking-tight`), strong optical hierarchy.
- Body: 15–16px clean text with optimal reading line height (`leading-relaxed`).
- Metadata & Labels: 12–13px uppercase or medium weight with crisp contrast.
- Numeric / Currency: `tabular-nums` for price tags (e.g. `Rp 25.000`).

## 4. Components & Anatomy
- **Map Container**: Dominant, edge-to-edge or split-panel, fluid height with MapLibre GL JS vector tiles.
- **Custom Pins**: Dual-layered SVG pin with icon symbol and subtle pulse on active selection.
- **Food Cards**: Clean white surface, 1px border (`#E2E8F0`), subtle shadow (`shadow-sm` on rest, `shadow-md` on hover), rounded 14px (`rounded-xl`), high quality aspect-ratio 16:10 photo thumbnail with category badge.
- **Form Steps**: Progressive multi-step layout with clear progress indicator, coordinate pinpoint button, instant photo preview with remove actions.
- **Mobile Experience**: Responsive split view: switch between interactive Map and List, smooth bottom sheet for place detail preview, persistent thumb-accessible "Tambah Tempat" floating button.
- **Admin Moderation Shell**: Focused dashboard with tabular / card review list, quick approve/reject/hide actions, and report resolution flow.
