---
name: Vibrant Eco-Tech
colors:
  surface: "#0d1513"
  surface-dim: "#0d1513"
  surface-bright: "#333b38"
  surface-container-lowest: "#08100e"
  surface-container-low: "#151d1b"
  surface-container: "#19211f"
  surface-container-high: "#232c29"
  surface-container-highest: "#2e3634"
  on-surface: "#dce4e0"
  on-surface-variant: "#b9cbbd"
  inverse-surface: "#dce4e0"
  inverse-on-surface: "#2a3230"
  outline: "#849588"
  outline-variant: "#3b4a40"
  surface-tint: "#00e293"
  primary: "#cdffde"
  on-primary: "#003921"
  primary-container: "#00f5a0"
  on-primary-container: "#006b43"
  inverse-primary: "#006c44"
  secondary: "#96edff"
  on-secondary: "#00363e"
  secondary-container: "#00d7f3"
  on-secondary-container: "#005966"
  tertiary: "#d8ffb8"
  on-tertiary: "#173800"
  tertiary-container: "#79f200"
  on-tertiary-container: "#326a00"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#50ffaf"
  primary-fixed-dim: "#00e293"
  on-primary-fixed: "#002111"
  on-primary-fixed-variant: "#005232"
  secondary-fixed: "#a1efff"
  secondary-fixed-dim: "#05daf6"
  on-secondary-fixed: "#001f25"
  on-secondary-fixed-variant: "#004e5a"
  tertiary-fixed: "#84ff19"
  tertiary-fixed-dim: "#70e000"
  on-tertiary-fixed: "#0b2000"
  on-tertiary-fixed-variant: "#245100"
  background: "#0d1513"
  on-background: "#dce4e0"
  surface-variant: "#2e3634"
typography:
  headline-xl:
    fontFamily: Syne
    fontSize: 64px
    fontWeight: "800"
    lineHeight: "1.1"
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 40px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.2"
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: "700"
    lineHeight: "1.3"
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: "400"
    lineHeight: "1.6"
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.5"
  label-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: "600"
    lineHeight: "1"
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system transitions from a cold, industrial precision into a **Vibrant Eco-Tech** aesthetic. It targets a tech-forward audience that values sustainability and high-performance digital experiences. The visual language blends the logic of technical interfaces with the organic fluidity of nature.

The style leverages **Glassmorphism** and **Dynamic Layering**. It uses semi-transparent surfaces and blurred backdrops to create a sense of breathability and light. High-energy accents contrast against soft, luminous backgrounds, evoking an emotional response of optimism, innovation, and clarity.

## Colors

The palette is rooted in a deep, organic charcoal neutral (`#0A1210`) to provide a high-contrast foundation for vibrant neon-naturals.

- **Primary (Electric Mint):** Used for primary actions, success states, and key brand highlights.
- **Secondary (Glacier Blue):** Used for interactive data visualizations and secondary glass accents.
- **Tertiary (Acid Lime):** Used sparingly for high-attention alerts or unique "eco-tech" signifiers.

**Mesh Gradients:** Backgrounds should utilize subtle, slow-moving mesh gradients blending the Primary and Secondary colors at 5-10% opacity to create depth behind glass panels.

## Typography

The typography system pairs the expressive, ultra-modern **Syne** for headlines with the clean, geometric **Outfit** for functional text.

Headlines should be bold and impactful, often used in tight leading to create a "blocky" tech feel. Body text remains highly legible with generous line height. For labels and small UI elements, use Outfit with increased letter spacing and semi-bold weights to maintain clarity against glass textures.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model based on an 8px base unit.

- **Desktop:** 12-column grid with 24px gutters. Content is housed in "floating" glass containers that should have at least 40px of padding from the viewport edges.
- **Mobile:** 4-column grid with 16px margins.
- **Spacial Philosophy:** Use generous white space (or "empty glass space") to prevent the vibrant colors from becoming overwhelming. Alignment should be strict and mathematical to maintain the "Tech" half of the Eco-Tech persona.

## Elevation & Depth

Depth is communicated through **Glassmorphism** rather than traditional opaque stacking.

- **Surface Level 0:** The dark neutral base with subtle mesh gradients.
- **Surface Level 1 (Panels):** 40% opacity of the neutral color with a 20px Backdrop Blur. A 1px border at 10% white opacity simulates a glass edge.
- **Surface Level 2 (Modals/Popovers):** 60% opacity with a 40px Backdrop Blur and a soft, wide shadow (0px 20px 40px rgba(0,0,0,0.4)).
- **Interactive States:** On hover, glass elements should increase in brightness (opacity) and the border color should shift toward the Primary Mint color.

## Shapes

Shapes are defined by **Rounded** geometry. A base radius of 0.5rem (8px) ensures the UI feels modern and approachable, avoiding the harshness of industrial sharp edges. Large containers and cards should utilize `rounded-xl` (24px) to emphasize the "soft-tech" feel.

## Components

- **Buttons:** Primary buttons use a solid gradient from Primary to Secondary colors with black text for maximum contrast. Secondary buttons are "ghost-glass" styles: transparent with a 1px Primary color border.
- **Chips:** Small, pills-shaped elements with 10% Primary color fills and 100% Primary color text.
- **Input Fields:** Dark, semi-transparent backgrounds (20% opacity) with a bottom-border only that glows into the Primary color upon focus.
- **Cards:** Utilize the Level 1 Glassmorphism specs. Headlines within cards should be Syne Bold.
- **Lists:** Separated by low-opacity (5%) white lines. High-intensity mint dots serve as bullet points for an "active" feel.
- **Progress Bars:** Thin, high-glow lines using the Primary color, featuring a subtle outer glow (drop shadow) to simulate light emission.
