use anchor_lang::prelude::*;
use crate::{FileRecord, AccessPermission, DenftError, AccessGranted};

#[derive(Accounts)]
pub struct GrantAccess<'info> {
    #[account(
        constraint = file_record.owner == authority.key() @ DenftError::Unauthorized,
        constraint = file_record.is_active @ DenftError::FileNotActive
    )]
    pub file_record: Account<'info, FileRecord>,
    
    #[account(
        init,
        payer = authority,
        space = AccessPermission::LEN,
        seeds = [
            b"access",
            file_record.key().as_ref(),
            accessor.key().as_ref()
        ],
        bump
    )]
    pub access_permission: Account<'info, AccessPermission>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This is the accessor's public key, validated by seeds
    pub accessor: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;
    use crate::{FileRecord, AccessPermission, DenftError, AccessGranted};

    pub fn grant_access(
        ctx: Context<GrantAccess>,
        accessor: Pubkey,
        permissions: u8,
        expires_at: Option<i64>,
        max_downloads: Option<u32>,
    ) -> Result<()> {
        let access_permission = &mut ctx.accounts.access_permission;
        let clock = Clock::get()?;

        // Validate permissions using helper method
        require!(
            AccessPermission::is_valid_permission(permissions),
            DenftError::InvalidPermissions
        );

        // Check if expiration time is in the future
        if let Some(exp_time) = expires_at {
            require!(exp_time > clock.unix_timestamp, DenftError::InvalidExpirationTime);
        }

        // Initialize access permission
        access_permission.file_record = ctx.accounts.file_record.key();
        access_permission.accessor = accessor;
        access_permission.permissions = permissions;
        access_permission.granted_at = clock.unix_timestamp;
        access_permission.expires_at = expires_at;
        access_permission.max_downloads = max_downloads.map(|v| v as u64);
        access_permission.used_downloads = 0;
        access_permission.granted_by = ctx.accounts.authority.key();
        access_permission.is_active = true;
        access_permission.revoked_at = None;
        access_permission.reserved = [0; 16];

        emit!(AccessGranted {
            file_id: ctx.accounts.file_record.key(),
            owner: ctx.accounts.authority.key(),
            accessor,
            permissions,
            granted_at: clock.unix_timestamp,
            expires_at,
        });

        Ok(())
    }
}