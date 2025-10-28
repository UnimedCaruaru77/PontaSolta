# Design Guidelines: Ponta Solta - Cyberpunk Task Manager

## Design Approach
**Cyberpunk-Futuristic Interface** inspired by Blade Runner aesthetics and high-tech interfaces (Cyberpunk 2077, Tron). The design embraces maximalist neon styling with technological sophistication.

## Typography System
**Primary Font**: "Rajdhani" (Google Fonts) - Bold, geometric tech aesthetic
**Secondary Font**: "Orbitron" (Google Fonts) - Headers and emphasis
**Monospace**: "Share Tech Mono" - Task IDs, timestamps, metadata

**Hierarchy**:
- H1: Orbitron, 3xl-4xl, uppercase, heavy glow effect
- H2: Rajdhani, 2xl-3xl, semi-bold, medium glow
- H3: Rajdhani, xl-2xl, medium weight
- Body: Rajdhani, base-lg, regular weight
- Labels/Meta: Share Tech Mono, sm-base, light glow on hover

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
**Grid System**: 12-column responsive grid
**Container Max-Width**: 1920px (full-width dashboard experience)
**Section Padding**: px-4 md:px-8 lg:px-12, py-6 md:py-8

## Core Component Library

### Navigation
**Top Bar** (fixed, full-width):
- Logo "PONTA SOLTA" with animated scan-line effect (left)
- Search bar with neon border glow (center-left, w-96)
- Quick actions: notifications bell, user avatar with status indicator (right)
- Height: h-16, backdrop blur with 15% opacity overlay
- Bottom border: 1px neon blue with subtle glow

**Sidebar** (fixed left, collapsible):
- Width: w-64 (expanded), w-16 (collapsed)
- Sections: Dashboard, Kanban, Archive, Settings
- Icons: lucide-react with 2px neon stroke
- Active state: full-width neon border-left (3px), background glow
- Hover: border-left accent with transition

### Dashboard Layout

**Stats Grid** (4-column desktop, 2-column tablet, 1-column mobile):
- Card structure: glassmorphism background (10% white opacity)
- Border: 1px neon with corner accent lines (16px length)
- Padding: p-6
- Content: Icon (top-left, size-8), Metric (large, glowing), Label (small caps), Trend indicator (animated arrow)
- Hover: border intensifies, subtle scale(1.02) transform

**Activity Feed** (2-column layout with sidebar):
- Main: Recent tasks timeline with vertical neon connector line
- Sidebar: Priority alerts, upcoming deadlines
- Timeline nodes: pulsating dots with expanding rings on new items

### Kanban Board

**Column Structure**:
- Headers: uppercase, borderBottom 2px neon, gradient fade effect
- Min-width: 320px per column
- Gap between columns: gap-6
- Scrollable horizontal container with custom neon scrollbar

**Task Cards**:
- Base: glassmorphism with 8% opacity
- Border: 1px neon with animated corner brackets on hover
- Padding: p-4
- Structure: 
  - Top: Tag chips (rounded-full, neon borders, px-3 py-1, text-xs)
  - Title: font-semibold, text-base
  - Description: text-sm, opacity-80, line-clamp-2
  - Bottom row: assignee avatar, due date (monospace), priority indicator
- Drag state: scale(1.05), enhanced glow, trailing neon particles effect
- Critical tasks: border-2 with continuous pulse animation, red accent

**Priority Indicators**:
- Dots system (size-2): Critical (3 dots), High (2 dots), Normal (1 dot)
- Positioned absolute top-right with stagger animation on load

### Modals

**Task Creation/Edit Modal**:
- Overlay: backdrop-blur with 40% black opacity
- Modal: max-w-2xl, centered, glassmorphism background
- Border: 2px neon with corner accent decorations
- Header: 
  - Title with scan-line animation background
  - Close button (lucide-react X) with neon ring hover
  - Height: h-16, border-bottom
- Form Fields:
  - Input borders: 1px neon, focus state intensifies with glow
  - Labels: uppercase, text-xs, letter-spacing wide
  - Textarea: min-h-32 for descriptions
  - Dropdowns: custom neon caret, glassmorphism options panel
  - Date picker: tech-styled calendar with neon highlights
- Footer: 
  - Cancel (ghost button with neon border)
  - Save (filled neon gradient, text-shadow glow)
  - Spacing: gap-4, justify-end

### Buttons
**Primary**: Full neon fill, uppercase, letter-spacing-wide, px-6 py-3, shadow-neon-lg
**Secondary**: Neon border only, transparent fill, hover fills with 20% opacity
**Icon Buttons**: size-10, rounded-lg, border-neon, centered icon
**Floating Action**: fixed bottom-right, size-14, rounded-full, pulsating glow with "+" icon

### Data Visualization
**Progress Bars**: 
- Track: h-2, rounded-full, dark with subtle inner glow
- Fill: neon gradient, animated shimmer effect
- Labels: positioned above, monospace font

**Charts** (for dashboard):
- Line charts with neon stroke, gradient fill below
- Grid lines: dashed neon at 20% opacity
- Data points: glowing nodes on hover
- Tooltips: glassmorphism cards with neon pointer

## Interaction Patterns

**Hover Effects**:
- Cards: border glow intensifies, slight elevation (shadow-neon-xl)
- Buttons: text-shadow increases, background pulse
- Icons: rotate(5deg) with glow expansion

**Loading States**:
- Skeleton: pulsating neon lines moving across placeholder
- Spinners: rotating hexagonal border with trail effect

**Notifications/Toasts**:
- Slide from top-right
- Glassmorphism with colored left border (success: green, error: red, info: blue)
- Auto-dismiss with neon progress bar
- Icon + message + close button layout

## Accessibility Implementation
- Focus states: double neon ring with 4px offset
- Keyboard navigation: visible focus indicators throughout
- ARIA labels on all interactive elements
- Color contrast maintained with glow effects for readability
- Screen reader friendly task status announcements

## Images
**Not Required** - This cyberpunk interface relies on geometric shapes, neon effects, and procedural graphics rather than photographic imagery. The visual impact comes from glowing UI elements and technological aesthetics.

## Responsive Behavior
- Desktop (1920px+): Full multi-column dashboard, expanded sidebar
- Laptop (1280-1920px): Condensed columns, maintained glassmorphism
- Tablet (768-1280px): Kanban scrolls horizontally, stats grid 2-column
- Mobile (<768px): Collapsed sidebar (hamburger), single column kanban, bottom navigation bar with neon indicators

**Critical**: Maintain neon glow effects across all breakpoints - reduce intensity on mobile for performance, never remove entirely.