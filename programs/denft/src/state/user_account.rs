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

impl UserAccount {
    pub const LEN: usize = 8 + // discriminator
        32 +    // owner (Pubkey)
        4 +     // file_count (u32)
        8 +     // storage_used (u64)
        8 +     // storage_limit (u64)
        4 +     // file_limit (u32)
        8 +     // created_at (i64)
        1 +     // is_active (bool)
        64;    // reserved space (64 bytes)


        pub fn can_add_file(&self, file_size: u64) -> bool {
            self.is_active &&
            self.file_count < self.file_limit &&
            self.storage_used + file_size <= self.storage_limit
        }

        pub fn add_file(&mut self, file_size: u64) {
            self.file_count += 1;
            self.storage_used += file_size;
        }

        pub fn remove_file(&mut self, file_size: u64) {
            self.file_count = self.file_count.saturating_sub(1);
            self.storage_used = self.storage_used.saturating_sub(file_size);
        }
}

