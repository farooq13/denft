use anchor_lang::prelude::*;


#[account]
pub struct FileRecord {
  pub owner: Pubkey,               // Owner of the file
  pub file_hash: [u8; 32],         // SHA-256 hash of the file content
  pub ipfs_hash: String,           // IPFS content identifier  (4 + MAX_IPFS_LENGTH bytes)
  pub encrypted_metadata: String,  // Encrypted metadata (4 + dynamic size)
  pub file_size: u64,              // Original file size in bytes
  pub content_type: String,        // MIME content type (4 + MAX_CONTENT_TYPE_LENGTH bytes)
  pub description: String,
  pub timestamp: i64,              // Uplad timestamp
  pub is_public_verification: bool, // Allow public verification
  pub access_count: u64,             // Number of times accessed
  pub download_count: u64,          // Number of times downloaded
  pub is_active: bool,              // File active status
  pub deleted_at: Option<i64>,
  pub verification_id: u64,          // Unique verification ID
  pub reserved: [u8; 32],           // Reserved for future use
  
} 