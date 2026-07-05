# Denft UI/UX Improvement Project — Complete Index & Execution Guidelines

**Project Status:** Phase 1-3 Complete (Planning Done) | Ready for Sprint 0 Execution  
**Created:** July 5, 2026  
**Location:** `/home/farooq/denft/`

---

## 📋 Documentation Structure

### Phase 1: Codebase Audit ✅
**File:** `AUDIT_PHASE1_CODEBASE.md` (1,200+ lines)

**Contents:**
- Project structure inventory & tech stack
- Component catalogue (30+ components flagged)
- Page/route audit with per-page issues
- Design token audit (no design system found)
- UX flow audit (5 journeys traced)
- Accessibility audit (WCAG AA failures documented)
- Performance audit (code-splitting, bundle size issues)
- Security audit (auth flash, token storage unclear)
- **Key Finding:** 🔴 **10 critical issues** blocking launch

**Read This First If:**
- You want to understand what exists
- You need evidence for design decisions
- You're reviewing code before making changes

---

### Phase 2: Design System ✅
**File:** `DESIGN_SYSTEM_PHASE2.md` (900+ lines)

**Contents:**
- **Visual identity direction** — colour palette (7 tokens), typography (3 families), spacing scale, border-radius system, shadow system, motion system
- **Component library decision** — Recommended **shadcn/ui** over HeroUI (reasoning provided)
- **Layout system** — Responsive breakpoints, navbar/sidebar patterns, grid system
- **Core UI specifications** — 13 components fully spec'd (Button, Input, Card, Modal, Toast, Badge, etc.)

**Key Decisions:**
- Colour: Blue (`#3B82F6`) + Purple (`#8B5CF6`) for modern Web3 feel
- Typography: Inter (body) + JetBrains Mono (code/hashes)
- Component library: **shadcn/ui** (accessible, customizable, copy-paste model)
- Breakpoints: mobile 320px, tablet 768px, desktop 1024px

**Use This To:**
- Understand the visual direction
- Implement consistent UI components
- Make design decisions during sprints

---

### Phase 3: Sprint Roadmap ✅
**File:** `SPRINT_ROADMAP_PHASE3.md` (1,500+ lines)

**Contents:**
- **Sprint 0:** Design system foundation (Tailwind config, shadcn/ui init, base components)
- **Sprint 1:** Navigation & layout shell (responsive navbar, footer, page transitions)
- **Sprint 2:** Authentication & onboarding (wallet modal, social login placeholder, welcome flow)
- **Sprints 3–8:** Dashboard, upload, verification, public browser, settings, polish (detailed tasks per sprint)

**Each Sprint Includes:**
- Clear goal
- Task breakdown with code examples
- Testing checklist (375px, 768px, 1280px)
- Definition of Done

**Use This To:**
- Execute sprints sequentially
- Know exactly what to build per sprint
- Verify completion with acceptance criteria

---

### Phase 4: Execution Guidelines (This Document)

---

## 🚀 How to Execute Sprints

### Before You Start

#### 1. Read the Codebase Audit
- Understand what exists
- See what's broken
- Know what to preserve

#### 2. Review the Design System
- Understand the visual direction
- Internalise the colour palette, typography, spacing
- Know which components to use

#### 3. Start with Sprint 0
- Sprint 0 is a prerequisite
- It sets up the foundation that all other sprints depend on
- Cannot skip or parallelize

### During Each Sprint

#### Phase 4A: Read First

**Before modifying any file:**

1. **Read the entire file** — Use `read_file` to get the full context
2. **Understand the code** — What does it do? How does it work?
3. **Identify what to preserve** — Business logic, API calls, wallet state management
4. **Plan your changes** — What will you add/replace? What stays?

**Example:**
```
Task: Update Navbar component

Step 1: Read /src/components/layout/Navbar.tsx (full file)
Step 2: Understand: Uses HeroUI, has search input (unused), dropdown menu
Step 3: Preserve: Wallet connection logic, theme toggle, navigation items
Step 4: Plan: Replace HeroUI Button with shadcn Button, fix responsive menu

Then: Make changes
```

---

#### Phase 4B: Code Structure Guidelines

**Never:**
- ❌ Mix multiple concerns in one file (e.g., UI + API + business logic)
- ❌ Create components >300 lines
- ❌ Use inline styles instead of Tailwind
- ❌ Hardcode hex values instead of CSS variables
- ❌ Skip `aria-label` on icon-only buttons
- ❌ Use `any` in TypeScript

**Always:**
- ✅ One component per file
- ✅ Export component and props interface
- ✅ Use Tailwind utilities + design tokens
- ✅ Type all props (no implicit `any`)
- ✅ Add accessibility attributes (aria-label, role, aria-current)
- ✅ Write `// TODO` comments for future work, not excuses

**Component Template:**
```tsx
// /src/components/features/FileCard.tsx

import React from 'react'
import { Download, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import type { FileInfo } from '@/contexts/FileContext'

export interface FileCardProps {
  file: FileInfo
  onDownload: (fileId: string) => void
  onShare: (fileId: string) => void
  onDelete: (fileId: string) => void
}

/**
 * FileCard displays a single file in the vault grid.
 * Shows file name, size, date, status badges, and action buttons.
 */
export const FileCard: React.FC<FileCardProps> = ({
  file,
  onDownload,
  onShare,
  onDelete,
}) => {
  return (
    <div
      className={cn(
        'group rounded-lg border border-neutral-200 bg-white p-lg',
        'hover:shadow-md hover:border-primary-500 transition-all duration-sm',
        'focus-within:ring-2 focus-within:ring-primary-500'
      )}
    >
      {/* Content */}
    </div>
  )
}
```

---

#### Phase 4C: TypeScript & Type Safety

**Rules:**

1. **Always type component props:**
   ```tsx
   // ✅ GOOD
   interface MyComponentProps {
     title: string
     onClose: () => void
     children: React.ReactNode
   }

   export const MyComponent: React.FC<MyComponentProps> = ({ title, onClose, children }) => {
     // ...
   }

   // ❌ BAD
   export const MyComponent = (props: any) => { // Don't do this!
     // ...
   }
   ```

2. **No implicit `any`:**
   ```tsx
   // ✅ GOOD
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setQuery(e.target.value)
   }

   // ❌ BAD
   const handleChange = (e) => { // Implicit any!
     setQuery(e.target.value)
   }
   ```

3. **Extract and reuse types:**
   ```tsx
   // ✅ GOOD
   type ViewMode = 'grid' | 'list'
   const [view, setView] = useState<ViewMode>('grid')

   // ❌ BAD
   const [view, setView] = useState<'grid' | 'list'>('grid') // Repeated
   ```

---

#### Phase 4D: Accessibility Checklist (Per Component)

Before marking a component done:

- [ ] All text has colour contrast ≥ 4.5:1 (WCAG AA)
- [ ] All inputs have associated `<label>` or `aria-label`
- [ ] All icon-only buttons have `aria-label`
- [ ] All clickable elements are ≥ 44×44px on mobile
- [ ] All interactive elements are keyboard-navigable (Tab, Enter, Escape)
- [ ] Focus indicator is visible (not removed without replacement)
- [ ] Modals trap focus (Tab stays within modal)
- [ ] Modals close on Escape key
- [ ] Error messages have `role="alert"` or `aria-live="polite"`
- [ ] Skip-to-main-content link exists (visually hidden, focusable)

---

#### Phase 4E: Performance Checklist (Per Sprint)

- [ ] No large monolithic components (split if >300 lines)
- [ ] No unnecessary `useEffect` re-renders (check dependency arrays)
- [ ] Heavy computations wrapped in `useCallback` / `useMemo`
- [ ] No console.log statements in production code
- [ ] Images have `width`, `height`, `loading="lazy"`
- [ ] Routes are code-split (use `lazy()` for page components)
- [ ] Bundle size checked (`npm run build` and review delta)
- [ ] No redundant library imports (tree-shaking verified)
- [ ] Animations respect `prefers-reduced-motion`

---

#### Phase 4F: Security Checklist (Per Sprint)

- [ ] No JWT tokens logged to console
- [ ] No wallet private keys exposed anywhere
- [ ] No `dangerouslySetInnerHTML` usage
- [ ] Protected routes verify auth before rendering (no flash)
- [ ] No transaction data interpolated without backend verification
- [ ] Environment variables in `.env`, never hardcoded
- [ ] API endpoints loaded from config, not strings
- [ ] Error messages are generic (don't leak API/system info)
- [ ] CORS headers verified on backend (not checked in frontend)

---

#### Phase 4G: Testing on Devices

**Before marking "Done":**

| Device | Viewport | Test |
|--------|----------|------|
| iPhone SE | 375px | Content fits; no horizontal scroll; touch targets ≥44px |
| iPad | 768px | Layout adapts; grid collapses to 2 columns |
| MacBook | 1280px | Content centered; max-width respected |
| Mobile Keyboard | 375px | Tab through; focus visible; keyboard nav works |

**Tools:**
- Chrome DevTools device emulation
- Real device testing if available
- Keyboard: Tab, Enter, Escape, Arrow keys

---

#### Phase 4H: Commit & Documentation

**After each sprint is complete:**

1. **Summarise changes:**
   ```markdown
   ## Sprint 1: Navigation & Layout Shell — COMPLETE

   ### Files Created
   - `/components/layout/AppLayout.tsx` — Master layout wrapper
   - `/components/ui/page-transition.tsx` — Route fade animation

   ### Files Modified
   - `/App.tsx` — Removed AnimatedBackground, wrapped routes in AppLayout
   - `/components/layout/Navbar.tsx` — Full rebuild with responsive design
   - `/components/layout/Footer.tsx` — Updated responsive grid

   ### Packages Added
   - None (all from Sprint 0)

   ### Testing Results
   - ✅ 375px (mobile): Hamburger menu works, no overflow
   - ✅ 768px (tablet): 2-column layout, menu adapts
   - ✅ 1280px (desktop): Max-width respected, nav links visible
   - ✅ Keyboard: Tab navigation works, focus ring visible

   ### Issues Found (Out of Sprint Scope)
   - Search input in old Navbar is unused (flag for Sprint 3)
   - ParticleBackground animation heavy (flag for performance audit)

   ### Before/After
   - Before: Fixed ugly background, no responsive layout
   - After: Clean navbar/footer, proper responsive grid, accessible menus
   ```

2. **Update session notes:**
   - Use `memory` tool to track completed sprints
   - Document blockers or surprises

3. **No new issues introduced:**
   - Run `npm run build` — must succeed
   - Run `npm run lint` — must pass
   - `npm run dev` — test manually on devices

---

## 🎯 Sprints at a Glance

### Sprint 0 (1 week) — Design System Foundation
**Deliverables:**
- `tailwind.config.ts` with custom design tokens
- shadcn/ui initialized and core components installed
- Base Button, Input, Card, Modal components
- Toaster/toast system via Sonner
- Updated `globals.css` with design tokens

**Acceptance Criteria:**
- Tailwind builds without errors
- Button component works with all variants
- Toaster renders test toast
- Theme toggle works

---

### Sprint 1 (2 weeks) — Navigation & Layout Shell
**Deliverables:**
- `AppLayout` wrapper component
- Rebuilt `Navbar` with responsive menu
- Updated `Footer` for responsive grid
- `PageTransition` fade-in animation
- Skip-to-main-content link

**Acceptance Criteria:**
- Layout responds correctly at 375/768/1280px
- No horizontal scroll at any breakpoint
- Mobile hamburger menu opens/closes
- Desktop nav links visible and functional
- Keyboard-navigable

---

### Sprint 2 (2 weeks) — Authentication & Onboarding
**Deliverables:**
- Rebuilt Home page hero
- `WalletConnectModal` with wallet grid
- `SocialLoginModal` placeholder (backend TBD)
- `OnboardingModal` (first-time only)
- Fixed `ProtectedRoute` auth flash
- LoadingState during auth verification

**Acceptance Criteria:**
- New user onboarding flow works end-to-end
- No auth flash; LoadingState shown while verifying
- OnboardingModal shown once, not repeated
- Wallet state persists across page refresh

---

### Sprint 3 (2 weeks) — Dashboard & File Vault
**Deliverables:**
- Dashboard with stats cards & charts
- FileVault with grid/list toggle
- FileCard component (with skeleton loading)
- EmptyState and ErrorState components
- Filter/sort UI (functional)

**Acceptance Criteria:**
- Dashboard loads without flash (skeleton first)
- Empty state shows when no files
- Error state shows if API fails
- Grid/list toggle persists in localStorage
- Search/filter/sort work correctly

---

### Sprint 4 (2 weeks) — File Upload Experience
**Deliverables:**
- Drag-and-drop upload zone (keyboard-accessible)
- Multi-stage upload progress (6 stages)
- Error recovery UI
- Blockchain transaction explainer
- Optimistic UI update on success

**Acceptance Criteria:**
- Drag-over visual feedback works
- Upload stages clearly communicated
- Error states are recoverable
- Wallet signature prompt has context
- Mobile upload (tap to browse) works

---

### Sprint 5 (2 weeks) — File Detail & Verification
**Deliverables:**
- FileDetailModal / page
- File preview panel (when possible)
- Verification panel with progress
- Hash/CID display with copy button
- ShareModal for public files

**Acceptance Criteria:**
- File metadata displays correctly
- Verification flow works end-to-end
- Hash mismatch case handled
- Copy functionality works
- Private files cannot be shared without warning

---

### Sprint 6 (2 weeks) — Public File Browser
**Deliverables:**
- PublicFilesPage component
- Searchable, sortable file grid
- Read-only FileDetailModal for public files
- Pagination or infinite scroll

**Acceptance Criteria:**
- Unauthenticated users can view/download public files
- Search/sort work correctly
- Pagination loads correctly

---

### Sprint 7 (2 weeks) — Settings & Profile
**Deliverables:**
- SettingsPage with sections (Account, Preferences, Appearance, Danger Zone)
- Wallet disconnect button
- Theme toggle
- Delete all files confirmation

**Acceptance Criteria:**
- All settings save immediately (no "Save" button)
- Destructive actions require confirmation
- Settings persist across sessions

---

### Sprint 8 (2 weeks) — Polish & Accessibility
**Deliverables:**
- Micro-interactions (scale, shadow, fade)
- ErrorBoundary components
- Final a11y audit & fixes
- Bundle size review
- Performance optimizations

**Acceptance Criteria:**
- All interactions feel responsive
- No unhandled errors (white screen)
- WCAG AA fully compliant
- Bundle size < 500KB
- Animations respect prefers-reduced-motion

---

## 📊 Quality Gates (All Sprints)

### Responsive Design
- [ ] Layout looks good at 375px (mobile)
- [ ] Layout adapts at 768px (tablet)
- [ ] Layout optimized at 1280px+ (desktop)
- [ ] No horizontal scroll at any breakpoint

### Accessibility (WCAG 2.1 AA)
- [ ] Colour contrast ≥ 4.5:1 for text
- [ ] All inputs have labels
- [ ] Icon-only buttons have aria-label
- [ ] Focus rings visible
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen readers can identify page purpose

### Performance
- [ ] No layout shift during load
- [ ] Animations are smooth (60fps)
- [ ] No unnecessary re-renders
- [ ] Animations respect prefers-reduced-motion

### Security
- [ ] No JWT/private key logging
- [ ] Protected content not flashed
- [ ] No XSS patterns (dangerouslySetInnerHTML)
- [ ] Environment variables used for config

### Code Quality
- [ ] TypeScript strict: no errors
- [ ] ESLint: no warnings
- [ ] Components <300 lines (split larger)
- [ ] No `any` types
- [ ] Commented TODO items for future work

---

## 🛠️ Tools & Commands

### Development
```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

### Useful Commands
```bash
# Check TypeScript errors
npx tsc --noEmit

# Bundle size analysis (optional)
npm install -D @bundle-analyzer/webpack-plugin
npx webpack-bundle-analyzer dist

# Format code (optional)
npx prettier --write src

# Copy shadcn components
npx shadcn-ui@latest add [component-name]
```

---

## 📚 Reference: HCI Principles Checklist

Use this checklist when reviewing any screen or component:

### Nielsen's 10 Usability Heuristics
- [ ] User is always informed about what's happening (loading, confirmed, failed)
- [ ] System uses language of users, not jargon
- [ ] User can undo/exit without losing progress
- [ ] Same actions are named/styled consistently
- [ ] Destructive actions are confirmed before execution
- [ ] Users see options without needing to remember
- [ ] Shortcuts available for experienced users
- [ ] Every element on screen serves a purpose (no clutter)
- [ ] Errors are specific and suggest recovery steps
- [ ] Help & documentation are available and task-focused

### WCAG 2.1 AA (Accessibility)
- [ ] Text contrast ≥ 4.5:1 (normal) or 3:1 (large)
- [ ] All functions available via keyboard
- [ ] Focus indicators visible
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Modals trap focus & close on Escape
- [ ] Animations respect prefers-reduced-motion
- [ ] Touch targets ≥ 44×44px on mobile

---

## 🚨 Common Pitfalls to Avoid

| Pitfall | Fix |
|---------|-----|
| **Importing entire icon library** | Use tree-shakable library (lucide-react) ✓ |
| **Hard-coded hex colours** | Use design tokens from Tailwind config |
| **No loading states** | Always show skeleton during data fetch |
| **Button without aria-label** | Icon-only buttons need `aria-label="Action"` |
| **Auth flash** | Check `isLoading` before rendering protected content |
| **Overflow on mobile** | Test at 375px; use responsive padding/gaps |
| **useEffect missing dependency** | Always specify deps; use ESLint rule |
| **No error boundaries** | Catch render errors; show recovery UI |
| **Colours that fail contrast** | Test all text colours; WCAG AA 4.5:1 |
| **No keyboard navigation** | Tab through; fix focus order |
| **Animations block interaction** | Use 150–350ms; never use sleep/delays in renders |

---

## 📞 When to Ask for Help

**Ambiguous design decision?**
> State the options, your recommendation, and the tradeoff. Wait for confirmation before implementing.

**Example:**
> "Sprint 3: File detail page — should it open in a modal or new page?
> - Option A (modal): Faster, less context switch, but can't link directly
> - Option B (page): Shareable URL, better SEO, but navigation feels heavier
> - Recommendation: Modal (faster UX for file actions)
> - Tradeoff: Cannot share direct file links"

**Found a bug outside sprint scope?**
> Document it with `// TODO` comment in code, add to sprint notes, flag for future sprint.

**Uncertainty about existing code?**
> Read thoroughly, trace the flow, look for tests or comments. If still unclear, ask before making changes.

---

## ✅ Final Checklist Before Launch

- [ ] All 8 sprints complete
- [ ] WCAG AA compliance verified (accessibility audit passed)
- [ ] Tested on 375px, 768px, 1280px (responsive design verified)
- [ ] All interactive elements keyboard-navigable
- [ ] No unhandled errors (error boundaries in place)
- [ ] Bundle size < 500KB
- [ ] Animations respect prefers-reduced-motion
- [ ] No security regressions (auth verified, no key logging)
- [ ] TypeScript strict: no errors
- [ ] ESLint: no warnings
- [ ] Performance: FCP < 2s (no splash screen delay)
- [ ] Social login functional (if backend ready) or placeholder in place
- [ ] Token persistence working (wallet connection survives refresh)
- [ ] All toasts/notifications working
- [ ] Dark mode working across all pages

---

## 📝 Summary

This project is a comprehensive UI/UX improvement for Denft, a decentralized file storage platform. Over 8 sprints (16 weeks), you will:

1. **Audit** the existing codebase (Phase 1) ✅
2. **Design** a cohesive visual system (Phase 2) ✅
3. **Plan** sprint-by-sprint execution (Phase 3) ✅
4. **Execute** each sprint methodically (Phase 4 — you are here)
5. **Deliver** production-ready, accessible, performant UI

**Success = Happy users who can upload, verify, and share files without confusion, on any device, without needing to ask for help.**

---

**End of Phase 4: Execution Guidelines**

---

## 📌 Quick Reference: Where Everything Lives

```
/home/farooq/denft/
├── AUDIT_PHASE1_CODEBASE.md           ← What exists & what's broken
├── DESIGN_SYSTEM_PHASE2.md            ← Visual direction & component specs
├── SPRINT_ROADMAP_PHASE3.md           ← Sprint-by-sprint execution plan
├── EXECUTION_GUIDELINES_PHASE4.md     ← This file (how to implement)
├── client/
│   ├── src/
│   │   ├── App.tsx                    ← Root component
│   │   ├── components/
│   │   │   ├── ui/                    ← Base components (shadcn/ui)
│   │   │   ├── features/              ← Feature-specific compositions
│   │   │   ├── layout/                ← Navbar, Footer, AppLayout
│   │   │   ├── auth/                  ← ProtectedRoute, auth modals
│   │   │   └── wallet/                ← WalletButton
│   │   ├── contexts/                  ← State management (Wallet, File, Theme, Toaster)
│   │   ├── pages/                     ← Page components (Home, Dashboard, Upload, Files)
│   │   ├── lib/                       ← Utilities (cn(), constants, etc.)
│   │   └── styles/                    ← globals.css with design tokens
│   └── tailwind.config.ts             ← Design system config
└── README.md                           ← Project overview
```

---

**Next Step:** Start Sprint 0 — Design System Foundation

