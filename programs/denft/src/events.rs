use anchor_lang::prelude::*;

use crate::state::access_permission::AccessType;

// Events for indexing and monitoring
#[event]
pub struct UserInitialized {
    pub user: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FileUploaded {
    pub file_id: Pubkey,
    pub owner: Pubkey,
    pub file_hash: [u8; 32],
    pub ipfs_hash: String,
    pub file_size: u64,
    pub timestamp: i64,
    pub verification_id: u64,
}

#[event]
pub struct AccessGranted {
    pub file_id: Pubkey,
    pub owner: Pubkey,
    pub accessor: Pubkey,
    pub permissions: u8,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
}

#[event]
pub struct AccessRevoked {
    pub file_id: Pubkey,
    pub owner: Pubkey,
    pub accessor: Pubkey,
    pub revoked_at: i64,
}

#[event]
pub struct FileVerified {
    pub file_id: Pubkey,
    pub verifier: Pubkey,
    pub file_hash: [u8; 32],
    pub verified_at: i64,
    pub original_timestamp: i64,
    pub verification_id: u64,
}



#[event]
pub struct FileAccessed {
    pub file_id: Pubkey,
    pub accessor: Pubkey,
    pub access_type: AccessType,
    pub timestamp: i64,
}

#[event]
pub struct FileDeleted {
    pub file_id: Pubkey,
    pub owner: Pubkey,
    pub deleted_at: i64,
}

#[event]
pub struct FilePublicityUpdated {
    pub file_id: Pubkey,
    pub owner: Pubkey,
    pub is_public: bool,
    pub updated_at: i64,
}