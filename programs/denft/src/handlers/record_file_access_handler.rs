use anchor_lang::prelude::*;
use crate::{context::RecordFileAccess, AccessType};

pub fn handler(ctx: Context<RecordFileAccess>, access_type: AccessType) -> Result<()> {
    crate::context::record_file_access::handler::record_file_access(ctx, access_type)
}