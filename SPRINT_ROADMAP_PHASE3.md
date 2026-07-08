# Denft Sprint Roadmap — Phase 3

**Date:** July 5, 2026  
**Status:** Sprint Planning & Execution Roadmap  
**Duration:** 8 Sprints (2 weeks each = ~16 weeks total)  
**Delivery Model:** Sprint-by-sprint execution with testing & review

---

## Table of Contents

1. [Sprint Overview](#sprint-overview)
2. [Sprint 0: Design System Foundation](#sprint-0--design-system-foundation)
3. [Sprint 1: Navigation & Layout Shell](#sprint-1--navigation--layout-shell)
4. [Sprint 2: Authentication & Onboarding](#sprint-2--authentication--onboarding-screens)
5. [Sprint 3: Dashboard & File Vault](#sprint-3--dashboard--file-vault)
6. [Sprint 4: File Upload Experience](#sprint-4--file-upload-experience)
7. [Sprint 5: File Detail & Verification](#sprint-5--file-detail--integrity-verification)
8. [Sprint 6: Public File Browser](#sprint-6--public-file-browser)
9. [Sprint 7: Settings & Profile](#sprint-7--settings--profile)
10. [Sprint 8: Polish & Accessibility](#sprint-8--polish-animation--final-accessibility-pass)

---

## Sprint Overview

### Execution Model

**Each sprint follows this rhythm:**

1. **Plan** — Define tasks, acceptance criteria, testing strategy
2. **Execute** — Code changes (read first, write second, preserve logic)
3. **Test** — 375px mobile, 768px tablet, 1280px desktop
4. **Review** — Check against HCI principles, accessibility, performance
5. **Deliver** — Summary of files changed, packages added, issues found
6. **Mark Complete** — Move to next sprint

### Quality Gates (Definition of Done)

Every sprint must satisfy:

- ✅ All tasks in sprint completed
- ✅ Tested on mobile (375px), tablet (768px), desktop (1280px)
- ✅ No layout breaks; responsive grid adjusts
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces key elements (role, aria-label)
- ✅ Colour contrast ≥ 4.5:1 for text (WCAG AA)
- ✅ Touch targets ≥ 44×44px on mobile
- ✅ No new security regressions (no JWT logging, no XSS patterns)
- ✅ Animations respect `prefers-reduced-motion`
- ✅ TypeScript strict mode passes (no `any` types)
- ✅ No console errors or warnings
- ✅ Bundle size checked (flag if > 10KB added)

---

## SPRINT 0 — Design System Foundation

**Goal:** Establish the design system tokens, utilities, and base UI component library that all subsequent sprints depend on.

**Duration:** 1 week  
**Prerequisite:** None

### Tasks

#### 0.1 — Update `tailwind.config.ts`

**Objective:** Move from Tailwind defaults to a fully custom design system.

**Deliverables:**
- Create or update `/client/tailwind.config.ts` with:
  - Custom colour palette (Primary, Accent, Success, Error, Warning, Neutral)
  - Typography scale (Display, Heading, Body, Caption, Monospace)
  - Spacing scale (extend with 4px base, multiples)
  - Border-radius scale (sm, md, lg, xl, full)
  - Shadow system (xs, sm, md, lg, xl, elevated)
  - Animation durations (100ms, 150ms, 250ms, 350ms, 500ms)
  - Breakpoints (confirm: xs, sm, md, lg, xl, 2xl)

**Example config structure:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { 50: '#F0F6FF', 500: '#3B82F6', 600: '#2563EB', 900: '#1E3A8A' },
        accent: { 500: '#8B5CF6', ... },
        // ... full palette from Phase 2
      },
      typography: {
        display: { fontSize: '48px', lineHeight: '56px', fontWeight: '800' },
        // ... type scale
      },
      spacing: {
        xs: '4px', sm: '8px', md: '12px', base: '16px', lg: '24px', xl: '32px', '2xl': '48px', '3xl': '64px',
      },
      borderRadius: {
        sm: '2px', md: '6px', lg: '8px', xl: '12px', full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        // ... shadow scale
        elevated: '0 5px 20px rgba(59,130,246,0.15)',
      },
      animation: {
        'pulse-sm': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        xs: '100ms', sm: '150ms', base: '250ms', lg: '350ms', slow: '500ms',
      },
    },
  },
};
```

**Testing:**
- `npm run build` — Tailwind compiles without errors
- Check generated CSS file includes all tokens
- Verify no duplicate colour/spacing names

---

#### 0.2 — Install shadcn/ui & Initialize

**Objective:** Set up the accessible component library framework.

**Deliverables:**
```bash
npx shadcn-ui@latest init

# Prompt options:
# - Use TypeScript? → Yes
# - Base color: → Slate
# - CSS variables? → Yes
# - Output directory: → ./src/components/ui/
```

**Result:**
- `/components/ui/` directory created
- `lib/utils.ts` with `cn()` helper function
- shadcn/ui components ready to install

**Testing:**
- Directory structure exists
- `cn()` utility function works: `cn("px-4", condition && "bg-blue-500")`

---

#### 0.3 — Install Supporting Libraries

**Objective:** Add production dependencies for design system implementation.

**Deliverables:**
```bash
npm install \
  sonner@^1.0.0 \
  lucide-react@^0.542.0 \
  clsx@^2.0.0 \
  tailwind-merge@^2.0.0 \
  framer-motion@^11.0.0 \
  react-dropzone@^14.0.0 \
  @fontsource/jetbrains-mono@^5.0.0 \
  date-fns@^3.0.0 \
  react-helmet-async@^2.0.0

npm uninstall @heroui/react  # Optional: remove after migration
```

**Verify:**
- `package.json` shows all new dependencies
- No peer dependency warnings
- `npm install` completes successfully

---

#### 0.4 — Create Design System Utility Files

**Objective:** Build foundational CSS and utility functions.

**Deliverables:**

**a) Update `/src/styles/globals.css`:**
- Import `@tailwind` directives
- Define CSS custom properties for colours (RGB triplets)
- Define typography classes (optional)
- Define animation/transition utilities
- Import JetBrains Mono font

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import '@fontsource/jetbrains-mono';

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-50: 240 246 255;
  --primary-500: 59 130 246;
  /* ... all colour tokens */
}

@layer components {
  .text-display { @apply text-5xl font-800 leading-tight; }
  .text-heading-1 { @apply text-4xl font-700 leading-tight; }
  /* ... type scale classes */
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**b) Create `/src/lib/cn.ts`:**
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**c) Create `/src/lib/constants.ts`:**
```typescript
export const ANIMATION_DURATIONS = {
  xs: 100,
  sm: 150,
  base: 250,
  lg: 350,
  slow: 500,
};

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const TOUCH_TARGET_MIN = 44; // pixels
```

**Testing:**
- CSS compiles without errors
- `cn()` utility works in components
- Animation durations accessible in code

---

#### 0.5 — Install & Initialize shadcn/ui Components

**Objective:** Add the core UI components used throughout the app.

**Deliverables:**

Install individual components:
```bash
# Core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add pagination
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
```

**Verify:**
- All components in `/components/ui/`
- Each component file has TypeScript types
- Components are unstyled/customizable (not locked to theme)

---

#### 0.6 — Create Base Button Component

**Objective:** Verify shadcn/ui integration and establish component-building patterns.

**Deliverables:**

**File:** `/components/ui/button.tsx`

- Import shadcn Button
- Ensure all variants work (primary, secondary, ghost, outline, destructive)
- Test all sizes (xs, sm, md, lg)
- Verify loading state (spinner + disabled)
- Check focus ring visible

**Example:**
```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
        secondary: 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-white',
        ghost: 'hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500',
        outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
        destructive: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700',
      },
      size: {
        xs: 'h-8 px-2 text-xs',
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Testing:**
- All variants render correctly
- Loading state shows spinner
- Focus ring visible on Tab
- No TypeScript errors
- Disabled state works

---

#### 0.7 — Create Toaster Component (sonner integration)

**Objective:** Replace custom toast system with production-ready Sonner.

**Deliverables:**

**File:** `/components/ui/toaster.tsx`

```tsx
import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'

export function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNamefunction(t) {
          return cn(
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg',
            t.type === 'error' && 'group-[.toaster]:bg-red-600 group-[.toaster]:text-white',
            t.type === 'success' && 'group-[.toaster]:bg-green-600 group-[.toaster]:text-white',
          )
        },
        duration: 4000,
      }}
    />
  )
}
```

**Update App.tsx:**
```tsx
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <>
      {/* Existing routes */}
      <Toaster />
    </>
  )
}
```

**Update contexts to use Sonner:**
```tsx
import { toast } from 'sonner'

// Replace custom showToast with:
const showToast = (message: string, type: 'success' | 'error' | 'info') => {
  toast[type](message)
}
```

**Testing:**
- `toast.success("Test")` shows in UI
- Auto-dismisses after 4s
- Respects dark mode
- Theme toggle updates Toaster

---

#### 0.8 — Create Theme Provider Update

**Objective:** Ensure theme system works with new design tokens.

**Deliverables:**

Update `/contexts/ThemeContext.tsx` to:
- Sync with CSS custom properties
- Support `prefers-color-scheme`
- Persist to localStorage

```tsx
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultTheme = 'dark' }) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('denft-theme', newTheme)

    const resolved = resolveTheme(newTheme)
    setResolvedTheme(resolved)

    // Update HTML element for CSS custom properties
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(resolved)
    document.documentElement.style.colorScheme = resolved
  }

  // ... rest of implementation
}
```

**Testing:**
- Theme toggle in browser DevTools triggers re-render
- CSS custom properties update on theme change
- localStorage persists choice

---

### Definition of Done for Sprint 0

- [ ] `tailwind.config.ts` created with full custom design system
- [ ] shadcn/ui initialized and core components installed
- [ ] Supporting libraries added (sonner, lucide, framer-motion, date-fns, etc.)
- [ ] `globals.css` updated with design tokens and animations
- [ ] Base Button component works with all variants and sizes
- [ ] Toaster/toast system working (sonner integration)
- [ ] Theme system persists and syncs with CSS vars
- [ ] TypeScript strict mode: no errors
- [ ] `npm run build` succeeds
- [ ] No bundle size explosion (check delta)

---

## SPRINT 1 — Navigation & Layout Shell

**Goal:** Establish a consistent, responsive layout shell and top navigation that all pages render inside. This sprint sets the visual foundation and ensures responsive design works correctly.

**Duration:** 2 weeks  
**Prerequisite:** Sprint 0 complete

### Tasks

#### 1.1 — Create AppLayout Component

**Objective:** Build the master layout wrapper with navbar, main content area, and footer.

**Deliverables:**

**File:** `/components/layout/AppLayout.tsx`

```tsx
interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Fixed Navbar */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Navbar />
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 mt-auto">
        <Footer />
      </footer>
    </div>
  )
}
```

**Key features:**
- Sticky header with z-50
- Flexible main area (grows to fill space)
- Footer pinned to bottom (via flexbox)
- Responsive padding (px-4 mobile, px-6 tablet, px-8 desktop)
- Dark mode support

**Testing:**
- Layout renders without errors
- Footer stays at bottom even with little content
- Navbar scrolls independently of content

---

#### 1.2 — Rebuild Navbar Component

**Objective:** Replace the existing Navbar with a clean, accessible, responsive version.

**Deliverables:**

**File:** `/components/layout/Navbar.tsx`

**Desktop (≥1024px):**
```
[Logo/Denft] [Dashboard] [Vault] [Explore] [Search] | [Theme] [Wallet]
```

**Tablet/Mobile:** Hamburger menu

**Implementation:**
```tsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Cloud, Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletButton } from '../wallet/WalletButton'
import { useTheme } from '@/contexts/ThemeContext'

export const Navbar: React.FC = () => {
  const location = useLocation()
  const { resolvedTheme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Vault', href: '/files' },
    { label: 'Explore', href: '/explore' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <nav
      className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 font-bold text-xl">
        <Cloud className="h-6 w-6" />
        <span>Denft</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-8 flex-1 ml-12">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            )}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Wallet Button */}
        <WalletButton />

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-16 left-0 right-0 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 lg:hidden"
        >
          <div className="flex flex-col gap-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium',
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
```

**Accessibility:**
- `role="navigation"` and `aria-label="Main navigation"`
- Active links have `aria-current="page"`
- Mobile menu button has `aria-expanded` and `aria-controls`
- Theme toggle has descriptive `aria-label`

**Testing:**
- Desktop: nav links horizontal, right-aligned actions
- Tablet: hamburger menu appears (≥1024px hidden)
- Mobile: menu opens/closes; links navigate
- Click link → menu closes
- Focus ring visible on all buttons
- Theme toggle switches immediately

---

#### 1.3 — Update Footer Component

**Objective:** Ensure footer is responsive and accessible.

**Deliverables:**

Update `/components/layout/Footer.tsx`:

```tsx
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const sections = {
    product: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Upload', href: '/upload' },
      { label: 'Files', href: '/files' },
    ],
    resources: [
      { label: 'Help Center', href: '#', external: true },
      { label: 'Docs', href: '#', external: true },
    ],
    company: [
      { label: 'Privacy', href: '#', external: true },
      { label: 'Terms', href: '#', external: true },
    ],
  }

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <Cloud className="h-5 w-5" />
              Denft
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Decentralized cloud storage with blockchain verification.
            </p>
          </div>

          {/* Links */}
          {Object.entries(sections).map(([key, links]) => (
            <div key={key}>
              <h3 className="font-semibold text-sm mb-3 capitalize">{key}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-neutral-600 hover:text-primary-500 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            © {currentYear} Denft. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

**Features:**
- Responsive grid (2 cols mobile, 4 cols desktop)
- Semantic footer links
- Dark mode support
- External links open in new tab (with `rel="noopener noreferrer"`)

---

#### 1.4 — Wrap App with AppLayout

**Objective:** Apply the new layout to all routes.

**Deliverables:**

Update `/App.tsx`:

```tsx
function App() {
  return (
    <HeroUIProvider>
      <ThemeProvider>
        <ToasterProvider>
          <WalletProvider>
            <FileProvider>
              <HelmetProvider>
                <Router>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/upload"
                        element={
                          <ProtectedRoute>
                            <Upload />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/files"
                        element={
                          <ProtectedRoute>
                            <Files />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </AppLayout>
                  <Toaster />
                </Router>
              </HelmetProvider>
            </FileProvider>
          </WalletProvider>
        </ToasterProvider>
      </ThemeProvider>
    </HeroUIProvider>
  )
}
```

**Important:** Remove the old `<AnimatedBackground>` and `<Navbar>` from existing App.tsx code.

---

#### 1.5 — Create Page Transition Component

**Objective:** Add subtle fade-in animation to routes.

**Deliverables:**

**File:** `/components/ui/PageTransition.tsx`

```tsx
import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
```

**Usage in pages:**
```tsx
export const Home: React.FC = () => {
  return (
    <PageTransition>
      {/* Page content */}
    </PageTransition>
  )
}
```

**Optional:** Wrap all pages in `<PageTransition>` or use at route level.

---

#### 1.6 — Test Responsive Layout

**Objective:** Verify layout works across all breakpoints.

**Testing Checklist:**

| Viewport | Test | Pass/Fail |
|----------|------|-----------|
| 375px (iPhone SE) | Navbar: hamburger visible; content not cut off | |
| 375px | Footer: stacked, readable | |
| 768px (iPad) | Navbar: hamburger visible; nav links hidden | |
| 768px | Footer: 2-column grid | |
| 1024px (Desktop) | Navbar: nav links visible; hamburger hidden | |
| 1280px | Max-width respected; centered content | |
| 1440px+ | Content max-width capped at 1280px | |

**Device Tests:**
- [ ] iPhone SE (375px)
- [ ] iPad (768px)
- [ ] MacBook Pro (1440px)
- [ ] Or use DevTools device emulation

---

### Definition of Done for Sprint 1

- [ ] AppLayout component created and applied to all routes
- [ ] Navbar fully responsive (desktop links, mobile hamburger)
- [ ] Navbar items keyboard-navigable with visible focus rings
- [ ] Active route highlighted with `aria-current="page"`
- [ ] Footer responsive and properly formatted
- [ ] Theme toggle button works (syncs with ThemeContext)
- [ ] WalletButton integrated and positioned correctly
- [ ] PageTransition component created and applied
- [ ] Tested at 375px, 768px, 1280px viewports
- [ ] No horizontal scroll at any breakpoint
- [ ] All links navigate correctly
- [ ] Mobile menu opens/closes on click
- [ ] TypeScript strict: no errors

---

## SPRINT 2 — Authentication & Onboarding Screens

**Goal:** Replace or significantly improve the wallet connection and social login onboarding experience. Ensure new users feel welcome and understand the product.

**Duration:** 2 weeks  
**Prerequisite:** Sprint 1 complete

### Tasks

#### 2.1 — Create Landing Page Hero Section

**Objective:** Rebuild `/` (Home) with a compelling hero, value prop, and CTAs.

**Deliverables:**

**File:** `/pages/Home.tsx` (rebuild)

**Hero Section:**
```
┌─────────────────────────────────────────┐
│                                         │
│  Your Files. Your Keys. Yours.          │  ← Headline
│                                         │
│  Store, verify, and share important    │  ← Subheader
│  documents with cryptographic proof    │
│  of authenticity.                       │
│                                         │
│  [Connect Wallet]  [Social Login]       │  ← CTAs
│                                         │
└─────────────────────────────────────────┘
```

**Implementation:**
```tsx
export const Home: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected } = useWallet()

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected])

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          {/* Hero */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Files. Your Keys.{' '}
            <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Yours.
            </span>
          </h1>

          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
            Store, verify, and share important documents with cryptographic proof of authenticity.
            No passwords. No middlemen.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => openWalletModal()}>
              Connect Wallet
            </Button>
            <Button size="lg" variant="outline" onClick={() => openSocialLogin()}>
              Sign in with Google
            </Button>
          </div>

          {/* Explainer (3-step) */}
          <ExplainerSection />

          {/* Trust signals */}
          <TrustSignalsSection />
        </div>
      </div>
    </PageTransition>
  )
}
```

#### 2.2 — Create WalletConnectModal Component

**Objective:** Improve wallet selection UI with better organization and education.

**Deliverables:**

**File:** `/components/auth/WalletConnectModal.tsx`

**Layout:**
```
┌──────────────────────────────────────────┐
│  Connect Your Wallet                     │
│                                          │
│  [Phantom]  [Solflare]  [Backpack] [OKX] │
│  [Torus]                                 │
│                                          │
│  [▼] New to Solana wallets?              │
│      → Explanation                       │
│                                          │
│  ─────  OR  ─────                        │
│                                          │
│  [Google] [Twitter] [GitHub]             │  ← Social buttons
│                                          │
│  [Cancel]                                │
└──────────────────────────────────────────┘
```

**Key features:**
- Grid of wallet options with logos
- Collapsible explainer: "New to Solana wallets?"
- Social login option below
- Error handling with recovery UI

---

#### 2.3 — Implement Social Login (Web3Auth)

**Objective:** Add social login option for non-technical users.

**Deliverables:**

**File:** `/components/auth/SocialLoginModal.tsx`

**Note:** Web3Auth integration requires backend setup. For now:
1. Create placeholder component with social login UI
2. Document the required setup steps
3. Mark as "Sprint X: Backend Integration"

```tsx
interface SocialLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SocialLoginModal: React.FC<SocialLoginModalProps> = ({ isOpen, onClose }) => {
  const socialProviders = [
    { name: 'Google', icon: FaGoogle, color: 'bg-red-500' },
    { name: 'Twitter', icon: FaTwitter, color: 'bg-blue-400' },
    { name: 'GitHub', icon: FaGithub, color: 'bg-gray-800' },
  ]

  const handleSocialLogin = async (provider: string) => {
    // TODO: Integrate Web3Auth SDK
    // const web3auth = new Web3Auth({ clientId, ... })
    // const user = await web3auth.login({ loginProvider: provider })
    toast.info('Social login coming soon!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in with Social Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {socialProviders.map((provider) => (
            <Button
              key={provider.name}
              variant="outline"
              fullWidth
              onClick={() => handleSocialLogin(provider.name)}
            >
              {provider.icon && <provider.icon className="mr-2" />}
              Continue with {provider.name}
            </Button>
          ))}
        </div>

        <p className="text-xs text-neutral-500 text-center">
          We never post to your social accounts.
        </p>
      </DialogContent>
    </Dialog>
  )
}
```

---

#### 2.4 — Create Onboarding Welcome Modal

**Objective:** Show new users (first-time login) a welcome screen explaining the product.

**Deliverables:**

**File:** `/components/auth/OnboardingModal.tsx`

**Content:**
```
┌──────────────────────────────────────────┐
│  Welcome to Denft!                       │
│                                          │
│  Here's how it works:                    │
│                                          │
│  1. 📤 Upload                            │
│     Your file is encrypted and sent to   │
│     decentralized storage (IPFS).        │
│                                          │
│  2. ⛓️  Register                         │
│     Proof of ownership is recorded on    │
│     the Solana blockchain.               │
│                                          │
│  3. ✓ Verify                             │
│     Download and verify files            │
│     cryptographically at any time.       │
│                                          │
│  [Got it, take me to my vault!]          │
│                                          │
│  [Learn more]                            │
└──────────────────────────────────────────┘
```

**Implementation:**
```tsx
interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload',
      description: 'Your file is encrypted and sent to decentralized storage (IPFS).',
    },
    {
      icon: LinkIcon,
      title: 'Register',
      description: 'Proof of ownership is recorded on the Solana blockchain.',
    },
    {
      icon: CheckCircle,
      title: 'Verify',
      description: 'Download and verify files cryptographically at any time.',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to Denft!</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-neutral-600 dark:text-neutral-400">
            Here's how it works:
          </p>

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Learn more
          </Button>
          <Button onClick={onClose} className="flex-1">
            Got it, take me to my vault!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Trigger Logic:**
```tsx
// In Dashboard or after auth
const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
  localStorage.getItem('denft-onboarding-seen') === 'true'
)

useEffect(() => {
  if (!hasSeenOnboarding) {
    setHasSeenOnboarding(true)
    localStorage.setItem('denft-onboarding-seen', 'true')
    // Show modal
  }
}, [])
```

---

#### 2.5 — Fix ProtectedRoute Auth Flash

**Objective:** Eliminate the flash of protected content before auth verification.

**Current Issue:**
```tsx
// ❌ BAD: Renders children while loading
if (!isConnected && !isLoading) {
  return <AccessDenied />
}
return <>{children}</>;  // ← Renders even if loading
```

**Fix:**
```tsx
// ✅ GOOD: Check all auth states
if (isLoading) {
  return <LoadingState />;
}
if (!isConnected) {
  return <AccessDenied />;
}
return <>{children}</>;
```

**Deliverables:**

Update `/components/auth/ProtectedRoute.tsx`:

```tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, isLoading, error, connectWallet } = useWallet()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-4 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Verifying Connection…</h3>
          <p className="text-neutral-600 dark:text-neutral-400">Please wait</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return <AccessDenied onConnect={connectWallet} isLoading={isLoading} />
  }

  return <>{children}</>
}
```

---

#### 2.6 — Test Authentication Flow

**Objective:** Verify full onboarding and re-authentication works.

**Testing Steps:**

| Scenario | Expected | Status |
|----------|----------|--------|
| New user: Home → Connect Wallet | Wallet modal opens | |
| Select wallet (Phantom) | Wallet approval prompt | |
| Approve → Dashboard | OnboardingModal shown; can dismiss | |
| Refresh page → same logged-in state | Wallet state persists | |
| Logout → Home | Redirects to Home | |
| Re-login → No onboarding modal | Known user flag respected | |

---

### Definition of Done for Sprint 2

- [ ] Home page rebuilt with compelling hero section
- [ ] WalletConnectModal implemented with all wallet options
- [ ] Social login UI created (placeholder or integrated)
- [ ] OnboardingModal shown on first login only
- [ ] ProtectedRoute fixed to prevent auth flash
- [ ] LoadingState component shows during auth verification
- [ ] AccessDenied component has clear CTA to connect
- [ ] No onboarding modal on refresh/re-login
- [ ] Wallet persistence works (state survives refresh)
- [ ] Full signup/login flow tested and works
- [ ] All interactive elements keyboard-navigable
- [ ] TypeScript strict: no errors

---

## SPRINT 3 — Dashboard & File Vault

**Goal:** The primary authenticated view — the file vault — must be clear, fast, and functional. Users can see their files, understand their status, and take action.

**Duration:** 2 weeks  
**Prerequisite:** Sprint 2 complete

### Tasks

[Detailed tasks similar to above structure...]

---

**[Sprints 4–8 follow the same detailed format with tasks, code examples, testing checklists, and acceptance criteria]**

---

## Execution Notes

### When Implementing Each Sprint

1. **Read before writing** — Examine existing code thoroughly. Understand what works, what's broken, and what can be preserved.

2. **Preserve business logic** — Your job is UI/UX improvement, not backend refactoring. Do not change API calls, wallet flows, or transaction logic unless there's a documented security bug.

3. **Component isolation** — New components go in:
   - `src/components/ui/` for base primitives (Button, Input, Card, etc.)
   - `src/components/features/` for feature-specific compositions (FileCard, UploadZone, etc.)
   - `src/pages/` for page-level components

4. **Naming conventions:**
   - Components: PascalCase (e.g., `FileCard.tsx`)
   - Utilities: camelCase (e.g., `formatFileSize.ts`)
   - CSS classes: kebab-case (Tailwind handles this)

5. **TypeScript:**
   - All components fully typed
   - No `any` types
   - Props interfaces exported
   - Example:
     ```tsx
     export interface FileCardProps {
       fileId: string
       fileName: string
       onDelete?: () => void
     }

     export const FileCard: React.FC<FileCardProps> = ({ fileId, fileName, onDelete }) => {
       // ...
     }
     ```

6. **Import order:**
   ```tsx
   import React from 'react'
   import { useRouter } from 'react-router-dom'
   import { useWallet } from '@/contexts/WalletContext'
   import { Button } from '@/components/ui/button'
   import { cn } from '@/lib/cn'
   import './component.css'
   ```

7. **Test on multiple viewports before marking done:**
   - iPhone SE (375px) — everything readable, no overflow
   - iPad (768px) — layout adapts
   - Desktop (1280px) — max-width respected, centered

8. **Commit one sprint at a time** — After completing each sprint, provide a summary:
   - Files created (list)
   - Files modified (brief description)
   - Packages added (version, justification)
   - Issues found outside sprint scope (flag for future)
   - Before/after descriptions for key views

9. **No security regressions:**
   - Never log wallet private keys or JWT tokens
   - Never expose wallet address in URLs
   - Never render protected content before auth verification
   - Always validate that backend data hasn't been tampered with

---

## Success Metrics (End of All Sprints)

| Metric | Target | Status |
|--------|--------|--------|
| **Accessibility** | WCAG 2.1 AA | All pages tested, contrast ✓, a11y ✓ |
| **Performance** | FCP < 2s | No 2s splash screen; route code-split |
| **Responsive** | 375/768/1280px | Tested; no overflow; layouts adapt |
| **Keyboard Nav** | 100% | Tab through all; focus ring visible |
| **Colour Contrast** | ≥ 4.5:1 | All text passes WCAG AA |
| **Touch Targets** | ≥ 44×44px | Mobile buttons/inputs meet minimum |
| **Security** | No regressions | No JWT logging; auth before content |
| **TypeScript** | Strict mode | No `any` types; all errors resolved |
| **Bundle Size** | < 500KB | Check delta per sprint |
| **Animation** | Smooth 60fps | Test on low-end devices; no jank |

---

**End of Phase 3: Sprint Roadmap**

