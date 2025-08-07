use anchor_lang::prelude::*;
use crate::context::UploadFile;

pub fn handler(
    ctx: Context<UploadFile>,
    file_hash: [u8; 32],
    ipfs_hash: String,
    encrypted_metadata: String,
    file_size: u64,
    content_type: String,
    description: String,
) -> Result<()> {
    crate::context::upload_file::handler::upload_file(
        ctx,
        file_hash,
        ipfs_hash,
        encrypted_metadata,
        file_size,
        content_type,
        description,
    )
}