# MatchDay Copilot — Design System

> World Cup 2026 inspired design tokens extracted from the Tailwind config.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `pitch-700` | `#1a7a2e` | Primary brand green, buttons, active states |
| `gold-500` | `#D4AF37` | Trophy gold, CTAs, highlights, accents |
| `navy-900` | `#070f22` | Page background |
| `navy-800` | `#0d1b3e` | Card backgrounds |
| `navy-700` | `#1e3068` | Input fields, nested surfaces |
| `white` | `#FFFFFF` | Primary text |
| `crowd-normal` | `#22c55e` | Crowd density: normal status |
| `crowd-busy` | `#f59e0b` | Crowd density: busy status |
| `crowd-critical` | `#ef4444` | Crowd density: critical status |

### Gradients

| Name | Value | Usage |
|---|---|---|
| `hero-gradient` | `135deg, #070f22 → #0d1b3e → #14532d` | Page hero sections |
| `gold-gradient` | `135deg, #D4AF37 → #facc15` | Gold text effect |
| `card-gradient` | `135deg, navy 90% → pitch 30%` | Glassmorphism cards |

---

## Typography

| Token | Font | Weight | Usage |
|---|---|---|---|
| `font-headline` | Anton | Regular (400) | Page titles, stat numbers |
| `font-display` | Oswald | 400-700 | Section headers, card titles |
| `font-body` | Inter | 400-700 | Body text, labels, inputs |

### Scale

| Class | Size | Usage |
|---|---|---|
| `text-8xl` + `font-headline` | 6rem | Hero page title |
| `text-5xl` + `font-headline` | 3rem | Section headlines |
| `text-xl` + `font-display` | 1.25rem | Card titles, tab labels |
| `text-sm` | 0.875rem | Body text, descriptions |
| `text-xs` | 0.75rem | Labels, badges, timestamps |

---

## Spacing & Layout

- **Container**: `max-w-7xl mx-auto px-4` — 1280px max width
- **Card padding**: `p-4` (16px) for small cards, `p-6` (24px) for large cards
- **Section gap**: `gap-6` (24px) between cards in grids
- **Border radius**: `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for large cards, `rounded-full` for badges/pills

---

## Component Tokens

### Glassmorphism Card
```css
.glass-card {
  background: rgba(13, 27, 62, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Gold CTA Button
```css
.btn-gold {
  background: linear-gradient(135deg, #D4AF37, #facc15);
  color: #0d1b3e;
  font-weight: 700;
  border-radius: 0.75rem;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}
```

### Status Badges
| Status | Background | Border | Text |
|---|---|---|---|
| normal | pitch-900/30 | pitch-600/30 | pitch-300 |
| busy | amber-900/30 | amber-600/30 | amber-300 |
| critical | red-900/30 | red-600/30 | red-300 |

### Chat Bubbles
- **User**: `bg-pitch-700/80`, rounded-br-sm
- **Assistant**: `bg-navy-700/80`, border `gold-500/20`, rounded-bl-sm

---

## Iconography

All icons from **Lucide React** (`lucide-react` npm package, MIT license):
- Navigation: `Users`, `LayoutDashboard`, `Radio`, `Settings`
- Chat: `Bot`, `User`, `Send`, `Loader2`
- Map: `MapPin`
- Accessibility: `Wheelchair`, `Baby`, `Accessibility`
- Dashboard: `TrendingUp`, `TrendingDown`, `AlertTriangle`, `CheckCircle`
- Organizer: `Leaf`, `Search`, `Globe`

---

## Animations

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `animate-slide-up` | 0.3s | ease-out | New chat messages, panels opening |
| `animate-fade-in` | 0.4s | ease-out | Page content load |
| `animate-pulse-slow` | 3s | ease-in-out | Crowd density dot indicators |
| `animate-spin` | 1s | linear | Loading spinners |
| `animate-shimmer` | 2s | linear | Skeleton loading states |

---

## Accessibility

- **Focus ring**: `outline: 3px solid #D4AF37; outline-offset: 2px` (gold, high contrast)
- **High contrast mode**: `filter: contrast(1.4)` applied to `<html>` via `.high-contrast` class
- **Large text mode**: Font sizes increased 12.5% across the board via `.large-text` class
- **Color contrast**: All text/background combinations meet WCAG AA (≥4.5:1 for body, ≥3:1 for large text)
- **Motion**: All animations respect `prefers-reduced-motion` or the user's manual toggle

---

## Dark Mode

The app is dark-mode only (deep navy background). No light mode is implemented in v1 — the stadium at night and broadcast graphic aesthetic is intentionally dark. The high-contrast toggle provides an alternative for accessibility needs.
