---
name: Echoes of Dawn
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#4f4539'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#817567'
  outline-variant: '#d2c4b4'
  surface-tint: '#7b5819'
  primary: '#7b5819'
  on-primary: '#ffffff'
  primary-container: '#e8b971'
  on-primary-container: '#694808'
  inverse-primary: '#eebf76'
  secondary: '#436560'
  on-secondary: '#ffffff'
  secondary-container: '#c3e7e0'
  on-secondary-container: '#476964'
  tertiary: '#52625f'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3c4c0'
  on-tertiary-container: '#42524f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddaf'
  primary-fixed-dim: '#eebf76'
  on-primary-fixed: '#281800'
  on-primary-fixed-variant: '#614001'
  secondary-fixed: '#c6eae3'
  secondary-fixed-dim: '#aacec7'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#2b4d48'
  tertiary-fixed: '#d5e6e2'
  tertiary-fixed-dim: '#b9cac6'
  on-tertiary-fixed: '#0f1e1c'
  on-tertiary-fixed-variant: '#3a4a47'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Noto Sans SC
    fontSize: 40px
    fontWeight: '300'
    lineHeight: 56px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: Noto Sans SC
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Noto Sans SC
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.02em
  body-md:
    fontFamily: Noto Sans SC
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 24px
  margin-desktop: 64px
  section-gap: 48px
---

## Brand & Style

The design system is centered on the concept of "Poetic Preservation." It is designed for individuals navigating the delicate journey of grief, providing a digital sanctuary that feels ritualistic, quiet, and profoundly supportive. The brand personality is empathetic and professional, acting as a gentle companion rather than a cold tool.

The visual style is a **Modern Minimalist** evolution of the crystalline sphere. We move away from 3D gloss toward a sophisticated, flat 2D aesthetic that uses layering and transparency to imply depth. The core symbol is a "Memory Wisp"—a geometric, stylized petal contained within a perfect circle, representing the containment and protection of precious memories. The interface prioritizes "breathing room," using generous whitespace to reduce cognitive load for users in distress.

## Colors

The palette is inspired by the transition of dawn—the moment where memory meets the morning light.

- **Dawn Gold (#E8B971):** A warm, soft amber used for primary actions, signifying warmth and the "spark" of a memory.
- **Tea-Cyan (#8BAEA8):** A peaceful, muted teal used for secondary highlights and supportive elements, evoking tranquility.
- **Surface & Neutrals:** The UI uses "Warm Linen" neutrals (#F9F8F6) instead of pure white to avoid clinical coldness. 
- **Functional Grays:** Text is rendered in a deep charcoal-teal (#323635) to maintain high legibility while remaining softer than pure black.

## Typography

The typography system relies on **Noto Sans SC** to ensure a premium, modern Chinese typeface that integrates seamlessly with the WeChat ecosystem while feeling bespoke. 

A "breathy" quality is achieved through increased **line-height** (1.75x for body text) and **letter-spacing** (tracking). Display text should use Light (300) weights to emphasize elegance. English labels and metadata use **Inter** to provide a subtle, technical balance to the more poetic Chinese characters. All headings should be centered for "ritualistic" layouts (e.g., memory entries) and left-aligned for functional "chat" interfaces.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model with an emphasis on vertical rhythm. 

- **Mobile:** A 4-column grid with 24px side margins. This wide margin creates a "letterbox" feel that focuses the user's eye on the central content, essential for reflective reading.
- **Desktop/Tablet:** A centered 12-column fixed-width container (max 1024px) to prevent lines of text from becoming too long, which can be exhausting for users in a sensitive emotional state.
- **Spacing Rhythm:** All spacing is based on a 4px baseline, but "Section Gaps" should be generous (48px+) to signify transitions between different thoughts or memories.

## Elevation & Depth

To maintain the "Flat and Poetic" aesthetic, traditional heavy shadows are forbidden. Instead, depth is conveyed through:

1.  **Tonal Layering:** The primary background is the "Warm Linen" neutral. Content cards use a pure "Paper White" with a 1px soft-gray stroke (#E5E2DE).
2.  **Translucency:** Header bars and navigation elements use a background blur (Backdrop Filter) with 90% opacity, allowing colors from the content to subtly bleed through, mimicking the crystalline nature of the original symbol.
3.  **Low-Contrast Outlines:** Instead of shadows, use "Ghost Borders"—0.5pt lines in a slightly darker shade than the surface they sit on.

## Shapes

The shape language is "Organic Geometric." 

We utilize a **Rounded (level 2)** approach. Standard UI elements like buttons and input fields have a 0.5rem (8px) radius. However, the "Memory Wisp" container is always a perfect circle (pill-shaped). Larger cards and containers use 1rem (16px) to feel soft and non-threatening. Sharp corners are avoided entirely to maintain the "healing" visual metaphor.

## Components

- **Buttons:** Primary buttons use the Dawn Gold fill with white text. Secondary buttons are "Tea-Cyan" ghost buttons with a 1px stroke. All buttons feature high horizontal padding (24px+) to create a spacious, premium feel.
- **Memory Chips:** Small, circular-ended labels used for tagging memories (e.g., "Peaceful," "Shared"). They use low-saturation versions of the primary colors.
- **Input Fields:** Bottom-border only for a "writing on a page" feel, or fully enclosed with 8px rounding and a warm-gray background (#F0EEEB).
- **The "Wisp" Progress Indicator:** Instead of a standard loading bar, a stylized 2D petal rotates slowly within a circle, utilizing a soft pulse animation.
- **Cards:** Cards never have shadows. They are defined by a 1px "Linen" border and use internal padding of at least 24px to ensure text never feels cramped.
- **AI Chat Bubbles:** The AI's messages use a soft Tea-Cyan tint, while the user's messages are a neutral warm gray, distinguishing the "caregiver" from the "user" through color temperature.