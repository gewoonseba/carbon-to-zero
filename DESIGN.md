---
name: Companion Energy Marketing
colors:
  surface: "#fefefe"
  surface-dim: "#f8f8f8"
  surface-dark: "#05060e"
  surface-dark-elevated: "#201f45"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#fefefe"
  surface-container: "#f8f8f8"
  surface-container-high: "rgba(36, 34, 32, 0.04)"
  on-surface: "#1b2540"
  on-surface-variant: "#7c7c8b"
  on-surface-muted: "rgba(27, 37, 64, 0.24)"
  on-surface-half: "rgba(27, 37, 64, 0.5)"
  on-dark: "#f9f8f9"
  on-dark-variant: "rgba(255, 255, 255, 0.7)"
  on-dark-muted: "rgba(255, 255, 255, 0.4)"
  on-dark-dim: "rgba(255, 255, 255, 0.6)"
  inverse-surface: "#000000"
  inverse-on-surface: "#f9f8f9"
  outline: "rgba(27, 37, 64, 0.24)"
  outline-variant: "#9e9ff5"
  primary: "#5d5fef"
  primary-light: "#8587ff"
  primary-muted: "#9e9ff5"
  primary-pale: "#cecbe9"
  on-primary: "#ffffff"
  on-primary-dark: "#181146"
  secondary-snow-a: "#ffffff"
  secondary-snow-b: "#f2f2f2"
  accent-warm: "#f77c0e"
  glass-surface: "rgba(247, 249, 253, 0.1)"
  glass-surface-low: "rgba(255, 255, 255, 0.2)"
  glass-surface-mid: "rgba(255, 255, 255, 0.3)"
  glass-surface-high: "rgba(255, 255, 255, 0.5)"
  error: "#ba1a1a"
  on-error: "#ffffff"
typography:
  display:
    fontFamily: Aspekta
    fontSize: 64px
    fontWeight: "400"
    lineHeight: "1.1"
    letterSpacing: -1.28px
  headline-lg:
    fontFamily: Aspekta
    fontSize: 48px
    fontWeight: "400"
    lineHeight: "1.2"
    letterSpacing: -0.96px
  headline-md:
    fontFamily: Aspekta
    fontSize: 28px
    fontWeight: "400"
    lineHeight: "1.4"
    letterSpacing: -0.56px
  headline-sm:
    fontFamily: Aspekta
    fontSize: 24px
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: -0.48px
  body-lg:
    fontFamily: Aspekta
    fontSize: 22px
    fontWeight: "350"
    lineHeight: "1.7"
  body-md:
    fontFamily: Aspekta
    fontSize: 18px
    fontWeight: "350"
    lineHeight: "1.7"
  body-sm:
    fontFamily: Aspekta
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  body-sm-medium:
    fontFamily: Aspekta
    fontSize: 16px
    fontWeight: "500"
    lineHeight: "1.5"
  label-lg:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  label-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  label-sm:
    fontFamily: Aspekta
    fontSize: 14px
    fontWeight: "350"
    lineHeight: "1.5"
    letterSpacing: -0.28px
  label-sm-regular:
    fontFamily: Aspekta
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
    letterSpacing: -0.28px
  feature-heading:
    fontFamily: Aspekta
    fontSize: 22px
    fontWeight: "350"
    lineHeight: "1.2"
    letterSpacing: -0.44px
rounded:
  xs: 4px
  sm: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 1.875rem
  2xl: 2.5rem
  pill: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section-gap: 64px
  section-padding-y: 200px
  page-padding: 64px
  card-padding: 32px
  button-padding-x: 24px
  button-padding-y: 16px
layout:
  canvas-width: 1440px
  content-max-width: 1280px
  page-padding: 64px
shadows:
  card-purple:
    offsetX: 0px
    offsetY: 42px
    blur: 42px
    spread: -21px
    color: "rgba(207, 151, 255, 0.16)"
  card-purple-ambient:
    offsetX: 0px
    offsetY: 42px
    blur: 21px
    spread: 0px
    color: "rgba(207, 151, 255, 0.16)"
  badge-inset:
    offsetX: 0px
    offsetY: 4px
    blur: 4px
    spread: 0px
    color: "rgba(255, 255, 255, 0.25)"
    inset: true
  text-heading:
    offsetX: 0px
    offsetY: 1px
    blur: 4px
    color: "rgba(0, 0, 0, 0.1)"
blurs:
  glass-sm: 10px
  glass-md: 20px
  glass-lg: 35px
  glass-xl: 50px
  decorative-sm: 11px
  decorative-md: 29px
gradients:
  brand-text:
    type: radial
    stops:
      - color: "#5d5fef"
        position: "0%"
      - color: "#7d7aee"
        position: "25%"
      - color: "#9d94ed"
        position: "50%"
      - color: "#ddc9ea"
        position: "100%"
  brand-glow:
    type: radial
    opacity: 0.48
    stops:
      - color: "#5d5fef"
        position: "0%"
      - color: "rgba(93, 95, 239, 0)"
        position: "100%"
  hero-heading:
    type: linear
    direction: to right
    stops:
      - color: "#ffffff"
        position: "0%"
      - color: "#f5f5f5"
        position: "100%"
  photo-fade:
    type: linear
    direction: to bottom
    stops:
      - color: "rgba(0, 0, 0, 0.5)"
        position: "2%"
      - color: "rgba(255, 255, 255, 0)"
        position: "100%"
components:
  button-primary:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.button-padding-y} {spacing.button-padding-x}"
  button-primary-hover:
    backgroundColor: "{colors.on-surface}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    borderColor: "{colors.primary-muted}"
    borderWidth: 1px
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "{spacing.button-padding-y} {spacing.button-padding-x}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    borderColor: "rgba(255, 255, 255, 0.3)"
    borderWidth: 1px
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
  nav-cta:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  card-industry:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card-glass:
    backgroundColor: "{colors.glass-surface-low}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    backdropBlur: "{blurs.glass-lg}"
  card-platform:
    backgroundColor: "{colors.surface-container-high}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    shadow: "{shadows.card-purple}"
  tag-badge:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    borderWidth: 1px
    typography: "{typography.label-md}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  input-email:
    backgroundColor: "{colors.glass-surface}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    height: 60px
  section-label:
    textColor: "{colors.primary}"
    typography: "{typography.label-lg}"
    textTransform: uppercase
---

## Brand & Style

Companion.energy is an energy management platform for power pioneers — fleet operators, industrial players, and utilities managing batteries, solar, EV chargers, and grid connections across the Netherlands and Europe. The marketing site communicates **clarity through complexity**: the platform tames chaotic energy data into actionable insight.

The visual identity is **premium, luminous, and confident**. It fuses a clean white canvas with deep indigo dark sections and a signature purple brand accent that bridges the two worlds. The overall feel is a European enterprise SaaS product — sophisticated but not cold, technical but not intimidating.

The emotional arc of the page flows from **awe** (hero with cosmic purple gradient backdrop) through **credibility** (real product screenshots, customer quotes, team photos) to **trust** (location, enterprise logos, clear CTA).

## Colors

The palette is built on a light–dark duality. Most content sections sit on near-white (`#FEFEFE`) surfaces, while the hero, quote carousel, product showcase, and footer use deep dark backgrounds (`#05060E`, `#201F45`) that showcase the brand purple.

- **Primary Purple `#5D5FEF`:** The signature accent. Used for interactive elements (active tabs, links, badges, outlined buttons), section labels, and — critically — as a radial gradient on highlighted text within section headings. This gradient sweeps from saturated purple through lavender to pale rose (`#DDC9EA`), creating a luminous "glow" on key phrases.
- **Dark Navy `#1B2540`:** All primary text on light backgrounds. Never pure black — the slight blue undertone ties text to the brand.
- **Muted Gray `#7C7C8B`:** Secondary body text, descriptions, and captions. Provides breathing room in the hierarchy without disappearing.
- **Deep Indigo `#201F45`:** Elevated dark surfaces (quote cards, dark section backgrounds). Warmer than the near-black hero to create depth within dark zones.
- **Glass Surfaces:** White at 10–70% opacity with backdrop blur creates frosted-glass effects on dark backgrounds — used for the nav trust badge, newsletter signup card, and email input.

## Typography

Two typefaces create a deliberate contrast between human warmth and technical precision.

**Aspekta** is the primary typeface — a contemporary sans-serif with slightly humanist proportions. It carries the bulk of the content:

- **Display (64px, weight 400):** Hero and footer headings. Tight tracking (`-1.28px`) gives weight without needing bold, creating an editorial magazine quality.
- **Headline (48px, weight 400):** Section headings. Consistent negative tracking (`-0.96px`) compresses the type just enough to feel intentional.
- **Body (22px and 18px, weight 350):** The light weight 350 is the workhorse. It renders long-form descriptions with generous line-heights (1.7) that feel open and breathable.
- **UI text (16px, weight 400/500):** Buttons, nav items, footer links. The 500 weight appears only for footer column headers and newsletter microcopy.

**IBM Plex Mono** is the accent typeface — a Google Fonts monospace (it replaces the original brand's licensed "TG Frekuent Mono") used exclusively for section category labels ("PLATFORM", "PROBLEMS WE SOLVE", "WHY COMPANION ENERGY"), section indices, and data figures. Always uppercase for labels, always 14–16px. Its slightly humanist, engineered character creates a systematic, technical counterpoint to Aspekta's warmth, reinforcing the "data platform" identity.

Key typographic pattern: section headings use Aspekta at 48px with specific words rendered as purple-to-lavender gradient text (`bg-clip-text`) to draw the eye to the value proposition. Every section follows this formula: mono label → gradient-accented heading → light-weight body.

## Layout & Spacing

The layout follows a fixed-width centered model at `1440px` canvas / `1280px` content width with `64px` page padding on each side.

- **Section Rhythm:** Sections are tall and generously padded — `200px` vertical padding is the norm, creating a deliberate, scroll-driven storytelling pace. Each section feels like a full "slide."
- **Content Gaps:** `64px` between section title blocks and content. `32px` between card groups. `16px` for tight stacks (label → heading → body).
- **Card Grid:** Industry and responsibility sections use a mix of full-width hero cards (`1225 × 629px`) and 2-column grids (`586 × 550px` each).
- **Negative Space:** The design is extremely generous with whitespace. Body text blocks rarely exceed 60% of the content width, leaving the right side open for product screenshots or decorative elements.

## Elevation & Depth

Depth is achieved through three layered systems that work together:

- **Purple Ambient Shadows:** Cards and elevated surfaces cast soft, purple-tinted shadows (`rgba(207, 151, 255, 0.16)`) with large blur radii (42px). This colored shadow is the key differentiator — it prevents the clinical feel of gray shadows and ties elevation to the brand.
- **Backdrop Blur Glass:** On dark backgrounds, surfaces use `backdrop-filter: blur(20–50px)` with white at 10–30% opacity. The nav trust badge, newsletter card, and footer contact area all use this treatment.
- **Decorative Blurs:** Large, unfocused purple and warm-orange shapes (`blur(29px)`, `blur(50px)`) sit behind content as atmospheric "light sources." These are purely decorative — they create the cosmic, luminous backdrop without being interactive.
- **Photo Overlays:** Team and location photos use a gradient-to-transparent overlay with `backdrop-blur(50px)` to softly integrate with surrounding content.

## Shapes

The shape language is heavily pill-based, creating a friendly, premium feel:

- **Buttons:** All CTAs use extreme pill radius (`154px` or `200px` — effectively `border-radius: 9999px`). This is non-negotiable — square or mildly rounded buttons would break the design language.
- **Cards:** Large content cards use `24–30px` radius, creating soft containers. Photo cards use `38px` for an even softer, magazine-like feel. The smallest cards and UI elements drop to `12px`.
- **Badges/Tags:** Section label tags and status badges use pill radius with a 1px border in the primary purple.
- **Photos:** All imagery uses rounded corners — `16px` for small thumbnails, `38px` for hero photos. Never sharp-cornered images.

## Components

### Buttons

Two primary button styles: **solid black** for main CTAs ("Get started", "Learn more", "Schedule a call") and **outlined purple** for secondary actions ("Join our team", "Read story"). Both use pill radius and `16px × 24px` padding. On dark backgrounds, ghost buttons with white borders replace the black solid.

### Section Labels

Every content section begins with an uppercase mono label in primary purple (IBM Plex Mono, 16px). This acts as a category marker — "PLATFORM", "PROBLEMS WE SOLVE", "INDUSTRIES". It is always followed by a headline with gradient-accented keywords.

### Cards

Cards never have visible borders on light backgrounds — they rely on subtle background tint (`rgba(36, 34, 32, 0.04)`) and purple ambient shadows for separation. On dark backgrounds, cards use glass-morphism with backdrop blur and semi-transparent white fills.

### Navigation

The top nav uses mono-spaced labels (IBM Plex Mono, 14px, uppercase) with `32px` gaps. A black pill CTA sits at the right. On the hero's dark background, the nav is white text with a glassmorphic trust badge showing a partner logo.

### Newsletter / Contact

The footer CTA area uses a glassmorphic card (`backdrop-blur: 35px`, `rgba(255,255,255,0.2)`) containing a pill-shaped email input and white subscribe button. The card sits over a cosmic purple-gradient background with a forest landscape photo blurred at 50px.
