use anchor_lang::prelude::*;


#[constant]
// Maximum limits for MVP
pub const MAX_FILES_PER_USER: u32 = 100;
pub const MAX_STORAGE_PER_USER: u64 = 1024 * 1024 * 1024; // 1GB
pub const MAX_SHARED_USERS_PER_FILE: u8 = 10;
pub const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024; // 10MB
pub const MAX_DESCRIPTION_LENGTH: usize = 500;
pub const MAX_IPFS_HASH_LENGTH: usize = 100;
pub const MAX_CONTENT_TYPE_LENGTH: usize = 100;