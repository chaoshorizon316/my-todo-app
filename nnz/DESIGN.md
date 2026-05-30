# 念念在 — Design System

## Brand Identity

- **Product**: 念念在 (Memory Realm · Time Messenger)
- **Mission**: 让爱有处安放，让告别有期
- **Brand Personality**: 温暖、克制、有仪式感、值得信赖
- **Tone**: Healing (疗愈), Boundary-respecting (有边界), Hopeful (有希望)

## Color Palette

| Role | Name | Hex | Tailwind |
|:---|:---|:---|:---|
| Page Background | Cream | `#FDF8F0` | `bg-cream` |
| Primary Text | Warm 900 | `#3D2C1E` | `text-warm-900` |
| Secondary Text | Warm 500-600 | `#A06835` / `#C8843C` | `text-warm-500/600` |
| Primary Accent | Warm 600 | `#C8843C` | `bg-warm-600` |
| Primary Hover | Warm 700 | `#A06835` | `hover:bg-warm-700` |
| Secondary Accent | Sage 400-500 | `#7A9A7E` / `#5C7D60` | `text-sage-500` |
| Surface Cards | White/70 | `rgba(255,255,255,0.7)` | `bg-white/70` |
| Card Border | Warm 200/50 | `#F9E4C8` at 50% | `border-warm-200/50` |
| Footer Background | Warm 900 | `#3D2C1E` | `bg-warm-900` |

### Palette Rationale
- **Warm Gold/Amber** — Memory, light, warmth of connection. Not funeral-black; life-affirming.
- **Sage Green** — Healing, growth, hope. Used for ethics/safety messaging.
- **Cream background** — Soft, gentle, never stark white. Creates breathing room.

## Typography

| Role | Font | Weight | Size |
|:---|:---|:---|:---|
| Hero Heading | Noto Serif SC | 600 | 3rem / 3.75rem (md) |
| Section Headings | Noto Serif SC | 600 | 1.875rem / 2.25rem (md) |
| Card Headings | Noto Serif SC | 600 | 1.125rem / 1.25rem |
| Body Text | Noto Sans SC | 400 | 1rem / 1.125rem (lg) |
| Small/Label | Noto Sans SC | 500 | 0.75rem |

**Principle**: Serif for emotional headings (humanity, warmth), Sans-serif for functional text (clarity, trust).

## Geometry

| Element | Border Radius | Notes |
|:---|:---|:---|
| Buttons (CTA) | `rounded-full` | Pill-shaped, inviting |
| Cards | `rounded-2xl` (16px) | Softly rounded, approachable |
| Small badges | `rounded-full` | Consistent pill language |
| Step circles | `rounded-full` | Full circle for numbered steps |
| Testimonial | `rounded-3xl` (24px) | Extra soft for emotional content |

## Depth & Elevation

- **Flat design baseline** — focus on color blocking and generous whitespace
- **Cards**: `bg-white/70` with subtle warm-border. Hover: translateY(-4px), soft shadow.
- **Featured pricing card**: Enhanced shadow + warm border to draw attention.
- **Footer**: Deep warm background, no elevation needed.

## Spacing

- Section vertical padding: `py-24` / `py-32` (md+)
- Max content width: `max-w-4xl` / `max-w-6xl`
- Card internal padding: `p-8` / `p-10` (md+)
- Grid gaps: `gap-6` / `gap-8`

## Atmosphere Keywords
- Minimalist, clean, generous whitespace
- Warm, inviting, human-scale
- Trustworthy, sophisticated, restrained
- Healing, hopeful, ritualistic
