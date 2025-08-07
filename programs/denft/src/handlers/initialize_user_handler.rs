use anchor_lang::prelude::*;
use crate::context::InitializeUser;

pub fn handler(ctx: Context<InitializeUser>) -> Result<()> {
    crate::context::initialize_user::handler::initialize_user(ctx)
}