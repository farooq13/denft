#![allow(unexpected_cfgs, deprecated)]
use anchor_lang::prelude::*;


pub mod context;
pub mod state;
pub mod errors;
pub mod handlers;
pub mod events;
pub mod generate_verification_id;

pub use context::*;
pub use state::*;
pub use errors::*;
pub use handlers::*;
pub use events::*;
pub use generate_verification_id::*;

declare_id!("5KNDVsCpPfkjiD4sYiDfMYRC7rH4DCXmboorZZ8NExBt");

#[program]
pub mod denft {
    use super::*;

     pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        handlers::initialize_user::handler(ctx)
    }
}

