use anchor_lang::prelude::*;
use crate::{
    UserAccount, FileRecord, DenftError, MAX_FILE_SIZE, MAX_IPFS_HASH_LENGTH,
    MAX_CONTENT_TYPE_LENGTH, MAX_DESCRIPTION_LENGTH, FileUploaded,
    generate_verification_id::generate_verification_id,
};

#[derive(Accounts)]
#[instruction(file_hash: [u8; 32])]
pub struct UploadFile<'info> {
    #[account(
        mut,
        seeds = [b"user", authority.key().as_ref()],
        bump,
        constraint = user_account.is_active @ DenftError::UserAccountInactive
    )]
    pub user_account: Account<'info, UserAccount>,
    
    #[account(
        init,
        payer = authority,
        space = FileRecord::space_required(500), // Extra space for metadata
        seeds = [
            b"file",
            authority.key().as_ref(),
            file_hash.as_ref()
        ],
        bump
    )]
    pub file_record: Account<'info, FileRecord>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;
    use crate::{
    UserAccount, FileRecord, DenftError, MAX_FILE_SIZE, MAX_IPFS_HASH_LENGTH,
    MAX_CONTENT_TYPE_LENGTH, MAX_DESCRIPTION_LENGTH, FileUploaded,
    generate_verification_id::generate_verification_id,
    };

    pub fn upload_file(
        ctx: Context<UploadFile>,
        file_hash: [u8; 32],
        ipfs_hash: String,
        encrypted_metadata: String,
        file_size: u64,
        content_type: String,
        description: String,
    ) -> Result<()> {
        // Validate input parameters
        require!(file_size > 0 && file_size <= MAX_FILE_SIZE, DenftError::InvalidFileSize);
        require!(ipfs_hash.len() <= MAX_IPFS_HASH_LENGTH, DenftError::IpfsHashTooLong);
        require!(content_type.len() <= MAX_CONTENT_TYPE_LENGTH, DenftError::ContentTypeTooLong);
        require!(description.len() <= MAX_DESCRIPTION_LENGTH, DenftError::DescriptionTooLong);

        let user_account = &mut ctx.accounts.user_account;
        let file_record = &mut ctx.accounts.file_record;
        let clock = Clock::get()?;

        // Check user limits using helper method
        require!(user_account.can_add_file(file_size), DenftError::FileLimitExceeded);

        // Initialize file record
        file_record.owner = ctx.accounts.authority.key();
        file_record.file_hash = file_hash;
        file_record.ipfs_hash = ipfs_hash;
        file_record.encrypted_metadata = encrypted_metadata;
        file_record.file_size = file_size;
        file_record.content_type = content_type;
        file_record.description = description;
        file_record.timestamp = clock.unix_timestamp;
        file_record.is_public_verification = false;
        file_record.access_count = 0;
        file_record.download_count = 0;
        file_record.is_active = true;
        file_record.deleted_at = None;
        file_record.verification_id = generate_verification_id(&file_hash, &clock.unix_timestamp);
        file_record.reserved = [0; 32];

        // Update user statistics using helper method
        user_account.add_file(file_size);

        emit!(FileUploaded {
            file_id: ctx.accounts.file_record.key(),
            owner: ctx.accounts.authority.key(),
            file_hash,
            ipfs_hash: file_record.ipfs_hash.clone(),
            file_size,
            timestamp: clock.unix_timestamp,
            verification_id: file_record.verification_id,
        });

        Ok(())
    }
}