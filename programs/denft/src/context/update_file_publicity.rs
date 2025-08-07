use anchor_lang::prelude::*;
use crate::{FileRecord, DenftError, FilePublicityUpdated};

#[derive(Accounts)]
pub struct UpdateFilePublicity<'info> {
    #[account(
        mut,
        constraint = file_record.owner == authority.key() @ DenftError::Unauthorized
    )]
    pub file_record: Account<'info, FileRecord>,
    
    pub authority: Signer<'info>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;

    pub fn update_file_publicity(
        ctx: Context<UpdateFilePublicity>,
        is_public: bool,
    ) -> Result<()> {
        let file_record = &mut ctx.accounts.file_record;
        let clock = Clock::get()?;
        
        file_record.is_public_verification = is_public;

        emit!(FilePublicityUpdated {
            file_id: ctx.accounts.file_record.key(),
            owner: ctx.accounts.authority.key(),
            is_public,
            updated_at: clock.unix_timestamp,
        });

        Ok(())
    }
}