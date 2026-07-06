# Denft Backend Execution Guidelines

This document outlines the systematic, sprint-by-sprint approach for building the backend infrastructure for the **Denft** Web3 application. The architecture prioritizes **Security**, **Performance**, **Maintainability**, and **Professionalism**.

---

## 🏗 Architecture Overview

- **Framework:** Node.js with Express (or NestJS for stricter architecture).
- **Database:** PostgreSQL (relational metadata, user profiles) mapped with Prisma ORM.
- **Caching & Rate Limiting:** Redis.
- **Blockchain:** `@solana/web3.js` for on-chain state verification and transaction building.
- **Storage:** IPFS integration via Pinata SDK for permanent file storage.

---

## 🏃 Sprint 1 — Foundation & Web3 Authentication
**Focus:** Establishing the server skeleton, database schema, and secure Web3 wallet authentication.

**Deliverables:**
1. Initialized repository with TypeScript, ESLint, Prettier, and Docker Compose (DB + Redis).
2. Database schemas setup (User, File, Session).
3. **Wallet Authentication Flow:** Implement Sign-In with Solana (SIWS) to prove wallet ownership via cryptographic signatures.
4. **JWT Security:** Issue short-lived access tokens and httpOnly, secure, SameSite refresh tokens.
5. Global Error Handling middleware and structured Logger (e.g., Winston/Pino).

**Acceptance Criteria:**
- Wallet signatures are successfully verified server-side.
- Tokens cannot be accessed via client-side JavaScript (XSS protected).
- Rate limiters implemented on the auth endpoints to prevent brute forcing.

---

## 🏃 Sprint 2 — IPFS Storage & File Management
**Focus:** Handling file streams securely and bridging the gap between Web2 storage and Web3 IPFS.

**Deliverables:**
1. **Upload Pipeline:** Secure multipart form handling (Multer) with strict file size and MIME-type validation.
2. **IPFS Integration:** Integration with Pinata to pin files, generate CIDs, and map them to the `File` DB schema.
3. **Metadata Storage:** Store file names, tags, categories, sizes, and privacy states (Public/Private).
4. **File Retrieval Endpoint:** Secure file streaming from IPFS to the client, restricted by JWT ownership (for private files).
5. **Soft/Hard Delete APIs:** Unpinning from Pinata and removing database records.

**Acceptance Criteria:**
- Files stream efficiently without blowing up server RAM (chunking).
- Users can only fetch and decrypt their own private files.
- Storage metrics (total size used per wallet) are accurately tracked.

---

## 🏃 Sprint 3 — Blockchain Sync & Verification
**Focus:** Synchronizing off-chain database state with the on-chain Solana ledger.

**Deliverables:**
1. **Verification Endpoints:** APIs that cross-reference off-chain CIDs and Metadata with on-chain Solana smart contract data.
2. **Blockchain Indexing/Listeners:** Background cron jobs or WebSocket listeners tracking Solana events to automatically confirm when a file is successfully anchored.
3. **Optimistic UI Support:** Endpoints that allow the frontend to mark a file as "Pending Confirmation" while waiting for the Solana network.

**Acceptance Criteria:**
- Verification endpoint accurately flags mismatches between the DB and the blockchain.
- Backend gracefully handles RPC rate limits and fallbacks.

---

## 🏃 Sprint 4 — Dashboard, Vault, & Public APIs
**Focus:** Building high-performance, read-heavy APIs to power the Dashboard and Explore pages.

**Deliverables:**
1. **Paginated Vault API:** Endpoints supporting complex filtering (tags, categories), sorting, and cursor-based pagination.
2. **Dashboard Analytics API:** Aggregated stats (total views, storage breakdown by category, upload history).
3. **Public Explore API:** A completely unauthenticated endpoint returning files marked as `isPublic: true`.
4. **View/Download Tracking:** Logic to safely increment `accessCount` and `downloadCount` without database race conditions.

**Acceptance Criteria:**
- Database indexes are applied to `uploadedAt`, `walletAddress`, and `isPublic` for sub-100ms response times.
- Dashboard analytics queries are cached in Redis to prevent DB strain.

---

## 🏃 Sprint 5 — Bulk Operations & User Settings
**Focus:** Empowering the user with profile settings and mass-management tools.

**Deliverables:**
1. **Bulk Operations API:** Support for bulk delete, bulk visibility toggling (public/private), and bulk favoriting.
2. **Settings API:** Endpoints to store user preferences (View mode, Themes) and profile avatars.
3. **"Danger Zone" Logic:** Specialized highly-destructive endpoint requiring secondary signature verification before wiping a user's entire vault.

**Acceptance Criteria:**
- Bulk operations run in transactions (all-or-nothing completion).
- Danger Zone actions leave an immutable audit trail.

---

## 🏃 Sprint 6 — Security, Polish & Deployment
**Focus:** Final hardening, performance tuning, and preparing for production deployment.

**Deliverables:**
1. **Security Audit:** Integration of `helmet` for HTTP headers, CORS whitelisting, and strict Content Security Policies.
2. **Load Testing:** Reviewing database query plans and testing connection pooling under high load (Artillery/K6).
3. **CI/CD Pipeline:** GitHub Actions for automated unit/integration testing and building Docker images.
4. **Health Checks & Monitoring:** Implement `/health` endpoints and integrate APM (Application Performance Monitoring) like Datadog or Sentry.

**Acceptance Criteria:**
- Express app passes automated vulnerability scanning (e.g. `npm audit`, Snyk).
- Server cluster efficiently uses all CPU cores via PM2 or Kubernetes.
- 99% of API requests resolve in under 200ms.
