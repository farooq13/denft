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
