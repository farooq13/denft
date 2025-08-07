# Denft
> **Decentralized, Privacy-First Cloud Storage with Blockchain Verification**


## Overview

Denft is a decentralized cloud storage platform that combines the familiar user experience of traditional cloud services with the security, ownership, and verification benefits of Web3 technology. Store, verify, and share your important documents with cryptographic proof of authenticity while maintaining complete control over your data.


### Key Features

- **True Ownership**: Your files, your keys, your control
- **Temper-Proof Verification**: Blockchain-based file integrity checking
- **Decentralized Storage**: Files distributed across IPFS network
- **Granular Access Control**: Time-limited, permission-based sharing
- **Familiar Interface**: Drag-and-drop UX with folder organization
- **Flexible Authentication**: Email signup or crypto wallet connection
- **Original Format Preservation**: Download files exactly as uploaded


### Target Users
- **Web3 Developers**: Secure storage for documentation, and project files
- **DAOs**: Governance documents, proposals, and transparent record-keeping
- **Privacy-Concious Professionals**: Sensitive documents requiring verification


### Secondary Markets
- **Legal Professionals**: Contract storage with timestamp verification
- **Freelancers**: Secure client document management
- **Content Creators**: Verifiable ownership of digital works
- **Researchers**: Immutable research data and publications


### Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Blockchain**: Solana + Anchor Framework
- **Storage**: IPFS + Pinnata (pinning service)
- **Authentication**: Web3Auth + Solana Wallet Adapter
- **Encryption**: AES-256-GCM + TweetNaCl



### Core Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   API Backend   │    │ Solana Program  │
│                 │◄──►│                 │◄──►│                 │
│ • File Upload   │    │ • Authentication│    │ • File Records  │
│ • Verification  │    │ • Encryption    │    │ • Access Control│
│ • Access Mgmt   │    │ • IPFS Gateway  │    │ • Verification  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                          ┌─────────────────┐
                          │ IPFS Network    │
                          │                 │
                          │ • File Storage  │
                          │ • Distributed   │
                          │ • Content Hash  │
                          └─────────────────┘
```



## File Structure
```
src/
├── lib.rs                          # Main program entry point
├── errors.rs                       # Error definitions
├── state/
│   ├── mod.rs                      # State module exports
│   ├── user_account.rs             # UserAccount state and methods
│   ├── file_record.rs              # FileRecord state and methods
│   └── access_permission.rs        # AccessPermission state and methods
├── context/
│   ├── mod.rs                      # Context module exports
│   ├── initialize_user.rs          # InitializeUser context
│   ├── upload_file.rs              # UploadFile context
│   ├── grant_access.rs             # GrantAccess context
│   ├── revoke_access.rs            # RevokeAccess context
│   ├── verify_file.rs              # VerifyFile context
│   ├── record_file_access.rs       # RecordFileAccess context
│   ├── delete_file.rs              # DeleteFile context
│   └── update_file_publicity.rs    # UpdateFilePublicity context
└── handlers/
    ├── initialize_user_handler.rs          # Initialize user handler
    ├── upload_file_handler.rs              # Upload file handler
    ├── grant_access_handler.rs             # Grant access handler
    ├── revoke_access_handler.rs            # Revoke access handler
    ├── verify_file_handler.rs              # Verify file handler
    ├── record_file_access_handler.rs       # Record file access handler
    ├── delete_file_handler.rs              # Delete file handler
    └── update_file_publicity_handler.rs    # Update file publicity handler
```