use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

// Permission bitflags
pub const PERMISSION_READ: u8 = 1;
pub const PERMISSION_DOWNLOAD: u8 = 2;
pub const PERMISSION_SHARE: u8 = 4;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum AccessType {
    Read,
    Download,
    Share,
}

impl AccessType {
    pub fn from_flag(flag: u8) -> Option<Self> {
        match flag {
            1 => Some(AccessType::Read),
            2 => Some(AccessType::Download),
            4 => Some(AccessType::Share),
            _ => None,
        }
    }
}

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
    pub revoked_at: Option<i64>,   // When access was revoked (optional)
    pub reserved: [u8; 16],         // Reserved space for future features
}

impl AccessPermission {
    pub const LEN: usize = 8 +
        32 +  // file_record
        32 +  // accessor
        1 +   // permissions
        8 +   // granted_at
        9 +   // expires_at (Option<i64>)
        9 +   // max_downloads (Option<u64>) - Fixed: was 5, should be 9
        4 +   // used_downloads
        32 +  // granted_by
        1 +   // is_active
        9 +   // revoked_at (Option<i64>)
        16;   // reserved space

    pub fn is_valid(&self) -> bool {
        let current_timestamp = Clock::get().unwrap().unix_timestamp;
        self.is_active &&
        self.expires_at.map_or(true, |exp| current_timestamp <= exp)
    }

    pub fn has_permission(&self, permission: u8) -> bool {
        (self.permissions & permission) != 0
    }

    pub fn can_download(&self) -> bool {
        self.has_permission(PERMISSION_DOWNLOAD) &&
        self.max_downloads.map_or(true, |max| (self.used_downloads as u64) < max)
    }

    pub fn consume_download(&mut self) -> Result<()> {
        if let Some(max) = self.max_downloads {
            require!((self.used_downloads as u64) < max, crate::DenftError::DownloadLimitExceeded);
        }
        self.used_downloads += 1;
        Ok(())
    }

    pub fn revoke(&mut self, timestamp: i64) {
        self.is_active = false;
        self.revoked_at = Some(timestamp);
    }

    pub fn is_valid_permission(permissions: u8) -> bool {
        permissions > 0 && permissions <= 7 // 1 + 2 + 4 = 7 (read + download + share)
    }
}