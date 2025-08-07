#![allow(unexpected_cfgs, deprecated)]
use anchor_lang::prelude::*;


pub mod context;
pub mod state;
pub mod errors;
pub mod handlers;
pub mod events;
pub mod generate_verification_id;

pub use context::*;
pub use state::*;
pub use errors::*;
pub use handlers::*;
pub use events::*;
pub use generate_verification_id::*;

declare_id!("5KNDVsCpPfkjiD4sYiDfMYRC7rH4DCXmboorZZ8NExBt");

#[program]
pub mod denft {
    use super::*;

     pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        handlers::initialize_user_handler::handler(ctx)
    }

    /// Upload a new file to the platform
    /// Creates FileRecord with encrypted metadata and IPFS reference
    pub fn upload_file(
        ctx: Context<UploadFile>,
        file_hash: [u8; 32],
        ipfs_hash: String,
        encrypted_metadata: String,
        file_size: u64,
        content_type: String,
        description: String,
    ) -> Result<()> {
        handlers::upload_file_handler::handler(
            ctx,
            file_hash,
            ipfs_hash,
            encrypted_metadata,
            file_size,
            content_type,
            description,
        )
    }

    /// Grant access to a file for another user
    /// Creates AccessPermission record with specific permissions and expiration
    pub fn grant_access(
        ctx: Context<GrantAccess>,
        accessor: Pubkey,
        permissions: u8,
        expires_at: Option<i64>,
        max_downloads: Option<u32>,
    ) -> Result<()> {
        handlers::grant_access_handler::handler(ctx, accessor, permissions, expires_at, max_downloads)
    }

    /// Verify file authenticity using file hash
    /// Returns verification result with blockchain proof
    pub fn verify_file(ctx: Context<VerifyFile>, file_hash: [u8; 32]) -> Result<()> {
        handlers::verify_file_handler::handler(ctx, file_hash)
    }

    /// Record file access for audit trail
    /// Updates download statistics and logs access
    pub fn record_file_access(
        ctx: Context<RecordFileAccess>,
        access_type: AccessType,
    ) -> Result<()> {
        handlers::record_file_access_handler::handler(ctx, access_type)
    }

    /// Update file publicity for verification
    /// Allows/disallows public verification without account
    pub fn update_file_publicity(
        ctx: Context<UpdateFilePublicity>,
        is_public: bool,
    ) -> Result<()> {
        handlers::update_file_publicity_handler::handler(ctx, is_public)
    }


    // Delete a file (mark as inactive)
    /// Updates user storage statistics and marks file as inactive
    pub fn delete_file(ctx: Context<DeleteFile>) -> Result<()> {
        handlers::delete_file_handler::handler(ctx)
    }
}

