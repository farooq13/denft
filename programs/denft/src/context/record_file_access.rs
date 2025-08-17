use anchor_lang::prelude::*;
use crate::{
    FileRecord, AccessPermission, DenftError
};

#[derive(Accounts)]
pub struct RecordFileAccess<'info> {
    #[account(mut)]
    pub file_record: Account<'info, FileRecord>,
    
    #[account(
        mut,
        constraint = access_permission.accessor == authority.key() @ DenftError::Unauthorized,
        constraint = access_permission.file_record == file_record.key() @ DenftError::InvalidAccessPermission
    )]
    pub access_permission: Account<'info, AccessPermission>,
    
    pub authority: Signer<'info>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;
    use crate::{
    access_permission::PERMISSION_DOWNLOAD, AccessType, DenftError, FileAccessed, PERMISSION_READ, PERMISSION_SHARE
};

    pub fn record_file_access(
        ctx: Context<RecordFileAccess>,
        access_type: AccessType,
    ) -> Result<()> {
        let file_record = &mut ctx.accounts.file_record;
        let access_permission = &mut ctx.accounts.access_permission;
        let clock = Clock::get()?;

        // Validate access permission is still valid using helper method
        require!(
            access_permission.is_valid(),
            DenftError::AccessRevoked
        );

        // Check download limits for download access
        if access_type == AccessType::Download {
            require!(
                access_permission.has_permission(PERMISSION_DOWNLOAD),
                DenftError::Unauthorized
            );
            
            require!(
                access_permission.can_download(),
                DenftError::DownloadLimitExceeded
            );

            // Consume download using helper method
            access_permission.consume_download()?;
            file_record.increment_download();
        }

        // Update access count using helper method
        file_record.increment_access();

        

        let access_flag = match access_type {
            AccessType::Read => PERMISSION_READ,
            AccessType::Download => PERMISSION_DOWNLOAD,
            AccessType::Share => PERMISSION_SHARE,
        };

        emit!(FileAccessed {
            file_id: ctx.accounts.file_record.key(),
            accessor: ctx.accounts.authority.key(),
            access_type: access_flag,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}