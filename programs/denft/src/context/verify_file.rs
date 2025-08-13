use anchor_lang::prelude::*;
use crate::{FileRecord, DenftError, FileVerified};

#[derive(Accounts)]
#[instruction(file_hash: [u8; 32])]
pub struct VerifyFile<'info> {
    #[account(
        mut,
        seeds = [
            b"file",
            uploader.key().as_ref(),
            file_hash.as_ref()
        ],
        bump
    )]
    pub file_record: Account<'info, FileRecord>,

    /// CHECK: uploader public key used for PDA derivation
    pub uploader: UncheckedAccount<'info>,
    
    pub authority: Signer<'info>,
}

pub mod handler {
    use super::*;
    use anchor_lang::solana_program::clock::Clock;

    pub fn verify_file(ctx: Context<VerifyFile>, file_hash: [u8; 32]) -> Result<()> {
        let file_record = &mut ctx.accounts.file_record;
        let clock = Clock::get()?;

        // Verify hash matches using helper method
        require!(file_record.verify_hash(&file_hash), DenftError::FileHashMismatch);
        require!(file_record.is_accessible(), DenftError::FileNotActive);

        // Update access statistics using helper method
        file_record.increment_access();

        emit!(FileVerified {
            file_id: file_record.key(),
            verifier: ctx.accounts.authority.key(),
            file_hash,
            verified_at: clock.unix_timestamp,
            original_timestamp: file_record.timestamp,
            verification_id: file_record.verification_id,
        });

        Ok(())
    }
}