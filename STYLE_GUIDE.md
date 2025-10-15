# what2wear Style Guide

This document outlines the visual style guide for the what2wear application. It is the single source of truth for colors, typography, spacing, and component design.

## Color Palette (Dark Mode First)

The color palette is designed to be modern, bold, and visually striking, with a default dark mode theme.

| Color      | Hex       | Usage                               |
| ---------- | --------- | ----------------------------------- |
| Background | `#1B2021` | Main background                     |
| Surface    | `#30343F` | Cards, input fields, secondary surfaces |
| Primary    | `#EA638C` | Primary buttons, links, active states |
| Secondary  | `#89023E` | Secondary accents, hover states     |
| Text       | `#FFD9DA` | Body text, headings, labels         |
| Text Light | `#a9a9a9` | Secondary text, placeholders        |
| Success    | `#2ecc71` | Success messages, notifications     |
| Error      | `#e74c3c` | Error messages, notifications       |

### Extended design tokens (recommended additions)

Add these tokens to the project `@theme` (Tailwind) or CSS variables so they can be referenced consistently across components.

Tokens (examples):

- --color-background: #1B2021
- --color-surface: #30343F
- --color-surface-2: #373a44
- --color-surface-3: #42444E
- --color-primary: #EA638C
- --color-primary-foreground: #1B2021
- --color-secondary: #89023E
- --color-text: #FFD9DA
- --color-text-muted: #a9a9a9
- --color-border: rgba(255, 255, 255, 0.06)
- --color-success: #2ecc71
- --color-error: #e74c3c
- --color-ring: rgba(234, 99, 140, 0.28)

Rationale: central tokens make it trivial to swap themes and produce matching Tailwind utilities.

## Typography

The primary font for the application is **Nunito Sans**. It is a clean, modern, and highly readable sans-serif font that is well-suited for mobile interfaces.

### Type Scale

The following responsive type scale should be used throughout the application. All sizes are in `rem` units.

| Element         | Mobile (`rem`) | Desktop (`rem`) | Font Weight |
| --------------- | -------------- | --------------- | ----------- |
| Heading 1 (h1)  | 2.5            | 3               | 700 (Bold)  |
| Heading 2 (h2)  | 2              | 2.5             | 700 (Bold)  |
| Heading 3 (h3)  | 1.5            | 1.75            | 600 (Semi-Bold) |
| Body            | 1              | 1               | 400 (Regular) |
| Small           | 0.875          | 0.875           | 400 (Regular) |

### Recommended premium type system (mobile-first)

- Primary UI font: consider switching to Inter / Plus Jakarta Sans / Satoshi for a premium feel. If you keep Nunito, use next/font or self-host for performance.
- Mobile scale (recommended):
  - Display / Hero: 2rem (32px) mobile, 3rem(48px) desktop
  - H1: 1.5rem (24px) mobile, 2rem (32px) desktop
  - H2: 1.125rem (18px) mobile, 1.5rem (24px) desktop
  - Body: 1rem (16px)
  - Small / Caption: 0.875rem (14px)

Rationale: tighter type scale improves perceived polish and legibility on small screens.

## Spacing

An **8px grid system** is used for all spacing and layout. All margins, paddings, and gaps should be multiples of 8px (e.g., 8px, 16px, 24px, 32px). This ensures a consistent and harmonious layout.

### Spacing tokens

- --spacing-1: 4px (utility micro)
- --spacing-2: 8px
- --spacing-3: 12px
- --spacing-4: 16px
- --spacing-5: 24px
- --spacing-6: 32px

Use these tokens with Tailwind `@theme` to generate utilities like `p-4`, `gap-5` etc.

## Component Design

This section provides design specifications for common UI components.

### Buttons

- **Primary Button:**
  - Background: `Primary` (`#EA638C`)
  - Text: `Background` (`#1B2021`)
  - Padding: `12px 24px`
  - Border Radius: `8px`
- **Secondary Button:**
  - Background: `Surface` (`#30343F`)
  - Text: `Text` (`#FFD9DA`)
  - Padding: `12px 24px`
  - Border Radius: `8px`
- **Accent/Destructive Button:**
  - Background: `Secondary` (`#89023E`)
  - Text: `Text` (`#FFD9DA`)
  - Padding: `12px 24px`
  - Border Radius: `8px`

#### Button system (recommended)

- Sizes: small (36-40px), medium (44-48px), large (56px)
- Variants: primary (solid), secondary (tonal/filled), outline, ghost, destructive
- States: hover (slight increase in elevation or lightening of fill), active (scale down 0.98), disabled (opacity 0.5, no pointer events), focus (ring using --color-ring)

Implementation notes:
- Primary: `bg-primary text-primary-foreground shadow-sm` with `hover:brightness(1.03)` and `focus:ring-2 focus:ring-primary`.
- Secondary: filled surface with subtle border and high-contrast text.
- Ghost: for icon-only actions, keep minimal padding and circular hit area >=44px.

### Cards

- Background: `Surface` (`#30343F`)
- Padding: `16px`
- Border Radius: `12px`
- Box Shadow: `0 4px 6px rgba(0, 0, 0, 0.1)`

Recommendations:

- Use tonal elevation rather than heavy shadows for most surfaces (Material 3 guidance). Reserve shadow for prominent floating elements.
- Card padding: 16px (mobile), 24px (desktop).
- Border radius: 12px (consistent with style guide).

Card states:
- Rest: surface color
- Hover (desktop): increase elevation via surface-2 + subtle translateY -2px
- Press: scale 0.995

### Forms

- **Input Fields:**
  - Background: `Surface` (`#30343F`)
  - Border: `1px solid #4a4a4a`
  - Padding: `12px 16px`
  - Border Radius: `8px`
- **Labels:**
  - Font Size: `1rem`
  - Font Weight: `600` (Semi-Bold)
  - Color: `Text` (`#FFD9DA`)

### Form system improvements

- Inputs should use a filled style: `bg-surface border-transparent` with `focus:ring` and `focus:border-primary` for clarity.
- Provide inline validation messages under fields (red text + icon), avoid alert() calls.
- Replace multiple native `select` multi-selects with a chip selector and a bottom-sheet picker on mobile for better UX.

Implementation details:
- Use accessible labels and `aria-describedby` for helper text.
- Provide server and client validation paths; show spinner in place of submit text when pending.

Rationale: forms are frequent and should be fast, accessible, and non-obstructive.

---

## Motion & Interaction tokens

- Default spring: { stiffness: 320, damping: 28 } (expressive fast spatial for hero gestures)
- Effects spring (opacity/color): quicker, no overshoot: { stiffness: 420, damping: 60 }
- Page transition: opacity 0 -> 1, translateY 6px, duration 200-260ms using spring tokens.

Respect `prefers-reduced-motion`.

Rationale: consistent motion language gives a product a premium feel and is aligned with M3 guidance.

---

## Component Library & Implementation Guidance

Add a small set of shared components (to implement in `src/app/components`):

- `Button.tsx` (variants + sizes)
- `Input.tsx` (with label, helper, error, icon props)
- `BottomNav.tsx` (mobile-first nav with safe-area support)
- `ToastProvider.tsx` + `useToast` (replace alert())
- `Skeleton.tsx` (card, avatar, list)
- `Modal.tsx` (use sparingly; center with tonal surface and two CTAs)

Prefer headless UI patterns with Tailwind.

---

## Navigation & Layout

- Mobile-first: add a bottom tab bar with 4-5 primary destinations (Home, Wardrobe, Create, History, Profile).
- Use sticky footer for CTAs like Save when creating outfits.
- Avoid modal-blocking flows for routine tasks; prefer inline confirmations + undo toasts.

---

## Accessibility

- Ensure WCAG AA color contrast for all text; refine `--color-text-muted` where needed.
- Focus-visible for keyboard navigation (`:focus-visible` ring).
- Use ARIA roles for dynamic components and `aria-live` for toasts.
- Touch targets >=44x44px.

---

## Performance & Best Practices

- Use Next.js `next/image` with a blur placeholder for wardrobe images; ensure width/height to prevent CLS.
- Avoid heavy, long-running animations on route change; prefetch critical routes and images.
- Replace `alert()` usage across client actions with a `Toast` API.

---

## Implementation roadmap (prioritized)

1. Foundation: create tokens in `globals.css` and `tailwind.config` via `@theme` variables. Import premium font with next/font or host locally. Update `body` with `bg-background text-text`.
2. Shared primitives: `Button`, `Input`, `ToastProvider`, `Skeleton`, `BottomNav`.
3. Replace alert() with `useToast` across pages (`login`, `wardrobe/UploadForm`, `ItemEditForm`, `create-outfit` actions).
4. Wardrobe polish: card grid improvements, skeletons, swipe-to-undo, chip filters.
5. Create Outfit UX: stacked mobile layout, sticky save bar, elegant drop-feedback.
6. Motion tuning: route transitions, card micro-interactions, drag/drop feedback with spring tokens.
7. Accessibility pass + contrast checks.

---

## Quick Wins (to ship fast)

- Replace `alert()` with a simple toast and a success state in `UploadForm` and `ItemEditForm`.
- Add skeletons to `WardrobeGrid` and `OutfitHistoryList`.
- Add a minimal `BottomNav` component and hide the multiple "Back to Home" links.

---

## References

- Material Design 3 (Motion & Elevation)
- Apple Human Interface Guidelines (Tab bars & safe area)
- Tailwind CSS v4 Theme variables
- Framer Motion best practices
