use anchor_lang::prelude::*;
use crate::{UserAccount, FileRecord, DenftError, FileDeleted};

#[derive(Accounts)]
pub struct DeleteFile<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    
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

    pub fn delete_file(ctx: Context<DeleteFile>) -> Result<()> {
        let file_record = &mut ctx.accounts.file_record;
        let user_account = &mut ctx.accounts.user_account;
        let clock = Clock::get()?;

        require!(file_record.is_accessible(), DenftError::FileAlreadyDeleted);

        let file_size = file_record.file_size;

        // Update user statistics using helper method
        user_account.remove_file(file_size);

        // Mark file as inactive using helper method
        file_record.mark_deleted(clock.unix_timestamp);

        emit!(FileDeleted {
            file_id: ctx.accounts.file_record.key(),
            owner: ctx.accounts.authority.key(),
            deleted_at: clock.unix_timestamp,
        });

        Ok(())
    }
}