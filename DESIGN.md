# MatchDay Copilot Design Tokens

This file documents the extracted design tokens as requested by the Hackathon prompt. These tokens represent the core visual identity inspired by the FIFA World Cup 2026, creating a polished, tournament-grade UI without using official, copyrighted IP.

## Color Palette

The color system is built around a pitch green core, highlighted with gold accents and grounded by deep navy/black for high contrast and modern aesthetics.

*   **Primary Green (Pitch):** `#059669` (Tailwind `emerald-600`) - Represents the football pitch. Used for primary actions, success states, and brand highlights.
*   **Secondary Green (Dark Pitch):** `#065f46` (Tailwind `emerald-800`) - Used for hover states and deeper stadium accents.
*   **Gold (Trophy Accent):** `#fbbf24` (Tailwind `amber-400`) - Represents victory and the tournament trophy. Used for warnings, highlighted stats, and premium UI elements.
*   **Deep Navy (Background):** `#0f172a` (Tailwind `slate-900`) - The core background color, providing a sleek dark-mode stadium atmosphere.
*   **Surface (Card Background):** `#1e293b` (Tailwind `slate-800`) - Used for elevated surfaces like dashboard cards, chat bubbles, and modals.
*   **Surface Bright:** `#334155` (Tailwind `slate-700`) - Used for borders and subtle highlights on elevated surfaces.
*   **Text (Primary):** `#f8fafc` (Tailwind `slate-50`) - High-contrast white for ultimate readability.
*   **Text (Muted):** `#94a3b8` (Tailwind `slate-400`) - Used for secondary text, timestamps, and subtitles.

## Typography

To evoke a World Cup broadcast and scoreboard feel while maintaining readability, we use a pairing of a condensed display font and a highly legible sans-serif body font.

*   **Headings / Display (Scoreboard Style):** `'Anton', sans-serif`
    *   *Usage:* Dashboard metrics, major section headers, live match stats.
    *   *Characteristics:* Bold, condensed, impactful.
*   **Body / UI:** `'Inter', sans-serif`
    *   *Usage:* Chat messages, standard UI text, form inputs, tooltips.
    *   *Characteristics:* Clean, neutral, excellent legibility on all devices.

## Spacing & Geometry

The UI leans into clean geometric shapes with subtle rounding to balance modern app design with the sharp lines of a football pitch.

*   **Border Radius:** `0.5rem` (`rounded-lg`) for standard cards; `1rem` (`rounded-2xl`) for chat bubbles.
*   **Padding / Margins:** Utilizes a standard 4-point grid (e.g., `p-4`, `p-6`) for consistent spacing.
*   **Shadows:** Soft, deep shadows (`shadow-lg`, `shadow-emerald-900/20`) to create depth against the dark background.

## UI Motifs & Iconography

*   **Icons:** Lucide React (open-source) is used for all iconography, avoiding copyrighted team crests or logos.
*   **Indicators:** Live pulsing animations on status indicators (e.g., crowd density heatmaps) to convey a "real-time" stadium environment.
*   **Accessibility:** High contrast ratios are strictly maintained, meeting WCAG AA standards natively through the dark mode palette.
