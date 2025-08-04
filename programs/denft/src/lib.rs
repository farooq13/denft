use anchor_lang::prelude::*;

declare_id!("5KNDVsCpPfkjiD4sYiDfMYRC7rH4DCXmboorZZ8NExBt");

#[program]
pub mod denft {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
