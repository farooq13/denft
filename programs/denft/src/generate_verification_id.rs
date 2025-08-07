use anchor_lang::prelude::*;

/// Generate a unique verification ID from file hash and timestamp
pub fn generate_verification_id(file_hash: &[u8; 32], timestamp: &i64) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    file_hash.hash(&mut hasher);
    timestamp.hash(&mut hasher);
    hasher.finish()
}