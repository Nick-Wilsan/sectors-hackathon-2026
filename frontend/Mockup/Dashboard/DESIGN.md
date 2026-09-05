---
name: IDX Precision Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bec8d2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#88929b'
  outline-variant: '#3e4850'
  surface-tint: '#89ceff'
  primary: '#89ceff'
  on-primary: '#00344d'
  primary-container: '#0ea5e9'
  on-primary-container: '#003751'
  inverse-primary: '#006591'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff697b'
  on-tertiary-container: '#6c001d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  background-base: '#0a0a0a'
  surface-card: '#171717'
  border-subtle: '#262626'
  text-primary: '#f5f5f5'
  text-secondary: '#a3a3a3'
  text-muted: '#737373'
  accent-hover: '#38bdf8'
  state-positive: '#10b981'
  state-negative: '#f43f5e'
  state-warning: '#f59e0b'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  table-header:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2: 0.125rem
  space-4: 0.25rem
  space-6: 0.375rem
  space-8: 0.5rem
  space-12: 0.75rem
  space-16: 1rem
  space-20: 1.25rem
  space-24: 1.5rem
  space-32: 2rem
  gutter-terminal: 0.5rem
  nav-height: 48px
  ticker-tape-height: 32px
---

## Brand & Style

This design system establishes a high-density, professional, yet radically approachable terminal interface for retail investors analyzing the Indonesia Stock Exchange (IDX). The aesthetic fuses TradingView’s utilitarian cockpit layout with Sectors.app’s legible, educational telemetry. 

The visual language follows **Modern High-Density Dark Minimalism**:
- Pure dark spatial backgrounds paired with low-contrast neutral surfaces.
- Rigorous structural grids that frame real-time data without visual clutter.
- Purposeful chromatic accents reserved strictly for semantic states (market movement, solvency health scores, and critical primary actions).
- Elimination of non-functional decoration, skeuomorphic gloss, or high-glow gradients, ensuring maximum legibility during extended trading sessions.

## Colors

The palette operates in strict dark mode, anchored by deep true neutrals:
- **Base Canvas (`#0a0a0a`)**: Deep void providing high contrast for dense numeric values.
- **Card & Surface Container (`#171717`)**: Structural surfaces grouping charts, order books, and ticker blocks.
- **Subtle Borders (`#262626`)**: Hairline 1px perimeter separations eliminating reliance on drop shadows.
- **Primary Brand (`#0ea5e9` / `#38bdf8`)**: Sky-blue reserved for interactive focus states, primary buttons, active tabs, and navigation anchors.
- **Semantic Financial States**: 
  - Emerald (`#10b981`) is strictly applied to green price ticks, positive delta, and optimal health scores.
  - Rose (`#f43f5e`) is strictly applied to red price drops, negative capital outflow, and high-risk warning flags.
  - Amber (`#f59e0b`) flags neutral/moderate market conditions and secondary alerts.
- **Text Layers**: Primary (`#f5f5f5`) for active readouts, Secondary (`#a3a3a3`) for labels and non-active metrics, Muted (`#737373`) for timestamps and table headers.

## Typography

The type system implements a tri-font hierarchy:
1. **Space Grotesk**: Utilized strictly for brand logos, macro section headers, metric hero numbers, and primary panel titles.
2. **Inter**: Employs standard clean grotesque glyphs for UI copy, tooltips, sector descriptions, modal dialogues, and form interactions.
3. **JetBrains Mono**: Assigned to tabular stock numbers, order book depths, percentages, market cap stats, and ticker symbols (`BBCA`, `BBRI`, `TLKM`).

All financial readouts rendered with JetBrains Mono must enforce `font-variant-numeric: tabular-nums` and default to right alignment in all data tables to preserve scanning integrity.

## Layout & Spacing

The layout is built upon a high-density, multi-panel terminal layout:
- **Top Shell**: Fixed 48px header docked immediately above an infinite-scroll 32px continuous IDX Ticker Tape.
- **Dashboard Workspace**: 12-column dynamic CSS grid with uniform 8px (`0.5rem`) gutters between all docked panels.
- **Screen Architecture**:
  - **Desktop (>= 1280px)**: Left-side modular watchlist (3 columns), center main interactive chart & health score analysis (6 columns), right-side order book & transaction summary (3 columns).
  - **Tablet (768px - 1279px)**: 2-column layout; charts expand full width, with side-by-side tabs for watchlist and order book.
  - **Mobile (< 768px)**: Single column stacked layout. Chart height locks to 320px viewport ratio, while ticker tape, top movers, and depth lists collapse into horizontally swipable chips and segmented tab panels.
- **Internal Padding**: Compact 12px to 16px internal padding within cards to maximize visual payload.

## Elevation & Depth

Visual hierarchy uses **Flat Structural Docking** and **Tonal Layering** instead of drop shadows:
- **Depth Tier 0 (Background Canvas)**: `#0a0a0a`.
- **Depth Tier 1 (Docked Panels & Cards)**: `#171717` with a permanent `1px solid #262626` outline. No elevation shadow is cast.
- **Depth Tier 2 (Dropdowns, Floating Context Menus & Popovers)**: `#1f1f1f` with a `1px solid #333333` border and an ambient `0 12px 32px rgba(0, 0, 0, 0.65)` shadow to isolate focus above dynamic candlestick canvases.
- **Depth Tier 3 (Modals & Command Bar Palette)**: `#171717` centered over a 60% opacity `#000000` backdrop blur (`backdrop-filter: blur(8px)`).

## Shapes

The interface uses a compact, disciplined corner radius:
- Default elements (data cells, input fields, buttons, tab triggers) adhere to `rounded` (4px / `0.25rem`).
- Outer card panels, charting canvas containers, and modal dialogs use `rounded-lg` (8px to 12px max), retaining an instrument-grade workstation look.
- Pill badges (`rounded-full`) are reserved exclusively for market status chips (e.g., "MARKET OPEN", "LQ45") and percentage delta badges.

## Components

### Buttons & Interactive Controls
- **Primary Button**: Background `#0ea5e9`, text `#0a0a0a` (bold), 32px height, 12px horizontal padding. Hover state shifts to `#38bdf8`.
- **Secondary / Ghost Button**: Background transparent, border `1px solid #262626`, text `#f5f5f5`. Hover state fills with `#262626`.
- **Segmented Timeframe Switcher (1D, 1W, 1M, 1Y, ALL)**: Unified `#0a0a0a` segmented track, active item highlighted with background `#262626` and text `#0ea5e9`.

### Ticker Tape & Top Movers
- **Horizontal Continuous Scroller**: Anchored directly under top navigation. Height: 32px, background `#0d0d0d`, border bottom `1px solid #262626`.
- Displays ticker symbol (`JetBrains Mono`, bold, `#f5f5f5`), last traded price, and directional percentage badge (`#10b981` with subtle 10% emerald background for gains; `#f43f5e` with 10% rose background for losses).

### Financial Health Score Gauge (Beginner Friendly)
- 3-tier visual card displaying a simplified 1–10 score alongside "Solvency", "Valuation", and "Growth" health flags.
- Uses progress segments colored `#10b981` (8-10 / Healthy), `#f59e0b` (5-7 / Moderate), and `#f43f5e` (1-4 / Critical), accompanied by short plain-language descriptions in `Inter` 12px.

### Order Book & Data Tables
- Header row: 28px height, uppercase tracking `table-header` in `#737373`.
- Depth Rows: Row height 24px. Monospaced tabular values.
- Depth Bar: Absolute right-aligned horizontal visual bar behind text, rendering bids in `#10b981` at 12% opacity and asks in `#f43f5e` at 12% opacity.

### Input Fields & Search Bars
- Background `#0a0a0a`, border `1px solid #262626`, focus border `1px solid #0ea5e9`.
- Integrated ticker search features monospace prefix badges (e.g., `IDX:`) and clear shortcut hotkeys (`⌘K`).