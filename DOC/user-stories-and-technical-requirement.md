# Denft User Stories & Technical Requirements

## Table of Contents

- [User Mapping & Prioritization](#user-mapping--prioritization)
- [Simplified User Stories](#simplified-user-stories)
- [Technical Architecture](#technical-architecture)
- [Implementation Roadmap](#implementation-roadmap)
- [AI Critique Analysis](#ai-critique-analysis)
- [On-Chain Requirements](#on-chain-requirements)

## User Mapping & Prioritization

### Direct Users (Day-to-Day Interaction)
1. **Web3 developers** ⭐ *Priority 1*
2. **DAO contributors** ⭐ *Priority 1*
3. **Freelancers and remote workers** ⭐ *Priority 2*
4. **Legal professionals** (lawyers, notaries)
5. **Financial consultants/accountants**
6. **Content creators** (writers, designers, musicians)
7. **Students and researchers**
8. **Credentialing platforms and institutions**
9. **Activists and journalists**
10. **Digital nomads and global citizens**

### Indirect Users / Beneficiaries
- Recruiters and hiring managers
- Clients of freelancers
- DAO members and voters
- Credential verifiers
- Content consumers

### Key User Selection Rationale

**✅ Web3 Developers**
- Early adopters familiar with wallet-based workflows
- Fastest to understand upload → verify → retrieve flow
- Highly vocal and can amplify through open-source communities

**✅ DAO Contributors**
- Need secure, verifiable document sharing for governance
- Compelling use case for early product validation
- Aligned with decentralization values

**⏳ Freelancers / Remote Workers**
- Deferred to Phase 2 - require smoother UX
- Strong use case but higher adoption barriers initially

## Simplified User Stories

### Epic 1: Getting Started & Account Creation

#### US1.1: Create Account with Email
**As a** professional who doesn't use cryptocurrency  
**I want to** sign up with my email address  
**So that** I can start using the platform immediately

**What happens:**
- User enters email and password
- System creates account automatically
- User receives confirmation email
- Account is ready to use

#### US1.2: Upload First Document
**As a** new user who just created an account  
**I want to** upload my first document  
**So that** I can store it securely

**What happens:**
- User clicks "Upload" button
- User selects file from computer (max 10MB)
- File uploads and gets secured automatically
- User sees confirmation that upload succeeded

#### US1.3: Connect Existing Crypto Wallet
**As a** someone who already uses crypto wallets  
**I want to** connect my existing wallet instead of email signup  
**So that** I can use my preferred wallet

**What happens:**
- User clicks "Connect Wallet"
- Wallet browser extension opens
- User approves connection
- Account is created and ready to use

### Epic 2: Uploading and Managing Files

#### US2.1: Select File to Upload
**As a** user with an account  
**I want to** choose a file from my computer  
**So that** I can prepare it for secure storage

**What happens:**
- User clicks "Upload" or drags file to upload area
- File browser opens or drag-and-drop activates
- User selects one file
- File appears ready for upload

#### US2.2: Add File Description
**As a** user about to upload a file  
**I want to** add a description or notes  
**So that** I can remember what this file contains later

**What happens:**
- User types description in text box
- User adds optional category tags
- System saves this information with file
- Description appears with file in user's file list

#### US2.3: Complete File Upload
**As a** user who selected a file  
**I want to** finish uploading it  
**So that** it gets stored securely

**What happens:**
- User clicks "Upload" button
- File gets encrypted and stored
- System generates unique verification code
- User sees success message with verification code

### Epic 3: Sharing Files with Others

#### US3.1: Share File with Someone
**As a** user who owns a file  
**I want to** give someone else access to view it  
**So that** they can see my document

**What happens:**
- User clicks "Share" next to their file
- User enters recipient's email address or wallet address
- User clicks "Send Access"
- Recipient receives notification they can access the file

#### US3.2: Set Access Permissions
**As a** file owner preparing to share  
**I want to** control what the recipient can do  
**So that** I maintain appropriate control over my file

**What happens:**
- User sees checkboxes for "Can View" and "Can Download"
- User selects desired permissions
- User sets how long access should last
- System applies these rules to the shared access

#### US3.3: Remove Someone's Access
**As a** file owner  
**I want to** stop someone from accessing my file  
**So that** they can no longer view or download it

**What happens:**
- User views list of people who have access
- User clicks "Remove Access" next to person's name
- System immediately blocks that person's access
- Person can no longer open the file

### Epic 4: Verifying File Authenticity

#### US4.1: Check if Document is Authentic
**As a** someone who received a document  
**I want to** verify it hasn't been changed  
**So that** I can trust the document is original

**What happens:**
- User uploads the document to verification page
- User enters verification code (if they have one)
- System checks document against original
- User sees "Authentic" or "Modified" result

#### US4.2: Get Verification Certificate
**As a** user who verified a document  
**I want to** download proof of verification  
**So that** I can show others the document is authentic

**What happens:**
- User clicks "Download Certificate" after verification
- System generates official verification document
- Certificate downloads to user's computer
- Certificate shows verification date and results

#### US4.3: Verify Multiple Documents at Once
**As a** compliance officer  
**I want to** check multiple documents for authenticity  
**So that** I can audit many files efficiently

**What happens:**
- User selects multiple files from their computer
- User clicks "Verify All"
- System checks each document
- User sees results list showing which files passed/failed

### Epic 5: Managing Files and Access

#### US5.1: View My Uploaded Files
**As a** user with files in the system  
**I want to** see all my uploaded documents  
**So that** I can find and manage them

#### US5.2: View Files Shared with Me
**As a** user who received shared access  
**I want to** see files others shared with me  
**So that** I can access documents I'm allowed to view

#### US5.3: See Who Accessed My File
**As a** file owner  
**I want to** see who looked at my document  
**So that** I can track who viewed my files

#### US5.4: Download My File
**As a** file owner or someone with download permission  
**I want to** download a copy of the document  
**So that** I can have it on my computer

#### US5.5: Delete My File
**As a** file owner  
**I want to** permanently remove a document  
**So that** it's no longer stored in the system

## Technical Architecture

### API Endpoints

```typescript
interface DenftAPI {
    // Authentication
    POST /api/auth/email-signup
    POST /api/auth/wallet-connect
    
    // File operations
    POST /api/files/upload
    GET /api/files/:fileId
    GET /api/files/:fileId/download
    DELETE /api/files/:fileId
    
    // Verification
    POST /api/verify/file
    POST /api/verify/batch
    GET /api/verify/:fileId/certificate
    
    // Access control
    POST /api/files/:fileId/share
    DELETE /api/files/:fileId/access/:wallet
    GET /api/files/:fileId/access-logs
    
    // User management
    GET /api/users/files
    GET /api/users/shared-with-me
    GET /api/users/storage-stats
}
```

### MVP Technical Constraints

```javascript
const MVP_CONSTRAINTS = {
    // File limitations
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png"
    ],
    
    // User limitations
    maxFilesPerUser: 100,
    maxStoragePerUser: 1024 * 1024 * 1024, // 1GB
    maxSharedUsersPerFile: 10,
    
    // Performance targets
    uploadTimeout: 60000,        // 60 seconds
    verificationTimeout: 3000,   // 3 seconds
    maxConcurrentUploads: 3,
    
    // Infrastructure
    network: "solana-devnet",
    ipfsPinningService: "pinata",
    encryptionLibrary: "tweetnacl",
    walletSupport: ["phantom", "solflare", "web3auth"]
};
```

## Implementation Roadmap

### Phase 1: Core MVP (4-6 weeks)
- ✅ Email signup with custodial wallet generation
- ✅ Basic file upload (PDF, DOCX, images)
- ✅ Simple verification system
- ✅ Web3Auth integration
- ✅ Basic sharing (wallet address only)

### Phase 2: Enhanced UX (3-4 weeks)
- ✅ Drag-and-drop interface
- ✅ File management dashboard
- ✅ Access control with time limits
- ✅ Wallet connection upgrade flow
- ✅ Basic analytics

### Phase 3: Production Ready (4-5 weeks)
- ✅ Advanced error handling
- ✅ Performance optimization
- ✅ Security audit
- ✅ Monitoring & alerting
- ✅ User onboarding flow

### Phase 4: Scale Features (Ongoing)
- ✅ Batch operations
- ✅ Advanced search
- ✅ API for developers
- ✅ Mobile app
- ✅ Enterprise features

## AI Critique Analysis

### Major Issues Identified

#### 1. Insufficient Technical Granularity
**Problem:** Requirements were conceptual rather than implementable
- Smart contract functions mentioned without data structure definitions
- API functionality described without endpoint specifications
- Technical architecture outlined without concrete implementation details

**Resolution:** Added complete struct definitions, API contracts, and implementation details

#### 2. Key Management Strategy Unclear
**Problem:** Encryption and access control mechanisms were under-specified
- Key derivation process not detailed
- Access revocation mechanics undefined
- Multi-user sharing encryption strategy missing

**Resolution:** Implemented multi-tier key management with clear derivation strategies

#### 3. "Original Format Preservation" Under-Specified
**Problem:** Core value proposition technically vague
- No specification of supported file types
- Format corruption prevention undefined
- Metadata preservation strategy missing

**Resolution:** Defined specific file format support and preservation mechanisms

### Refinement Impact

| Area | Before | After | Impact |
|------|--------|-------|--------|
| **User Stories** | 6 complex, overlapping stories | 15 atomic, clear stories | Better sprint planning |
| **Technical Spec** | High-level concepts | Implementation-ready details | Accurate estimation |
| **Error Handling** | Not addressed | Comprehensive strategy | Production readiness |
| **Performance** | No targets | Specific metrics | Measurable success |

## On-Chain Requirements

### Core Blockchain Operations

#### Account Management
- User account PDAs with profile and settings data
- File registry accounts linking users to their files
- Storage quota tracking and enforcement
- User authentication and permission validation

#### File Record Management
- FileRecord PDAs for each uploaded file
- File metadata storage and retrieval
- File status tracking (pending, active, deleted)
- Version control for file updates

#### Access Control System
- AccessPermission accounts for shared file access
- Permission bitmap storage (read, download, share flags)
- Time-based access expiration handling
- Access revocation and cleanup mechanisms

#### Audit and Verification
- Event logging for all file operations
- Verification proof generation and storage
- Access attempt tracking and reporting
- Compliance and audit trail maintenance

### Security Requirements
- Key derivation and management for file encryption
- Signature verification for user authentication
- Tamper detection and file integrity checking
- Secure metadata storage and retrieval

## Next Steps

1. **Validate Technical Approach**
   - Review encryption strategy with security experts
   - Test key management implementation
   - Validate smart contract architecture

2. **Set Up Development Environment**
   - Configure Solana devnet
   - Set up IPFS testnet
   - Initialize development tools

3. **Create Technical Prototypes**
   - Test wallet generation and file encryption
   - Prototype smart contract interactions
   - Validate API endpoints

4. **User Testing Plan**
   - Recruit Web3 and non-Web3 users for feedback
   - Design testing scenarios
   - Establish feedback collection mechanisms

5. **Resource Planning**
   - Estimate development time and infrastructure costs
   - Plan team scaling requirements
   - Budget for security audits and testing

---

**Note:** This specification provides the technical granularity needed for implementation while maintaining alignment with the core value proposition of making decentralized storage accessible and trustworthy.