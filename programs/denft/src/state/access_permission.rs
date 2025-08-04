use anchor_lang::prelude::*;


#[account]
pub struct AccessPermission {
  pub file_record: Pubkey,      // The file record this permission applied to
  pub accessor: Pubkey,         // User who has access
  pub permissions: u8,           // Permission bitflags (read=1, download=2, share=4)
  pub granted_at: i64,
  pub expires_at: Option<i64>,
  pub max_downloads: Option<u64>,
  pub used_downloads: u32,
  pub granted_by: Pubkey,         // Who granted the access
  pub is_active: bool,            // Access status
  pub revoked_at: Option<i64>,   // When access was revoked (lptional)
  pub reserved: [u8; 16],         // Reserved space for future features
}