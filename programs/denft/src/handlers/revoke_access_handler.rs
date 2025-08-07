use anchor_lang::prelude::*;
use crate::context::RevokeAccess;

pub fn handler(ctx: Context<RevokeAccess>) -> Result<()> {
    crate::context::revoke_access::handler::revoke_access(ctx)
}