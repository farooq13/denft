use anchor_lang::prelude::*;

use crate::{MAX_IPFS_HASH_LENGTH, MAX_CONTENT_TYPE_LENGTH, MAX_DESCRIPTION_LENGTH};

#[account]
#[derive(InitSpace)]
pub struct FileRecord {
  pub owner: Pubkey,               // Owner of the file
  pub file_hash: [u8; 32],         // SHA-256 hash of the file content
  pub ipfs_hash: String,           // IPFS content identifier  (4 + MAX_IPFS_LENGTH bytes)
  pub encrypted_metadata: String,  // Encrypted metadata (4 + dynamic size)
  pub file_size: u64,              // Original file size in bytes
  pub content_type: String,        // MIME content type (4 + MAX_CONTENT_TYPE_LENGTH bytes)
  pub description: String,
  pub timestamp: i64,              // Upload timestamp
  pub is_public_verification: bool, // Allow public verification
  pub access_count: u64,             // Number of times accessed
  pub download_count: u64,          // Number of times downloaded
  pub is_active: bool,              // File active status
  pub deleted_at: Option<i64>,
  pub verification_id: u64,          // Unique verification ID
  pub reserved: [u8; 32],           // Reserved for future use
  
} 


impl<'info> FileRecord<info> {
  pub const BASE_LEN: usize = 8 +
  32 + // owne
  32 + // file_hash
  4 +  // ipfs_hash length prefix
  4 +  // encrypted_metadata length prefix
  8 +  // file_size
  4 +  // content_type length prefix
  4 +  // description length prefix
  8 +  // timestamp
  1 +  // is_public_verification
  8 +  // access_count
  8 +  // download_count
  1 +  // is_active
  9 +  // deleted_at (Option<i64>)
  8 +  // verification_id
  32;  // reserved space

  pub fn space_required(metadata_len: usize) -> usize {
    self::BASE_LEN +
    MAX_IPFS_HASH_LENGTH +
    metadata_len +
    MAX_CONTENT_TYPE_LENGTH +
    MAX_DESCRIPTION_LENGTH
  }

  pub fn is_accessible(&self) -> bool {
    self.is_active
  }

  pub fn increment_access(&mut self) {
    self.access_count += 1;
  }

  pub fn increment_download(&mut self) {
    self.download_count += 1;
  }

  pub fn verify_hash(&self, provided_hash: &[u8; 32]) -> bool  {
    self.file_hash == *provided_hash
  }

  pub fn mark_deleted(&mut self, timestamp: i64) {
    self.is_active = false;
    self.deleted_at = Some(timestamp);
  }
}