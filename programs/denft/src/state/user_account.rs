use anchor_lang::prelude::*;


#[account]
pub struct UserAccount {
    pub owner: Pubkey,       // Account owner
    pub file_count: u32,     // Number of files uploaded (4 bytes)
    pub storage_used: u64,   // Total storage used in bytes (8 bytes)
    pub storage_limit: u64,  // Storage limit in bytes (8 bytes)
    pub file_limit: u32,     // Maximut number of files allowed (4 bytes)
    pub created_at: i64,     // Account creation timestamp
    pub is_active: bool,     // Account status
    pub reserved: [u8; 64],  // Reserved space for future features (64 bytes)
}