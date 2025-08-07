use anchor_lang::prelude::*;
use crate::{FileRecord, AccessPermission, DenftError, AccessRevoked};

#[derive(Accounts)]
pub struct RevokeAccess<'info> {
    #[account(
        constraint = file_record.owner == authority.key() @ DenftError::Unauthorized
    )]
    pub file_record: Account<'info, FileRecord>,
    
    #[account(
        mut,
        seeds = [
            b"access",
            file_record.key().as_ref(),
            access_permission.accessor.as_ref()
        ],
        bump,
        constraint = access_permission.file_record == file_record.key() @ DenftError::InvalidAccessPermission
    )]
    pub access_permission: Account<'info, AccessPermission>,
    
    pub authority: Signer<'info>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;

    pub fn revoke_access(ctx: Context<RevokeAccess>) -> Result<()> {
        let access_permission = &mut ctx.accounts.access_permission;
        let clock = Clock::get()?;

        require!(access_permission.is_active, DenftError::AccessAlreadyRevoked);

        // Use helper method to revoke access
        access_permission.revoke(clock.unix_timestamp);

        emit!(AccessRevoked {
            file_id: access_permission.file_record,
            owner: ctx.accounts.authority.key(),
            accessor: access_permission.accessor,
            revoked_at: clock.unix_timestamp,
        });

        Ok(())
    }
}