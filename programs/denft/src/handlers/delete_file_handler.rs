use anchor_lang::prelude::*;
use crate::context::DeleteFile;

pub fn handler(ctx: Context<DeleteFile>) -> Result<()> {
    crate::context::delete_file::handler::delete_file(ctx)
}