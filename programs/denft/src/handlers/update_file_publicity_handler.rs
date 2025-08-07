use anchor_lang::prelude::*;
use crate::context::UpdateFilePublicity;

pub fn handler(ctx: Context<UpdateFilePublicity>, is_public: bool) -> Result<()> {
    crate::context::update_file_publicity::handler::update_file_publicity(ctx, is_public)
}