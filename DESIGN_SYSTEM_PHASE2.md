# Denft Design System — Phase 2

**Date:** July 5, 2026  
**Status:** Design System Specification  
**Purpose:** Govern all UI/UX improvements in Sprints 0–8

---

## Table of Contents

1. [Visual Identity Direction](#21--visual-identity-direction)
2. [Component Library Decision](#22--component-library-decision)
3. [Layout System](#23--layout-system)
4. [Core UI Component Specifications](#24--core-ui-component-specifications)

---

## 2.1 — Visual Identity Direction

### Brand Strategy

**Denft** is a decentralized cloud storage platform for Web3-native users and mainstream audiences transitioning into Web3. The visual identity must communicate:

- **Trust & Security** — Users are storing their important files. The interface must feel solid, credible, and permanent.
- **Modernity** — It is a 2026 Web3 product, not a 2015 enterprise SaaS tool. Design should feel contemporary, intelligent, and approachable.
- **Clarity** — File storage is a utility. The interface must be fast to scan, unambiguous, and devoid of noise.
- **Approachability** — Social-login users need to feel at home; developers need advanced options without clutter.

### Colour Palette

#### Primary Palette (7-colour system)

| Token | Hex | RGB | Usage | Notes |
|-------|-----|-----|-------|-------|
| **Primary-50** | `#F0F6FF` | rgb(240, 246, 255) | Lightest backgrounds, hover states (light mode) | Faint tint |
| **Primary-500** | `#3B82F6` | rgb(59, 130, 246) | Primary CTA buttons, links, focus rings | Solana-inspired blue; not generic Tailwind |
| **Primary-600** | `#2563EB` | rgb(37, 99, 235) | Hover state on primary buttons | Darker shade for interaction |
| **Primary-900** | `#1E3A8A` | rgb(30, 58, 138) | Dark mode backgrounds, deep containers | Trust-building dark tone |
| **Accent-500** | `#8B5CF6` | rgb(139, 92, 246) | Secondary CTAs, highlights, accents | Purple; Web3-appropriate, distinct from primary |
| **Success-500** | `#10B981` | rgb(16, 185, 129) | Confirmations, verified badges, positive feedback | Emerald green; warm and inviting |
| **Error-500** | `#EF4444` | rgb(239, 68, 68) | Destructive actions, warnings, errors | Clear red; not confusing with orange |
| **Warning-500** | `#F59E0B` | rgb(245, 158, 11) | Cautions, unverified badges, information | Amber; distinct from error |
| **Neutral-50** | `#F8FAFC` | rgb(248, 250, 252) | Light mode backgrounds, cards | Slate-50 from Tailwind |
| **Neutral-100** | `#F1F5F9` | rgb(241, 245, 249) | Light mode secondary backgrounds | Slate-100 |
| **Neutral-200** | `#E2E8F0` | rgb(226, 232, 240) | Light mode borders | Slate-200 |
| **Neutral-400** | `#CBD5E1` | rgb(203, 213, 225) | Light mode dividers | Slate-400 |
| **Neutral-600** | `#475569` | rgb(71, 85, 105) | Light mode secondary text | Slate-600; **passes WCAG AA** on light bg |
| **Neutral-700** | `#334155` | rgb(51, 65, 85) | Light mode primary text | Slate-700; **passes WCAG AA** on light bg |
| **Neutral-800** | `#1E293B` | rgb(30, 41, 59) | Dark mode text | Slate-800; **passes WCAG AA** on dark bg |
| **Neutral-900** | `#0F172A` | rgb(15, 23, 42) | Dark mode deep backgrounds | Slate-900; existing token |

#### Colour Palette Rules

**Light Mode (default):**
- Background: `Neutral-50`
- Primary text: `Neutral-700`
- Secondary text: `Neutral-600` (WCAG AA ✓)
- Tertiary text: `Neutral-500` (bump from current `Neutral-400` for contrast)
- Borders: `Neutral-200`
- Action buttons: `Primary-500`
- Secondary buttons: `Neutral-200` (outline)
- Ghost buttons: transparent background, `Primary-500` text

**Dark Mode:**
- Background: `Neutral-900` (or `Primary-900` for branded depth)
- Primary text: `Neutral-50`
- Secondary text: `Neutral-400` (WCAG AA ✓)
- Tertiary text: `Neutral-500`
- Borders: `Neutral-700`
- Action buttons: `Primary-500` (same)
- Secondary buttons: `Neutral-800` (outline)
- Ghost buttons: transparent background, `Primary-400` text

**Gradient Rule (for hero sections, cards):**
- Primary-to-Accent: `from-primary-500 to-accent-500` (blue to purple; modern, not overdone)
- Dark gradient: `from-primary-900 via-neutral-800 to-accent-900`

### Typography System

#### Font Families

| Layer | Font | Usage | Weights | Notes |
|-------|------|-------|---------|-------|
| **Display/Heading** | Inter, Google Fonts | Page titles, hero headings, card titles | 700, 800 | Clean, modern, sans-serif; already imported |
| **Body/UI** | Inter, Google Fonts | Paragraphs, buttons, form inputs | 400, 500, 600 | Same family for consistency |
| **Monospace** | JetBrains Mono (add) | File hashes, CIDs, transaction IDs, code snippets | 400, 600 | Monospace for crypto data; not system font |

#### Type Scale

```
Display:     text-5xl (48px) / 56px line height / weight 800
Heading 1:   text-4xl (36px) / 44px line height / weight 700
Heading 2:   text-3xl (30px) / 36px line height / weight 700
Heading 3:   text-2xl (24px) / 32px line height / weight 600
Heading 4:   text-xl (20px) / 28px line height / weight 600
Body Large:  text-lg (18px) / 28px line height / weight 400
Body:        text-base (16px) / 24px line height / weight 400
Body Small:  text-sm (14px) / 20px line height / weight 400
Caption:     text-xs (12px) / 16px line height / weight 500
Label:       text-xs (12px) / 14px line height / weight 600
Monospace:   text-sm (14px) / 20px line height / weight 400
```

**Rules:**
- Never use `text-xs` for body copy (too small)
- Links are `Body` + `underline` + `text-primary-500`
- Disabled text: `text-neutral-400` (light) / `text-neutral-600` (dark)

### Spacing Scale

```
Base unit: 4px

Spacing tokens:
  xs:   4px   (0.25rem)
  sm:   8px   (0.5rem)
  md:   12px  (0.75rem)  [Tailwind: not default, use gap-3]
  base: 16px  (1rem)     [Tailwind: gap-4]
  lg:   24px  (1.5rem)   [Tailwind: gap-6]
  xl:   32px  (2rem)     [Tailwind: gap-8]
  2xl:  48px  (3rem)     [Tailwind: gap-12]
  3xl:  64px  (4rem)     [Tailwind: gap-16]
```

**Usage:**
- Padding inside cards: `p-lg` (24px)
- Margin between sections: `my-2xl` (48px)
- Gap in grid layouts: `gap-lg` (24px)
- Button internal padding: `px-lg py-base` (24px horizontal, 16px vertical)

### Border Radius

```
None:        border-0
Small:       rounded-sm (2px)    — Text inputs, small buttons
Medium:      rounded-md (6px)    — Cards, larger buttons
Large:       rounded-lg (8px)    — Modals, prominent cards
Extra Large: rounded-xl (12px)   — Hero sections, featured cards
Pill:        rounded-full        — Badge pills, avatar borders
```

**Usage:**
- Form inputs: `rounded-sm`
- Buttons: `rounded-md`
- Card containers: `rounded-lg`
- Featured sections: `rounded-xl`
- Badges: `rounded-full` (pill shape)

### Shadow System

```
xs:        box-shadow: 0 1px 2px rgba(0,0,0,0.05)
sm:        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
md:        box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)
lg:        box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
xl:        box-shadow: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)
2xl:       box-shadow: 0 25px 50px rgba(0,0,0,0.25)
elevated:  box-shadow: 0 5px 20px rgba(59,130,246,0.15)    [Blue-tinted for primary cards]
```

**Usage:**
- Cards: `shadow-sm`
- Hover on card: `shadow-md`
- Modals: `shadow-xl`
- Floating actions: `shadow-lg`
- Elevated cards (primary): `shadow-elevated`

### Motion System

**Durations (for consistency):**
```
xs:   100ms    — Micro-interactions (button press feedback)
sm:   150ms    — Component state changes (color, opacity)
base: 250ms    — Modal/drawer open/close, tab switches
lg:   350ms    — Page transitions, full-screen animations
slow: 500ms    — Intro animations, high-attention items
```

**Easing (prefer spring over cubic-bezier):**
```
Default:   cubic-bezier(0.4, 0.0, 0.2, 1)   — Material Design standard
In/Out:    cubic-bezier(0.25, 0.46, 0.45, 0.94)  — Faster start
Bounce:    cubic-bezier(0.68, -0.55, 0.265, 1.55)  — Playful, iOS-like
```

**Examples:**
- Button press: `scale-95` on active, 100ms duration
- Toast entry: `slideIn` from right, 250ms
- Modal open: `scaleIn` + `fadeIn`, 250ms with ease-out
- Page transition: `fadeIn`, 150ms

**Accessibility:** All animations must respond to `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important; }
}
```

---

## 2.2 — Component Library Decision

### Option A: Build on Raw Tailwind

**Pros:**
- Full visual control
- Smaller bundle
- No dependency surprises

**Cons:**
- Accessibility bugs if not careful (no focus trap, no ARIA attributes)
- Form states (invalid, disabled) need manual styling
- Keyboard navigation not guaranteed
- Time-consuming; high maintenance

### Option B: Headless UI Library (Radix UI / Ark UI)

**Pros:**
- Best-in-class accessibility
- Focus trap, ARIA attributes built-in
- Unstyled by default (complete control)

**Cons:**
- Requires styling every component
- Learning curve (Radix API is detailed)
- More boilerplate

### Option C: **Adopt shadcn/ui** ✅ **RECOMMENDED**

**Why shadcn/ui?**

shadcn/ui is a collection of copy-paste Radix UI components pre-styled with Tailwind CSS. It is **not an npm dependency** — components live in your codebase. This means:

✅ **Best accessibility** — Built on Radix UI primitives; focus management, ARIA attributes, keyboard navigation all included.  
✅ **Full customization** — Styled with Tailwind; modify any component to match your brand.  
✅ **No lock-in** — Components are source files; fork/modify as needed.  
✅ **Tree-shakeable** — Only components you use are included.  
✅ **Active ecosystem** — 50+ pre-built components (Button, Card, Modal, Input, Dropdown, Tooltip, etc.).  
✅ **Tailwind-native** — Integrates seamlessly with Tailwind config.

**Adoption Plan:**

1. Install shadcn/ui CLI: `npx shadcn-ui@latest init`
2. Customize Tailwind theme (colours, fonts, spacing)
3. Install required components one by one:
   - `npx shadcn-ui@latest add button`
   - `npx shadcn-ui@latest add input`
   - `npx shadcn-ui@latest add card`
   - etc.
4. Components appear in `/components/ui/` (copy-paste model)
5. Optionally: remove HeroUI dependency after migration

### Component Library Migration Path

**Immediate (Sprint 0):**
- Install shadcn/ui CLI
- Initialize with custom Tailwind config
- Install: Button, Input, Card, Modal, Dialog, Tooltip, DropdownMenu, Badge, Select
- Create custom wrapper components (Form, FileCard, etc.)

**Phased (Sprints 1–8):**
- Replace HeroUI `<Button>` with shadcn `<Button>`
- Replace HeroUI `<Card>` with shadcn `<Card>`
- Replace HeroUI `<Input>` with shadcn `<Input>`
- Phase out HeroUI dependency gradually

**Keep using shadcn/ui for:**
- Navigation components (Link styling)
- Form components (Input, Select, Checkbox, RadioGroup)
- Overlay components (Dialog, Popover, Tooltip, Dropdown)
- Data display (Table, Tabs, Pagination)
- Layout (Separator, AspectRatio)

---

## 2.3 — Layout System

### Responsive Breakpoints

```
Mobile:     320px – 639px (no prefix or 'xs')
Tablet:     640px – 1023px ('md' in Tailwind)
Desktop:    1024px – 1439px ('lg' in Tailwind)
Wide:       1440px+ ('xl' or '2xl' in Tailwind)
```

### Page Layout Template

```
┌─────────────────────────────────────────────┐
│  Navbar (sticky, z-50)                      │
│  [Logo] [Nav Links] [Wallet/Theme Toggle]   │
├─────────────────────────────────────────────┤
│                                             │
│  Main Content Area (max-width: 1280px)     │
│  Padding: 32px (lg) / 16px (md) / 16px (xs)│
│                                             │
│  [Routes render here]                       │
│                                             │
├─────────────────────────────────────────────┤
│  Footer (sticky bottom, z-0)                │
└─────────────────────────────────────────────┘
```

### Navbar Layout

**Desktop (≥1024px):**
```
[Logo] [Dashboard] [Vault] [Explore] | [Theme] [Wallet]
```

**Tablet (640px–1023px):**
```
[Logo] [Wallet] [Menu ☰]
        [Nav drawer opens on click]
```

**Mobile (320px–639px):**
```
[Logo] [☰]
 [Wallet in drawer when menu opens]
```

**Navbar Height:** 64px (includes padding)

### Sidebar (Optional for Dashboard)

**Desktop:**
- Fixed left sidebar, 240px wide
- Content area: `calc(100% - 240px)`
- Links: Dashboard, My Vault, Public Files, Settings

**Tablet/Mobile:**
- Collapse sidebar into hamburger menu or bottom nav tabs

### Main Content Max-Width

- Desktop: `max-w-7xl` (1280px)
- Padding horizontal: `px-6` (24px) on lg+, `px-4` (16px) on md, `px-3` (12px) on sm
- Result: readable content width (optimal ~80 characters for text)

### Grid System for File Vault

**Desktop (≥1024px):**
- 4-column grid: `grid-cols-4 gap-6`
- File card dimensions: 260px × 260px

**Tablet (640px–1023px):**
- 2-column grid: `grid-cols-2 gap-4`
- File card dimensions: 160px × 160px

**Mobile (320px–639px):**
- 1-column grid: `grid-cols-1 gap-3`
- File card full width with padding

### Spacing Consistency

**Page Sections:**
- Top padding: `pt-2xl` (48px) or `pt-3xl` (64px)
- Between sections: `gap-3xl` (64px) on desktop, `gap-2xl` (48px) on mobile
- Card internal padding: `p-lg` (24px)

**Forms:**
- Input width: `w-full` (fills container)
- Form group margin: `mb-lg` (24px)
- Label to input gap: `gap-sm` (8px) using flexbox

---

## 2.4 — Core UI Component Specifications

### Button Component

**Spec:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}
```

**Variants & States:**

| Variant | Background | Text | Border | Hover | Active | Disabled |
|---------|-----------|------|--------|-------|--------|----------|
| Primary | `bg-primary-500` | white | none | `bg-primary-600` | `bg-primary-700` | `bg-primary-300 cursor-not-allowed` |
| Secondary | `bg-neutral-200` (light) / `bg-neutral-700` (dark) | `text-neutral-700` (light) | none | lighter shade | darker shade | `opacity-50` |
| Ghost | transparent | `text-primary-500` | none | `bg-primary-50` (light) / `bg-primary-900/20` (dark) | darker | transparent |
| Outline | transparent | `text-primary-500` | `border-2 border-primary-500` | `bg-primary-50` | `bg-primary-100` | faded |
| Destructive | `bg-error-500` | white | none | `bg-error-600` | `bg-error-700` | faded |

**Sizes:**

| Size | Padding | Font | Icon Size | Example Use |
|------|---------|------|-----------|-------------|
| xs | `px-sm py-xs` | `text-xs` | 16px | Chip close buttons, tags |
| sm | `px-md py-sm` | `text-sm` | 18px | Secondary buttons |
| md | `px-lg py-base` | `text-base` | 20px | Default buttons, form submit |
| lg | `px-xl py-lg` | `text-lg` | 24px | Hero CTA, prominent actions |

**States:**

- **Default:** Resting state
- **Hover:** Visual feedback (scale-105, shadow-md, colour darken)
- **Active (Pressed):** `scale-95` + darker colour for tactile feedback
- **Focus:** Visible `outline-2 outline-primary-500` (not `outline-none`!)
- **Disabled:** `opacity-50 cursor-not-allowed` + no hover effect
- **Loading:** Spinner icon inside, text hidden, button disabled

**Accessibility:**
```jsx
<button
  type="button"
  aria-label={isLoading ? "Loading..." : "Upload file"}
  disabled={disabled || isLoading}
>
  {isLoading ? <Spinner /> : children}
</button>
```

---

### Input Component

**Spec:**
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  icon?: React.ReactNode;
}
```

**States:**

| State | Border | Background | Text | Focus Ring |
|-------|--------|-----------|------|------------|
| Default | `border-neutral-300` | `bg-white` (light) / `bg-neutral-800` (dark) | `text-neutral-700` | none |
| Focused | `border-primary-500` | light tint | `text-neutral-800` | `ring-2 ring-primary-500/30` |
| Error | `border-error-500` | light error tint | `text-error-600` | `ring-2 ring-error-500/30` |
| Disabled | `border-neutral-200` | `bg-neutral-100` | `text-neutral-400` | none |
| Filled (value present) | `border-neutral-300` | `bg-white` | `text-neutral-800` | none |

**Layout:**
```jsx
<label className="flex flex-col gap-sm">
  <span className="text-xs font-600">Email Address</span>
  <input
    type="email"
    placeholder="you@example.com"
    className="px-base py-base border border-neutral-300 rounded-sm focus:ring-2 focus:ring-primary-500/30"
  />
  {error && <span className="text-xs text-error-500">{error}</span>}
  {hint && <span className="text-xs text-neutral-500">{hint}</span>}
</label>
```

**File Input (Drag-and-Drop Zone):**
```
┌─────────────────────────────────┐
│  [Upload Icon]                  │
│  Drag and drop your file here   │
│  or click to browse             │
│                                 │
│  Maximum file size: 500 MB      │
│  Supported: PDF, DOC, IMG, ...  │
└─────────────────────────────────┘
```

**States:**
- Default: Dashed border, `border-neutral-300`
- Hover: Solid border, `border-primary-500`, `bg-primary-50`
- Drag-over: `bg-primary-100 border-primary-500`
- Selected: Show file name, size, remove button

---

### Card Component

**Spec:**
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  children: React.ReactNode;
  className?: string;
}
```

**Variants:**

| Variant | Background | Border | Shadow | Use Case |
|---------|-----------|--------|--------|----------|
| Default | `bg-white` (light) / `bg-neutral-800` (dark) | `border border-neutral-200` (light) / `border-neutral-700` (dark) | `shadow-sm` | Standard containers |
| Elevated | Same | none | `shadow-elevated` (blue tint) | Featured content, primary cards |
| Outlined | transparent | `border-2 border-neutral-300` | none | Empty states, alt content |

**Structure:**
```jsx
<Card variant="default">
  <CardHeader className="pb-lg border-b border-neutral-200">
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody className="p-lg">
    {/* Content */}
  </CardBody>
  <CardFooter className="pt-lg border-t border-neutral-200">
    {/* Actions */}
  </CardFooter>
</Card>
```

**Padding:** `p-lg` (24px)

---

### File Card (Vault View)

**Design:**
```
┌────────────────────────────────┐
│ [File Type Icon]               │
│                                │
│ Document.pdf                   │  ← Truncate with ellipsis
│ 2.4 MB • June 12, 2025         │
│                                │
│ [Private] [Verified ✓]         │
└────────────────────────────────┘
  (Hover: action buttons appear)
```

**Spec:**
```typescript
interface FileCardProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  isPublic: boolean;
  isVerified: boolean;
  onDownload: () => void;
  onShare: () => void;
  onVerify: () => void;
  onDelete: () => void;
}
```

**Layout:**
- Grid: 260px × 260px (desktop), 160px × 160px (tablet), full width (mobile)
- Icon: 48px square, centered
- File name: truncate to 2 lines, ellipsis
- Metadata: 2 lines (size + date, or status badges)
- Badges: Pill shape (`rounded-full`), small text
- Action buttons: Hidden until hover, slide in from right

**Hover State:**
- Shadow: `shadow-md`
- Transform: `translateY(-2px)`
- Action buttons fade/slide in: 200ms duration
- Buttons: Download, Share, Verify, Delete (icon-only, 40px × 40px)

**Skeleton Loading:**
- Same layout as card
- Animated placeholder: `animate-pulse` with `bg-neutral-200` (light) / `bg-neutral-700` (dark)
- Duration: 1s pulse

---

### Modal / Dialog Component

**Spec:**
```typescript
interface DialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  isDismissible?: boolean;
}
```

**Layout:**
```
┌──────────────────────────────┐
│ [X]                          │  ← Close button, top-right
│ Modal Title                  │  ← aria-labelledby
│ Optional description         │
│ ─────────────────────────────│
│                              │
│ [Content]                    │
│                              │
│ ─────────────────────────────│
│ [Cancel] [Confirm]           │
└──────────────────────────────┘
```

**Accessibility:**
```jsx
<Dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <h2 id="dialog-title">{title}</h2>
  <p id="dialog-description">{description}</p>
  {/* Focus trap: first Tab → stays within dialog */}
  {/* Escape key closes modal */}
</Dialog>
```

**Sizes:**
- sm: 320px max width
- md: 480px max width
- lg: 640px max width

**Backdrop:** Semi-transparent overlay (`bg-black/30`), dismissible on click

**Animations:**
- Open: `scaleIn` + `fadeIn`, 250ms
- Close: reverse animation, 200ms
- Respects `prefers-reduced-motion`

---

### Toast / Notification Component

**Spec:**
```typescript
interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  onDismiss: (id: string) => void;
}
```

**Variants:**

| Type | Icon | Colour | Duration | Dismissible |
|------|------|--------|----------|-------------|
| Success | ✓ | `from-success-600/90 to-success-700/90` | 4s | Yes |
| Error | ✗ | `from-error-600/90 to-error-700/90` | 6s | Yes |
| Warning | ⚠ | `from-warning-600/90 to-warning-700/90` | 5s | Yes |
| Info | ℹ | `from-primary-600/90 to-primary-700/90` | 3s | Yes |
| Loading | ⟳ | `from-neutral-600/90 to-neutral-700/90` | None (persistent) | Manual close |

**Layout:**
```
┌─────────────────────────────────┐
│ [Icon] Success!                 │ [X]
│        File uploaded             │
│        [Undo] button (optional)  │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Progress bar
└─────────────────────────────────┘
```

**Stacking:**
- Bottom-right corner, 16px margin
- Stack vertically, newest at top
- Max 3 toasts visible; older ones scroll off
- Animation: Slide in from right, 250ms

**Accessibility:**
```jsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="..."
>
  {message}
</div>
```

---

### Badge Component

**Spec:**
```typescript
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Variants:**

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| Primary | `bg-primary-100` | `text-primary-700` | Feature badges |
| Secondary | `bg-neutral-200` | `text-neutral-700` | Status badges |
| Success | `bg-success-100` | `text-success-700` | ✓ Verified |
| Error | `bg-error-100` | `text-error-700` | ✗ Unverified |
| Warning | `bg-warning-100` | `text-warning-700` | ⚠ Caution |
| Outline | transparent | `text-neutral-600` | `border border-neutral-300` | Outline badges |

**Sizes:**
- sm: `px-sm py-xs text-xs rounded-full`
- md: `px-md py-sm text-sm rounded-full`

**Examples:**
- "Private" badge (secondary)
- "Verified ✓" badge (success)
- "Public" badge (outline)
- "Unverified ⚠" badge (warning)

---

### Empty State Component

**Spec:**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}
```

**Layout:**
```
      ┌────────────────┐
      │   [Big Icon]   │  ← 64px, primary-500 colour
      │   Your vault   │  ← Heading
      │   is empty     │
      │                │
      │ Upload your    │  ← Description, 2 lines max
      │ first file to  │
      │ get started    │
      │                │
      │ [Upload File]  │  ← Primary CTA, size lg
      │ [Learn more]   │  ← Secondary CTA, ghost variant
      └────────────────┘
```

**Centering:** Vertical and horizontal center of container

---

### Error State Component

**Spec:**
```typescript
interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  details?: string; // Technical details, expandable
  action?: { label: string; onClick: () => void };
}
```

**Layout:**
```
      ┌────────────────┐
      │   [Error Icon] │  ← 64px, error-500 colour
      │ Upload failed  │  ← Heading
      │                │
      │ We couldn't    │  ← User-friendly message
      │ upload your    │
      │ file.          │
      │                │
      │ [▼] More info  │  ← Expandable technical details
      │    Error: IPFS │
      │    gateway down│
      │                │
      │ [Try Again]    │  ← Primary CTA
      └────────────────┘
```

**Details Section:** Collapsible, monospace font, technical error message

---

### Loading Skeleton Component

**Spec:**
```typescript
interface SkeletonProps {
  className?: string;
}
```

**Pattern:**
- Rectangle: Default
- Customizable via className for different shapes
- Animated pulse: `animate-pulse bg-neutral-200 dark:bg-neutral-700`
- Duration: 1s

**Examples:**
- Text skeleton: `h-4 w-full rounded`
- Card header: `h-6 w-48 rounded`
- Card image: `h-48 w-full rounded-lg`

---

### Wallet Connection Button

**Spec:**
```typescript
interface WalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}
```

**States:**

| State | Display | Icon | Behaviour |
|-------|---------|------|-----------|
| **Disconnected** | "Connect Wallet" | Wallet icon | Click → opens modal |
| **Connecting** | "Connecting…" | Spinner | Disabled |
| **Connected** | "Ab3x…9fKz" (truncated) | Wallet avatar | Click → dropdown menu |

**Connected State Dropdown:**
```
┌──────────────────────────┐
│ Full Address:            │
│ AbcDef123xyz9fKzQrsT     │ [Copy icon]
│                          │
│ Balance: 5.23 SOL        │
│                          │
│ [Disconnect]             │ ← Danger button style
└──────────────────────────┘
```

**Copy behaviour:** Icon changes to checkmark for 2s with success toast

---

### File Hash / CID Display

**Spec:**
```typescript
interface HashDisplayProps {
  hash: string;
  isVerified?: boolean;
  type?: 'hash' | 'cid' | 'txid';
  onCopy?: () => void;
}
```

**Rendering:**
```
Verified hash:
┌────────────────────────────────────────────────────┐
│ ✓ | sha256:abc123xyz789def456ghi... [Copy icon]    │  ← Green prefix
└────────────────────────────────────────────────────┘

Unverified hash:
┌────────────────────────────────────────────────────┐
│ ⚠ | sha256:abc123xyz789def456ghi... [Copy icon]    │  ← Amber prefix
└────────────────────────────────────────────────────┘
```

**Font:** Monospace (JetBrains Mono), `text-xs` or `text-sm`

**Truncation:** Full hash visible with truncation via monospace font measurement

**Copy on click:** Replace copy icon with checkmark (✓) for 2s

**Tooltip on unverified:** "This file has not been verified against the blockchain."

---

**End of Phase 2: Design System Definition**

---

## Recommended Library Installation (Sprint 0)

```bash
# Tailwind CSS (update existing)
npm install -D tailwindcss@latest @tailwindcss/vite@latest

# shadcn/ui
npx shadcn-ui@latest init

# Supporting libraries
npm install sonner lucide-react clsx tailwind-merge framer-motion react-dropzone

# Fonts
# (Inter already imported in globals.css)
# Add JetBrains Mono:
npm install @fontsource/jetbrains-mono

# Optional: Bundle analysis
npm install -D @bundle-analyzer/webpack-plugin
```

---

**End of Phase 2 Design System Document**

