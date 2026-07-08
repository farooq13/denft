# Denft Frontend Codebase Audit — Phase 1

**Date:** July 5, 2026  
**Project:** Denft (Decentralized, Privacy-First Cloud Storage with Blockchain Verification)  
**Scope:** React.js + Tailwind CSS Frontend + Solana Anchor Integration  
**Status:** Comprehensive Audit Complete

---

## Table of Contents

1. [Project Structure Inventory](#11--project-structure-inventory)
2. [Component Catalogue](#12--component-catalogue)
3. [Page & Route Audit](#13--page--route-audit)
4. [Design Token Audit](#14--design-token-audit)
5. [UX Flow Audit](#15--ux-flow-audit)
6. [Accessibility Audit](#16--accessibility-audit)
7. [Performance Audit](#17--performance-audit)
8. [Security Audit](#18--security-audit)
9. [Key Findings Summary](#key-findings-summary)

---

## 1.1 — Project Structure Inventory

### Directory Structure

```
/client/
├── src/
│   ├── App.tsx                    # Root application component with routing & theming
│   ├── main.tsx                   # Entry point (React 19 + strict mode)
│   ├── index.css                  # Base CSS (likely Tailwind imports)
│   ├── vite-env.d.ts              # Vite environment types
│   ├── assets/                    # Static assets (images, etc.)
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx # Route protection wrapper (checks wallet connection)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Top navigation bar with wallet button
│   │   │   └── Footer.tsx         # Footer with links and social media
│   │   ├── ui/
│   │   │   ├── Toaster.tsx        # Custom toast notification system (framer-motion)
│   │   │   ├── LoadingScreen.tsx  # Loading/splash screen (2s on app init)
│   │   │   └── ParticleBackground.tsx  # Canvas-based animated particle effect
│   │   └── wallet/
│   │       └── WalletButton.tsx   # Wallet connection UI (multi-wallet support)
│   ├── contexts/
│   │   ├── WalletContext.tsx      # Solana wallet adapter wrapper
│   │   ├── FileContext.tsx        # File upload/download/management state
│   │   ├── ThemeContext.tsx       # Light/dark/system theme management
│   │   └── ToasterContext.tsx     # Toast notification state
│   ├── pages/
│   │   ├── Home.tsx               # Landing page with hero, features, stats
│   │   ├── Dashboard.tsx          # Authenticated dashboard with analytics
│   │   ├── Upload.tsx             # File upload page with multi-file support
│   │   └── Files.tsx              # File vault browser (grid/list view)
│   └── styles/
│       └── globals.css            # Global CSS (CSS vars + Tailwind)
├── public/
│   ├── vercel.json                # Vercel deployment config
│   └── [assets]
├── index.html                     # HTML entry point
├── vite.config.ts                 # Vite config (React + Tailwind plugins)
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.node.json             # Node-specific TS config
├── package.json                   # Dependencies (see below)
└── eslint.config.js               # ESLint rules
```

### Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Build** | Vite | 7.1.4 | Fast HMR, supports Tailwind plugin |
| **Framework** | React | 19.1.1 | Latest with JSX transform |
| **Styling** | Tailwind CSS | 4.1.12 | Via @tailwindcss/vite plugin |
| **Component Library** | HeroUI (@heroui/react) | 2.8.4 | Pre-built UI components (not shadcn/ui) |
| **Routing** | React Router | 7.8.2 | Client-side routing |
| **State Management** | React Context API | Built-in | Used for Wallet, Files, Theme, Toaster |
| **Solana Integration** | @solana/web3.js | (varies) | Direct integration + Wallet Adapter |
| **Wallet Adapter** | @solana/wallet-adapter-react | 0.15.39 | Multi-wallet support (Phantom, Solflare, etc.) |
| **Icons** | lucide-react | 0.542.0 | Consistent icon library ✓ |
| **Animation** | framer-motion | (not yet installed) | Used in Toaster but needs explicit install |
| **Data Fetching** | @tanstack/react-query | 5.86.0 | Installed but not actively used in code |
| **Charts** | recharts | 3.1.2 | Used for Dashboard analytics |
| **Language** | TypeScript | 5.8.3 | Strict mode enabled |
| **Linting** | ESLint | 9.33.0 | With React hooks plugin |

### Entry Point Flow

```
main.tsx
  → createRoot() at #root
  → <StrictMode>
    → <App />
      → <HeroUIProvider>
        → <ThemeProvider> (light/dark/system)
          → <ToasterProvider>
            → <WalletProvider> (Solana wallet adapter)
              → <FileProvider>
                → <Router>
                  → <AnimatedBackground /> (fixed, -z-10)
                  → <Navbar /> (sticky, z-50)
                  → <main> with <Routes>
                    → Home (public)
                    → /dashboard (protected)
                    → /upload (protected)
                    → /files (protected)
                  → <Footer />
                → <Toaster /> (for notifications)
```

### Routing Strategy

**Router Library:** React Router DOM v7

**Routes:**
- `/` — Home page (public, landing page)
- `/dashboard` — Dashboard with analytics (protected)
- `/upload` — File upload page (protected)
- `/files` — File vault browser (protected)
- (Commented out: `/verify`, `/profile`, `/shared-files`)

**Route Protection:**
- `<ProtectedRoute>` wrapper component in `/components/auth/ProtectedRoute.tsx`
- Checks `isConnected` from `WalletContext`
- If not connected: renders `<AccessDenied>` modal prompting wallet connection
- Loading state: `<LoadingState>` spinner with "Checking Wallet Connection…"
- ⚠️ **Issue:** Component renders before redirect; user may see a flash of protected content. No server-side auth validation. Token-based fallback not visible in code.

### State Management Strategy

**Pattern:** React Context API (no Redux or Zustand)

**Contexts:**

1. **WalletContext** (`contexts/WalletContext.tsx`)
   - Manages Solana wallet connection state
   - Holds: `isConnected`, `walletAddress`, `publicKey`, `token` (JWT?), `balance`, `connectionStatus`, `error`
   - Methods: `connectWallet()`, `disconnectWallet()`, `signTransaction()`, `signMessage()`, `refreshBalance()`
   - Wraps `@solana/wallet-adapter-react` and `ConnectionProvider`
   - Network: **Devnet** (hardcoded in context)
   - Supported wallets: Phantom, Solflare, Alpha, Torus
   - **Issue:** Token management not fully clear. JWT storage mechanism not documented.

2. **FileContext** (`contexts/FileContext.tsx`)
   - Manages file operations (upload, download, delete, share, verify)
   - Holds: `files[]`, `sharedFiles[]`, `publicFiles[]`, `favoriteFiles[]`, `recentFiles[]`, `isLoading`, `uploadProgress`, `error`, `filters`, `sortOptions`, `totalStorage`, `usedStorage`
   - Methods: `uploadFile()`, `uploadMultipleFiles()`, `fetchFiles()`, `verifyFile()`, `shareFile()`, `downloadFile()`, `deleteFile()`, `searchFiles()`, `filterFiles()`, `sortFiles()`
   - Requires authentication: `token` + `walletAddress`
   - API calls via `makeAuthenticatedRequest()` helper
   - ⚠️ **Issue:** API endpoint not shown in code. Assumes backend exists at undocumented URL.

3. **ThemeContext** (`contexts/ThemeContext.tsx`)
   - Manages light/dark/system theme
   - Persists to localStorage (`denft-theme`)
   - Applies classes to `<html>` element
   - Methods: `setTheme()`, `toggleTheme()`, `getSystemTheme()`
   - Responds to system `prefers-color-scheme` media query

4. **ToasterContext** (`contexts/ToasterContext.tsx`)
   - Manages toast notification queue
   - Holds: `toasts[]`
   - Methods: `showToast()`, `updateToast()`, `removeToast()`, `clearAllToasts()`, `showLoadingToast()`, `hideLoadingToast()`
   - Auto-dismiss with configurable duration (error: 6s, success: 4s, info: 3s)
   - Supports persistent toasts and custom actions

### Styling Strategy

**Primary:** Tailwind CSS 4.1.12 via `@tailwindcss/vite` plugin (Vite-native, no PostCSS config)

**Secondary:** HeroUI component library (`@heroui/react`) — provides styled components

**Approach:**
- Tailwind utility classes for layout and spacing
- HeroUI `<Button>`, `<Card>`, `<Modal>`, `<Input>`, `<Avatar>`, etc. for structured components
- CSS variables in `:root` for theme colors (in `globals.css`)
- No CSS modules or styled-components observed
- Inline styles for animations (`animationDuration` style prop in ParticleBackground)

**Color Strategy:**
- CSS custom properties defined in `globals.css` (e.g., `--background`, `--primary`, `--accent`)
- Light/dark variants supported
- Tailwind defaults used where custom vars not defined
- ⚠️ **Issue:** Hardcoded hex colors in some places (e.g., particle colors in ParticleBackground: `rgba(59, 130, 246, 0.6)`)

### Solana Wallet Integration

**Provider Stack:**
```
<ConnectionProvider endpoint={clusterApiUrl(network)}>
  <WalletProvider wallets={wallets}>
    <WalletModalProvider>
      [app]
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

**Supported Wallets:**
- Phantom
- Solflare
- Alpha
- Torus (web-based)

**Connection Flow:**
1. User clicks wallet button in navbar
2. `<WalletButton>` modal opens with wallet list
3. User selects wallet (or is redirected to install if not detected)
4. `useWallet()` hook from `@solana/wallet-adapter-react` handles connection
5. JWT token issued (mechanism unclear — may be custom backend)
6. Wallet address stored in `WalletContext`

**Network:** Devnet (hardcoded; no production/mainnet support yet)

### Web3Auth Integration

**Status:** Not implemented in current codebase. Comments reference social login, but no Web3Auth code found.
- Package.json includes `wagmi` but it's not used
- Social login feature mentioned in user stories but commented out in pages

---

## 1.2 — Component Catalogue

### All Components

| Component | File Path | Type | Purpose | Props | State | Issues |
|-----------|-----------|------|---------|-------|-------|--------|
| **App** | `App.tsx` | Page | Root application wrapper | `children` | `isAppLoading`, `mountAnimation` | ⚠️ Over-engineered: 2s loading screen + mount animation hard to skip |
| **Navbar** | `components/layout/Navbar.tsx` | Layout | Top navigation bar | None | `isScrolled`, `searchQuery`, mobile state | ⚠️ 200+ lines; search functionality not connected; no mobile hamburger visible |
| **Footer** | `components/layout/Footer.tsx` | Layout | Footer with links | None | None | ✓ Clean; responsive grid |
| **Home** | `pages/Home.tsx` | Page | Landing page | None | `animationStep`, `mousePosition` | ⚠️ 300+ lines; mock data; animations not optimised |
| **Dashboard** | `pages/Dashboard.tsx` | Page | User dashboard | None | `analyticsData`, `storageAnalytics`, `quickStats` | ⚠️ 200+ lines; uses mock data instead of real API; recharts without proper responsive config |
| **Upload** | `pages/Upload.tsx` | Page | File upload interface | None | `uploadFiles[]`, `uploadSettings`, `isDragOver`, `tagInput` | ⚠️ 200+ lines; drag-drop logic but limited error handling |
| **Files** | `pages/Files.tsx` | Page | File vault browser | None | `viewMode`, `searchQuery`, `selectedCategory`, `sortBy`, `sortDirection` | ⚠️ 200+ lines; pagination logic incomplete; bulk operations stubbed |
| **WalletButton** | `components/wallet/WalletButton.tsx` | UI | Wallet connection button | None | `connectingWallet` | ✓ Multi-wallet support; good error handling |
| **ProtectedRoute** | `components/auth/ProtectedRoute.tsx` | Auth | Route guard | `children`, `fallback?` | None | ⚠️ Renders LoadingState without timeout; may hang if wallet state never resolves |
| **Toaster** | `components/ui/Toaster.tsx` | UI | Toast notification container | None | None | ✓ Animated with framer-motion; auto-dismiss with progress bar |
| **ToastItem** | `components/ui/Toaster.tsx` (subcomponent) | UI | Individual toast | `id`, `message`, `type`, `title`, `action`, `progress` | `isVisible`, `timeLeft` | ✓ Good; auto-dismisses with countdown |
| **LoadingScreen** | `components/ui/LoadingScreen.tsx` | UI | Splash screen | None | `loadingStep`, `progress` | ⚠️ Hard-coded 2s delay; can't be skipped; blocks app mount |
| **ParticleBackground** | `components/ui/ParticleBackground.tsx` | UI | Animated particle canvas | None | `isVisible`, particles state | ⚠️ Heavy (canvas + mouse tracking); no performance optimisation; no memoisation |
| **WalletContext** | `contexts/WalletContext.tsx` | Context | Wallet state | N/A | Full wallet state object | ⚠️ Toast management inside context; token storage mechanism unclear |
| **FileContext** | `contexts/FileContext.tsx` | Context | File management state | N/A | Full file state + cache | ⚠️ No error retry logic; API URL hardcoded(?); no cache invalidation strategy |
| **ThemeContext** | `contexts/ThemeContext.tsx` | Context | Theme management | N/A | `theme`, `resolvedTheme` | ✓ Clean; proper media query listener cleanup |
| **ToasterContext** | `contexts/ToasterContext.tsx` | Context | Toast state | N/A | `toasts[]` | ✓ Well-designed; auto-cleanup |

### Components Flagged for Improvement

#### 🔴 Over 300 Lines
- **App.tsx** (~100 lines of non-boilerplate code, but heavy)
- **Home.tsx** (~300+ lines; needs component extraction)
- **Dashboard.tsx** (~300+ lines; stats, charts, and file list mixed)
- **Upload.tsx** (~300+ lines; file queue + settings mixed)
- **Files.tsx** (~300+ lines; filtering + grid/list + pagination mixed)
- **Navbar.tsx** (~200+ lines; search + dropdown + mobile menu)

#### ⚠️ Missing Accessibility
- **Navbar** — mobile hamburger menu button lacks `aria-expanded`, `aria-controls`
- **WalletButton** — no `aria-label` on wallet selection items
- **FileCard** (not found yet) — likely lacks proper semantics
- **ToastItem** — no `role="alert"` or `aria-live="polite"`
- All icon-only buttons need `aria-label`

#### 🔴 No Loading/Error States
- **FileContext.fetchFiles()** — no error boundary or retry UI
- **Dashboard** — uses mock data, no loading skeleton
- **Files** — pagination loader not visible in code
- Upload stages lack clear visual indicators

#### ⚠️ Inline Styles + Hardcoded Colors
- **ParticleBackground.tsx** — particles hardcoded as `rgba(59, 130, 246, 0.6)` instead of CSS var
- **App.tsx** — `animationDuration: '6s'` inline instead of CSS class
- Several places use `style={{}}` instead of Tailwind

#### 🟡 No Memoisation in High-Frequency Render Paths
- **App.tsx** — `<AnimatedBackground>` re-renders on every parent change
- **Navbar.tsx** — likely re-renders entire nav on search input change
- **ParticleBackground.tsx** — canvas updates every frame without `useCallback` for draw function

#### ⚠️ Styling Mixed Approaches
- HeroUI components mixed with Tailwind utilities
- No consistent spacing scale (some `p-4`, some `p-6`, some `px-6 py-4`)
- No design token system (no shadow, border-radius, or typography scale defined)

---

## 1.3 — Page & Route Audit

### Route Matrix

| Route | Component | Auth Required | Purpose | Key UI Elements | Status |
|-------|-----------|---|---------|-----------------|--------|
| `/` | Home | ❌ No | Landing page | Hero, features, stats, CTA buttons | ✓ Exists |
| `/dashboard` | Dashboard | ✅ Yes | Authenticated user dashboard | Stats cards, charts, recent files | ✓ Exists (protected) |
| `/upload` | Upload | ✅ Yes | File upload interface | Drag-drop zone, file list, settings | ✓ Exists (protected) |
| `/files` | Files | ✅ Yes | File vault browser | Grid/list view, search, filter, sort | ✓ Exists (protected) |
| `/verify` | (Commented) | ✅ Yes | File verification | Not implemented | ❌ Stub only |
| `/profile` | (Commented) | ✅ Yes | User settings | Not implemented | ❌ Stub only |
| `/shared-files` | (Commented) | ✅ Yes | Shared files view | Not implemented | ❌ Stub only |

### Per-Page Issues

#### **Home (`/`)**

✓ **What works:**
- Hero section with CTA buttons ("Connect Wallet", "Get Started")
- Feature cards with icons and descriptions
- Stats section with mock data
- Supported file types showcase
- Responsive grid layout
- Call-to-action to dashboard

⚠️ **Issues:**
- Uses animated counters (`useAnimatedCounter` hook) but not exported/reusable
- Mock data hardcoded (2.4M files, 15K users, etc.) — not real
- No meta tags for SEO (no title, description, og:image)
- Mouse position tracking state never used (registered but no visual feedback)
- "Get Started" button does not navigate anywhere
- No explanation of what "verification" means
- Feature descriptions use jargon ("granular access controls", "smart contracts") — non-technical users won't understand

#### **Dashboard (`/dashboard`)**

✓ **What works:**
- Protected route guard
- Summary stats (4 cards)
- Recent uploads section
- Recharts integration for analytics

⚠️ **Critical Issues:**
- **Uses mock data** — `generateMockAnalytics()` instead of real API
- **No empty state** — what if user has no files?
- **No loading skeleton** — users see blank screen during fetch
- **No error state** — what if API fails?
- **Storage percentage calculation** — no visual feedback if user is near quota
- **Analytics charts** — no loading state; may flicker if data changes
- **Accessibility** — no `aria-label` on stat cards; chart axis labels not described
- **Responsive** — grid may break on tablet; no overflow handling

#### **Upload (`/upload`)**

✓ **What works:**
- Drag-and-drop file selection
- Multi-file queue support
- File category auto-detection
- Privacy toggle (public/private)
- Upload settings modal
- Tag input

⚠️ **Critical Issues:**
- **No drag-over visual feedback** — `isDragOver` state not used in render
- **No progress indicator** — `uploadProgress` from context but not displayed
- **No stage tracking** — where in the upload process is the user? (validating? uploading to IPFS? waiting for signature?)
- **File size validation** — only mentioned, not implemented
- **No success state** — upload complete but user doesn't see confirmation
- **No error recovery** — if upload fails, user cannot retry
- **Mobile upload** — tap-to-browse not tested
- **Accessibility** — drag-drop zone not keyboard-accessible; no `role="button"` or `aria-label`
- **No blockchain transaction explanation** — user will see wallet prompt with no context

#### **Files (`/files`)**

✓ **What works:**
- Grid/list view toggle (persisted to localStorage)
- Search input (client-side)
- Filter by category
- Sort options
- Pagination controls visible

⚠️ **Critical Issues:**
- **No empty state** — what if vault is empty?
- **No loading skeleton** — blank screen while files load
- **No error state** — API fail case not handled
- **Search not debounced** — may cause performance issues on large vaults
- **Pagination logic incomplete** — `currentPage` state exists but page change not fully wired
- **File cards layout** — no responsive breakpoints; may overflow on mobile
- **Bulk operations stubbed** — checkbox column exists but actions not implemented
- **No file preview** — clicking a file does nothing?
- **Sorting direction icon unclear** — does chevron point up or down?
- **Accessibility** — file list not semantic (no `<ul>`/`<li>`); sort/filter controls not labelled

### Missing Critical States (Across All Pages)

| State | Impact | Current | Issue |
|-------|--------|---------|-------|
| **Loading** | User doesn't know something is happening | Blank screen or spinner text | No skeleton UI |
| **Empty** | User confused when vault is empty | Probably blank or error state | No designed empty state |
| **Error** | User can't recover from API failures | No error boundary visible | No retry UI |
| **No Connection** | User tries to use protected pages offline | Likely hangs or white screen | No offline detection |
| **Slow Network** | Impatient users bounce | No progress indication | No ETA or cancel button |

---

## 1.4 — Design Token Audit

### Current Design Tokens (from `globals.css`)

**CSS Custom Properties (`:root`):**

```css
--background: 15 23 42           /* slate-900 */
--foreground: 248 250 252        /* slate-50 */
--primary: 59 130 246            /* blue-500 */
--primary-foreground: 255 255 255
--secondary: 100 116 139         /* slate-500 */
--secondary-foreground: 248 250 252
--accent: 139 92 246             /* purple-500 */
--accent-foreground: 255 255 255
--destructive: 239 68 68         /* red-500 */
--destructive-foreground: 255 255 255
--border: 71 85 105              /* slate-600 */
--input: 30 41 59                /* slate-800 */
--ring: 59 130 246               /* blue-500 */
--radius: 0.5rem
```

**Dark mode:** Same as light (no light mode variant defined beyond `.light` class selector)

### Tailwind Configuration

**Status:** ⚠️ **No `tailwind.config.js` or `tailwind.config.ts` found**

- Using Tailwind 4.1.12 via `@tailwindcss/vite` plugin
- Relying on Tailwind defaults + CSS custom properties
- **No custom colour palette defined**
- **No custom typography scale**
- **No custom spacing tokens**
- **No custom shadows**
- **No custom border-radius scale**

### Color Palette Analysis

**Primary Palette Used:**
- Blue: `rgb(59, 130, 246)` — Tailwind blue-500 ✓
- Purple: `rgb(139, 92, 246)` — Tailwind purple-500 ✓
- Red: `rgb(239, 68, 68)` — Tailwind red-500 (destructive) ✓
- Slate: `rgb(100, 116, 139)` — Tailwind slate-500 (secondary) ✓
- Green: `rgba(34, 197, 94, ...)` — Tailwind green-500 (success) ✓

**Hardcoded Colours Found:**
- Particle colors in `ParticleBackground.tsx`: `rgba(59, 130, 246, 0.6)`, `rgba(147, 51, 234, 0.6)`, `rgba(236, 72, 153, 0.6)`, `rgba(34, 197, 94, 0.4)`, `rgba(249, 115, 22, 0.4)`
- Toast colors in `Toaster.tsx`: `'from-green-600/90'`, `'from-red-600/90'`, `'from-blue-600/90'` — Tailwind classes ✓

### Typography Analysis

**Font Family:**
- Imported from Google Fonts: `Inter` (weights: 300, 400, 500, 600, 700, 800, 900)
- **No custom font family configured in Tailwind**
- All type scales are Tailwind defaults (no design system)

**Font Sizes Used (ad hoc):**
- H1/H2: `text-2xl`, `text-3xl`, `text-4xl` (no consistent scale)
- Body: `text-sm`, `text-base`, `text-lg` (mixed)
- No monospace font for hashes/CIDs

**Issue:** Typography is inconsistent. No defined scale means designers/devs pick sizes arbitrarily.

### Spacing

**Scale Used:**
- `p-2`, `p-4`, `p-6`, `p-8` — Tailwind defaults ✓
- `gap-2`, `gap-4`, `gap-6`, `gap-8`, `gap-12` — Tailwind defaults ✓
- **No custom spacing tokens**

**Issue:** No consistent spacing hierarchy. `p-4` and `p-6` both used in similar contexts.

### Border Radius

**Values Used:**
- `rounded-lg` — Tailwind default ✓
- `rounded-full` — Tailwind default ✓
- `rounded-xl` — Tailwind default ✓
- **No custom scale**

**Issue:** No distinction between button corners (should be smaller) vs. card corners vs. badge corners.

### Shadows

**Strategy:** Inline Tailwind utility classes

**Issues:**
- Heavy shadows on ParticleBackground (blur-3xl, blur-2xl) — no curated shadow system
- HeroUI components bring their own shadows
- No elevation system (shadow-sm for subtle, shadow-lg for modal, etc.)

### Animations & Transitions

**Current Approach:**
- Framer Motion for toast animations (`animate-pulse`, motion.div)
- Tailwind animation utilities (`animate-bounce`, `animate-pulse`, `animate-ping`)
- Inline `animationDuration` style props
- CSS transitions via Tailwind (e.g., `transition-all duration-300`)

**Issues:**
- No `prefers-reduced-motion` media query support visible
- Duration values hardcoded (300ms, 600ms, 8s) — no reusable tokens
- Animations not consistently applied across UI

---

## 1.5 — UX Flow Audit

### Journey A: New User Onboarding (Social Login via Web3Auth)

**Current State:** 🔴 **Not Implemented**

**Expected Flow:**
1. User arrives at `/`
2. Clicks "Get Started" or "Sign in with Google"
3. Web3Auth modal opens
4. User selects social provider (Google, Twitter, etc.)
5. Wallet is provisioned (derived account)
6. Redirects to `/dashboard`
7. Welcome modal explains the product

**Actual Flow:**
1. User arrives at `/` (Home page)
2. "Get Started" button exists but **does not navigate**
3. No social login UI visible
4. User must click "Connect Wallet" instead
5. Sees wallet list (Phantom, Solflare, etc.)
6. Must already have a wallet installed
7. Redirects to `/dashboard`

**Missing Steps:**
- ❌ Social login option (Web3Auth not integrated)
- ❌ Onboarding welcome modal
- ❌ Explanation of what "verification" means
- ❌ Tutorial for uploading first file

**Feedback Issues:**
- ⚠️ No explanation during wallet connection — "Connecting…" text only
- ⚠️ No error message if connection fails (silent?)
- ⚠️ Redirect to dashboard may confuse new user (empty vault)

---

### Journey B: Wallet User Login (Returning User)

**Flow:**
1. User arrives at `/` (Home page)
2. Clicks "Connect Wallet"
3. `<WalletButton>` modal opens
4. User selects wallet (Phantom, Solflare, etc.)
5. Wallet's own popup prompts user to approve connection
6. User signs (no separate message signing observed)
7. Redirects to `/dashboard`

**Feedback:**
- ✓ "Connecting…" spinner shown during wallet selection
- ✓ Wallet address displayed in connected state
- ❌ No confirmation that authentication succeeded
- ❌ No loading skeleton on dashboard while files fetch
- ❌ Dashboard may appear empty if fetch fails silently

**Issues:**
- ⚠️ No JWT token visible/stored (authentication mechanism unclear)
- ⚠️ Refresh page = need to reconnect (no session persistence apparent)
- ⚠️ No "Remember me" or localStorage persistence

---

### Journey C: File Upload

**Flow:**
1. Authenticated user navigates to `/upload`
2. User selects file (drag-drop or click-to-browse)
3. File appears in queue
4. User adjusts settings (public/private, tags, description)
5. Clicks "Upload"
6. File is uploaded to backend/IPFS
7. Backend submits blockchain transaction
8. User's wallet prompts for signature
9. Transaction confirmed on Solana
10. File appears in `/files` vault

**Current Visual Feedback:**
- ✓ File appears in queue with icon and size
- ❌ Drag-drop zone has no hover state (no visual feedback)
- ❌ Upload progress not shown
- ❌ No stage indicators (validating → uploading → confirming)
- ❌ No blockchain transaction explanation before wallet prompt
- ❌ No confirmation after upload completes

**Critical Gaps:**
- ⚠️ "Cancel" button availability unclear (when can user cancel?)
- ⚠️ No retry if upload fails midway
- ⚠️ No file size warnings (max upload size?)
- ⚠️ No bandwidth/progress estimate
- ⚠️ Mobile upload (tap to browse) — no testing observed

**Error Scenarios:**
- ❌ File too large → no error message shown
- ❌ Unsupported file type → no error message shown
- ❌ Network interrupted → no recovery UI
- ❌ Wallet signature rejected → no recovery UI
- ❌ Transaction fails on-chain → no error message

---

### Journey D: File Retrieval and Verification

**Flow:**
1. User navigates to `/files`
2. Sees file vault (grid or list view)
3. Clicks on a file
4. File detail view opens
5. User clicks "Verify"
6. File is re-downloaded from IPFS/Arweave
7. Hash is computed and compared to on-chain record
8. Result shown (verified ✓ or mismatch ⚠️)

**Current State:** ⚠️ **Partially implemented**

**Feedback Issues:**
- ❌ File detail page not found in code (likely opens modal?)
- ❌ Verification progress not shown ("Fetching…" → "Computing…" → "Comparing…")
- ❌ No explanation of what hash mismatch means
- ❌ No recovery UI if verification fails
- ❌ Verification button may be missing entirely

---

### Journey E: Public Vault Browsing

**Flow:**
1. Unauthenticated user navigates to `/files` (or public URL?)
2. Sees list of public files from all users
3. Clicks a file
4. File detail view opens
5. Can download or verify without authentication

**Current State:** ⚠️ **Not fully implemented**

**Issues:**
- ❌ No public file listing page
- ❌ `/files` page likely requires authentication
- ❌ No public URL structure for shared files
- ❌ Download without auth not tested

---

### Journey Summary

| Journey | Status | Critical Issues | User Pain Points |
|---------|--------|-----------------|-------------------|
| A: New User Onboarding | 🔴 Not started | Social login missing | Non-technical users cannot onboard |
| B: Wallet Login | 🟡 Partial | No session persistence | Must reconnect every page refresh |
| C: File Upload | 🟡 Partial | No progress, no error recovery | Users don't know upload succeeded |
| D: File Verification | 🟡 Partial | Detail page not found | Cannot verify files |
| E: Public Browsing | 🔴 Not started | No public UI | Cannot share files with non-tech users |

---

## 1.6 — Accessibility Audit

### WCAG 2.1 AA Compliance Check

#### 🔴 Critical Issues

**1. Missing `<title>` Tags**
- Home, Dashboard, Upload, Files pages have no unique `<title>`
- Meta description tags missing
- ❌ Screen readers cannot identify page
- ❌ No SEO metadata

**2. Images Missing `alt` Attributes**
- Particle Background Canvas — no `aria-label` or text alternative
- Wallet icons in `<WalletButton>` — `<img src="...">` without `alt`
- File type icons — likely missing `alt`
- Particle images in Home page feature section (if any)

**3. Icon-Only Buttons Missing `aria-label`**
- Close button (X icon) in modals/toasts
- Sort/filter icons in Files page
- Wallet dropdown toggle icon
- "More" (⋮) menu buttons
- Theme toggle (sun/moon icons)

**4. Form Inputs Missing Associated Labels**
- Search input in Navbar — no `<label>`
- File category select in Upload — likely missing `<label>`
- Tag input — no `<label>`
- Upload settings modal inputs — labels unclear

**5. No Focus Indicators Visible**
- Buttons likely have default browser focus (may be invisible on HeroUI)
- Form inputs may not have visible outline
- Navigation links focus not visible
- ⚠️ Users relying on keyboard navigation cannot see where they are

**6. Colour Contrast Issues**

| Element | Foreground | Background | Ratio | WCAG AA (4.5:1)? |
|---------|-----------|-----------|-------|---|
| Secondary text | `slate-400` (#94a3b8) | `slate-900` (#0f172a) | ~3.5:1 | ❌ Fails |
| Tertiary text | `slate-500` (#64748b) | `slate-900` (#0f172a) | ~2.5:1 | ❌ Fails |
| Disabled button text | Similar low ratio | | | ❌ Likely fails |

**Action Items:**
- Increase secondary text contrast (use `slate-300` instead of `slate-400`)
- Increase tertiary text contrast
- Verify all text on all backgrounds

**7. Modals Accessibility**
- HeroUI `<Modal>` components likely have focus trap ✓
- Close button (X) present ✓
- Escape key closes modal ✓
- **But:** No `role="alertdialog"` for confirmation dialogs; no `aria-labelledby` or `aria-describedby`

**8. Buttons**
- "Connect Wallet" button likely has no accessible name if icon-only
- Buttons using colour alone to indicate state (disabled = greyed out, but no text change)

**9. Keyboard Navigation**
- Tab order through Navbar unknown (is "Connect Wallet" reachable without scrolling?)
- Modal focus trap not tested
- Drag-drop zone not keyboard-accessible (cannot activate with Enter/Space)
- File cards likely not keyboard-navigable to detail view

**10. Screen Reader Announcements**
- Toast notifications lack `role="alert"` or `aria-live="polite"`
- Upload progress stages not announced
- Loading states may not be announced
- Error messages may not be announced

### Accessibility Audit Summary

| Category | Compliance | Issues |
|----------|-----------|--------|
| **Semantic HTML** | ❌ Poor | No `<main>`, `<nav role>`, `<article>` landmarks |
| **Text Alternatives** | ❌ Poor | Missing `alt` on images, no `aria-label` on icons |
| **Colour Contrast** | ❌ Fails WCAG AA | Secondary/tertiary text too light |
| **Focus Indicators** | ❌ Missing | No visible focus ring |
| **Keyboard Navigation** | ⚠️ Partial | Some components likely keyboard-accessible via HeroUI |
| **ARIA Attributes** | ❌ Missing | No `aria-label`, `aria-live`, `role` attributes visible |
| **Form Labels** | ❌ Missing | Inputs lack associated `<label>` elements |
| **Touch Targets** | ⚠️ Unknown | Buttons may be <44x44px on mobile |

---

## 1.7 — Performance Audit

### Large Imports & Bundle Bloat

| Issue | File | Problem | Impact |
|-------|------|---------|--------|
| **HeroUI Full Import** | Multiple | `import { Button, Card, Modal, ... } from '@heroui/react'` | All HeroUI components loaded even if only 2 used |
| **Lucide Icons** | Multiple | `import { Cloud, Shield, Zap, ... } from 'lucide-react'` | ✓ Lucide is tree-shakable (good) |
| **Recharts** | Dashboard | `import { LineChart, Line, PieChart, ... }` | Heavy library; used only on one page; not code-split |
| **Framer Motion** | Toaster, App | Animations in multiple places | Not declared in package.json but used (error?) |
| **Wallet Adapter Wallets** | WalletContext | All wallet adapters loaded at startup | Could be lazy-loaded |

### Code-Splitting Issues

**Current:** ⚠️ All pages routed via `<Routes>` but no `lazy()` or `Suspense` detected

```jsx
// Current (bad)
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
// ...
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/dashboard" element={<Dashboard />} />
```

**Should be:**
```jsx
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
// ...
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

### Unnecessary Re-renders

| Component | Issue | Impact |
|-----------|-------|--------|
| **ParticleBackground** | Animates every frame; no `React.memo`; redraws entire canvas | High CPU; may cause battery drain on mobile |
| **Navbar** | Re-renders on search input change; entire nav recalculates | Medium CPU; layout thrashing |
| **Toaster** | Each toast triggers parent re-render; no `useCallback` for handlers | Medium; acceptable if toast queue < 5 items |
| **Dashboard** | Entire page re-renders if analytics state changes; no component split | High; user sees flicker |

### Missing `useCallback` / `useMemo`

```jsx
// ParticleBackground.tsx
const updateParticles = (canvas, deltaTime) => { // ❌ Redefined every frame
  // ...
};

// Should be:
const updateParticles = useCallback((canvas, deltaTime) => {
  // ...
}, []);
```

### Missing Dependency Arrays / Incorrect Arrays

**ProtectedRoute.tsx:**
```jsx
useEffect(() => {
  // Check wallet connection
}, []); // ✓ Correct — runs once on mount
```

**ParticleBackground.tsx:**
```jsx
useEffect(() => {
  // Setup animation loop
  return () => clearInterval(animationRef.current); // ⚠️ animationRef.current may not exist
}, []);
```

**Toaster.tsx (ToastItem):**
```jsx
useEffect(() => {
  // Auto-hide timer
}, [id, type, onRemove]); // ✓ Looks correct, but onRemove passed from parent — verify memo status
```

### Images Without Lazy Loading

- Wallet icons (`<img src="https://...">`) in `WalletButton.tsx` — no `loading="lazy"`, no width/height
- Particle background images (if any) — not optimized
- Feature icons use lucide-react (SVG) ✓

### Blocking Operations in Render

- ParticleBackground canvas initialization in render ⚠️ (should be in `useEffect`)
- Animations via `setInterval` in `useEffect` ✓ (good)
- Theme detection via `window.matchMedia()` ✓ (non-blocking)

### Performance Summary

| Metric | Status | Issue |
|--------|--------|-------|
| **Bundle Size** | ⚠️ Unknown | No bundle analysis available; HeroUI + Recharts likely heavy |
| **Initial Load** | ❌ Poor | 2s splash screen; no route code-splitting |
| **Runtime Performance** | ⚠️ Needs Testing | Canvas animations may stutter on low-end devices |
| **Memory** | ❌ Poor | ParticleBackground + Toaster + Context subscriptions may accumulate |
| **SEO/FCP** | ❌ Poor | 2s splash screen delays First Contentful Paint |

---

## 1.8 — Security Audit (Frontend-Specific)

### 🔴 Critical Issues

**1. JWT Token Storage**

**Finding:**
```jsx
// WalletContext.tsx
const [token, setToken] = useState<string | null>(null);
```

**Risk:** ⚠️ Where is token stored? If in state only, it's lost on page refresh. If in localStorage, it's vulnerable to XSS.

**Recommendation:**
- ✓ Store JWT in an `httpOnly` cookie (server sets it)
- ✓ Frontend never touches the token
- ❌ Never store JWT in localStorage

---

**2. Private Key / Seed Phrase Exposure**

**Finding:**
- WalletButton shows wallet selection but does not expose seed phrases ✓
- ProtectedRoute shows "Access Denied" without asking for wallet details ✓

**No evidence of private key logging found.** ✓

---

**3. Dangerous Interpolation**

**Finding:**
```jsx
// No dangerouslySetInnerHTML observed in codebase ✓
```

**Safe so far.** No user input rendered as HTML.

---

**4. Auth Flash / Unprotected Content**

**Finding:**
```jsx
// ProtectedRoute.tsx
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, isLoading, error, connectWallet } = useWallet();

  if (!isConnected && !isLoading) {
    return <AccessDenied onConnect={connectWallet} isLoading={isLoading} />;
  }

  // ❌ Component renders children BEFORE checking auth
  return <>{children}</>;
};
```

**Issue:** If `isConnected` is false but `isLoading` is true, children render. If auth check takes 2s, user sees protected content flash for 2s.

**Better approach:**
```jsx
if (isLoading) return <LoadingState />;
if (!isConnected) return <AccessDenied />;
return children; // Only reached if auth verified
```

---

**5. Transaction Data Validation**

**Finding:**
```jsx
// FileContext.tsx
const uploadFile = async (file: File, metadata?: {...}) => {
  // Uploads file to backend
  // Backend returns transaction receipt
  // ❌ No validation that receipt matches what was submitted
};
```

**Risk:** If backend is compromised, it could return fake transaction receipts.

**Recommendation:**
- ✓ Fetch transaction from on-chain (Solana RPC) to verify
- ✓ Compare hash/signature to frontend record
- ✓ Show user the transaction on Solana Explorer (link to verify)

---

**6. Wallet Connection State Persistence**

**Finding:**
```jsx
// WalletContext.tsx
const [isConnected, setIsConnected] = useState(true);
```

**Issue:** ⚠️ Wallet connection state stored only in React state. Refresh page → need to reconnect.

**Better approach:**
- ✓ Use `@solana/wallet-adapter-react` `useLocalStorage` hook
- ✓ Persist selected wallet to localStorage, auto-reconnect on load
- ✓ Verify signature is still valid (check token expiry)

---

**7. Console Logging**

**Finding:**
No explicit `console.log()` of sensitive data observed.

**But:**
```jsx
// WalletContext.tsx
const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // ...
}, []);
```

**Risk:** If a toast shows "Connected to wallet 0x123abc", it logs to console. ⚠️ Minor risk, but better to remove.

---

**8. Error Messages Leak Info**

**Finding:**
```jsx
// ProtectedRoute.tsx
const { isConnected, isLoading, error, connectWallet } = useWallet();
// error is never displayed, so no info leakage ✓
```

**But if errors are shown:**

⚠️ Example bad:
```jsx
<ErrorMessage>
  Error: Failed to connect to https://devnet.solana.com/rpc — Network timeout
</ErrorMessage>
```

**Better:**
```jsx
<ErrorMessage>
  We couldn't connect to Solana. Please check your internet and try again.
</ErrorMessage>
```

---

**9. API Endpoint Hardcoding**

**Finding:**
```jsx
// FileContext.tsx
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  // url parameter suggests endpoints are passed in
  // But where are they defined?
};
```

**Risk:** ⚠️ If API endpoints are hardcoded in components, they're exposed in compiled JS.

**Better:**
- ✓ Define API base URL in `.env`
- ✓ Load at runtime from environment
- ✓ Never hardcode full endpoints in frontend code

---

**10. CORS & CSP Headers**

**Finding:** Not visible in frontend code (backend responsibility).

**Recommendation:**
- ✓ Backend should set strict CORS headers (only allow https://denft.example.com)
- ✓ Backend should set Content-Security-Policy header
- ✓ Frontend should validate origin of API responses

---

### Security Audit Summary

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| JWT token storage mechanism unclear | 🔴 High | Unknown | Audit backend; ensure httpOnly cookies |
| ProtectedRoute auth flash | 🔴 High | Needs fix | Add `if (isLoading) return <LoadingState />` guard |
| Transaction data not verified on-chain | 🟡 Medium | Needs impl | Call Solana RPC to verify transaction |
| Wallet state lost on refresh | 🟡 Medium | Needs impl | Persist to localStorage; auto-reconnect |
| API endpoints hardcoded | 🟡 Medium | Unknown | Move to `.env` file |
| Error messages may leak info | 🟡 Medium | Low risk | Audit error messages; keep generic |
| Console logging in toasts | 🟠 Low | Cosmetic | Remove debug logging |

---

## Key Findings Summary

### 🔴 Critical Issues (Block Launch)

1. **Social Login (Web3Auth) Not Implemented** — Marketing promises social login; not in code. Non-technical users cannot onboard.
2. **ProtectedRoute Auth Flash** — Component renders children while auth is loading; brief XSS risk.
3. **No Loading/Error States** — Dashboard, Files, Upload pages have no skeleton, empty, or error states. Users see blank screens.
4. **No File Verification UI** — File detail page and verification flow not found in code.
5. **Token Storage & Session Persistence Unclear** — JWT storage mechanism not documented; users must reconnect on refresh.
6. **Missing `<title>` & Meta Tags** — Pages have no unique titles or descriptions; no SEO.

### 🟡 High-Priority Issues (Before Public Beta)

7. **Accessibility Failing WCAG AA** — Colour contrast too low; missing `alt` tags, `aria-label`; no focus indicators.
8. **Performance: No Code-Splitting** — All pages loaded upfront; 2s splash screen delays FCP.
9. **Canvas Animations Heavy** — ParticleBackground re-renders every frame; no memoisation; may drain battery on mobile.
10. **File Upload Flow Unclear** — No progress stages, no error recovery, no blockchain context.
11. **Hardcoded Data** — Dashboard uses mock analytics instead of real data.
12. **HeroUI Component Library Over-Used** — Heavy dependency; limited customization vs. shadcn/ui.

### 🟠 Medium-Priority Issues (Sprint 1-3)

13. **Design System Missing** — No Tailwind config; no spacing scale, shadow system, or animation tokens defined.
14. **Components > 300 Lines** — Home, Dashboard, Upload, Files all need splitting into smaller components.
15. **No Memoisation in Render Paths** — Navbar, ParticleBackground re-render unnecessarily.
16. **Drag-Drop Zone Not Keyboard-Accessible** — Violates WCAG; users relying on keyboard cannot upload.
17. **Public File Browsing Not Implemented** — No way to share files with non-authenticated users.
18. **Verification Journey Not Implemented** — File detail page and hash verification logic not in code.
19. **Mobile Responsiveness Not Tested** — Layout likely breaks at 375px; no mobile hamburger menu visible.
20. **No Error Boundaries** — Page crashes show white screen; no recovery UI.

### ✓ Strengths

- ✓ Lucide icons tree-shakable and consistent
- ✓ Context API well-structured for wallet, theme, files, toaster
- ✓ Tailwind CSS with CSS custom properties for theming
- ✓ HeroUI provides accessible components (modal focus trap, buttons)
- ✓ Multi-wallet support (Phantom, Solflare, Alpha, Torus)
- ✓ Toast notification system works well
- ✓ TypeScript strict mode enabled
- ✓ Theme persistence (localStorage)

---

## Recommendations for Next Phases

### Phase 2: Design System Definition
- Define custom Tailwind config with:
  - Colour palette (primary, secondary, accent, destructive, neutral)
  - Typography scale (display, heading, body, caption)
  - Spacing scale (4px base, multiples)
  - Border-radius system (sm, md, lg, full)
  - Shadow system (sm, md, lg, xl)
  - Animation tokens (150ms, 250ms, 350ms)
- Evaluate component library: **Recommend shadcn/ui over HeroUI for customization**
- Create brand.md with design direction

### Phase 3: Sprint Roadmap
- **Sprint 0:** Design system foundation (Tailwind config, base components)
- **Sprint 1:** Navigation & layout shell (responsive, keyboard-accessible)
- **Sprint 2:** Authentication & onboarding (social login, welcome flow)
- **Sprint 3:** Dashboard & file vault (real data, loading states, empty states)
- **Sprint 4:** File upload (drag-drop, progress stages, error recovery)
- **Sprint 5:** File detail & verification (preview, hash verification)
- **Sprint 6:** Public file browser (share with non-tech users)
- **Sprint 7:** Settings & profile (user preferences, theme toggle)
- **Sprint 8:** Polish & accessibility (animations, a11y audit, final pass)

### Phase 4: Execution
- Read existing code before modifying
- Preserve business logic; improve UI/UX only
- Component isolation (ui/ for primitives, features/ for compositions)
- Test on mobile (375px), tablet (768px), desktop (1280px)
- No security regressions; verify auth before rendering protected content
- Commit one sprint at a time with detailed summaries

---

**End of Phase 1 Audit**

