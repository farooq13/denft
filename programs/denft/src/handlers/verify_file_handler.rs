use anchor_lang::prelude::*;
use crate::context::VerifyFile;

pub fn handler(ctx: Context<VerifyFile>, file_hash: [u8; 32]) -> Result<()> {
    crate::context::verify_file::handler::verify_file(ctx, file_hash)
}