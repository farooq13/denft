use anchor_lang::prelude::*;
use crate::context::GrantAccess;

pub fn handler(
    ctx: Context<GrantAccess>,
    accessor: Pubkey,
    permissions: u8,
    expires_at: Option<i64>,
    max_downloads: Option<u32>,
) -> Result<()> {
    crate::context::grant_access::handler::grant_access(
        ctx,
        accessor,
        permissions,
        expires_at,
        max_downloads,
    )
}