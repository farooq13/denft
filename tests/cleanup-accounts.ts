import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Denft } from "../target/types/denft";
import { PublicKey, Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";

async function cleanupAccounts() {
  // Configure the client
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.denft as Program<Denft>;
  const provider = anchor.AnchorProvider.env();

  function loadKeypair(filename: string): anchor.web3.Keypair {
    const filePath = path.resolve(__dirname, `../keypairs/${filename}`); 
    const secretKeyString = fs.readFileSync(filePath, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return anchor.web3.Keypair.fromSecretKey(secretKey);
  }

  // Load keypairs
  const authority = loadKeypair("authority-keypair.json");
  const secondUser = loadKeypair("secondUser-keypair.json");
  const thirdUser = loadKeypair("thirdUser-keypair.json");

  console.log("Starting account cleanup...");

  // Function to close an account if it exists
  async function closeAccountIfExists(publicKey: PublicKey, authority: Keypair, label: string) {
    try {
      const accountInfo = await provider.connection.getAccountInfo(publicKey);
      if (accountInfo && accountInfo.owner.equals(program.programId)) {
        console.log(`Found ${label}: ${publicKey.toString()}`);
        // Note: You'll need to implement a close_account instruction in your program
        // or transfer all lamports out to effectively close the account
        console.log(`${label} exists but cannot be automatically closed. Manual cleanup required.`);
        return true;
      }
      return false;
    } catch (error) {
      console.log(`Error checking ${label}: ${error}`);
      return false;
    }
  }

  // Clean up user accounts
  const [userAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), authority.publicKey.toBuffer()],
    program.programId
  );
  
  const [secondUserAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), secondUser.publicKey.toBuffer()],
    program.programId
  );

  await closeAccountIfExists(userAccountPDA, authority, "Authority User Account");
  await closeAccountIfExists(secondUserAccountPDA, secondUser, "Second User Account");

  // Clean up test files (you might need to track these based on your test patterns)
  console.log("\nScanning for test files...");
  
  // Since we can't easily enumerate all possible file PDAs, this is more informational
  console.log("Manual cleanup may be required for file records and access permissions");
  console.log("Consider implementing a close_account instruction in your program");
  
  console.log("\nCleanup scan completed.");
  console.log("\nTo manually clean up accounts:");
  console.log("1. Use 'solana account <address>' to inspect accounts");
  console.log("2. Use 'solana transfer <amount> --from <authority> <destination>' to drain accounts");
  console.log("3. Consider implementing account closure in your program");
}

// Function to generate a cleanup script for specific test run
export function generateCleanupCommands(testRunId: number, authorityPubkey: string) {
  console.log(`\n=== Cleanup Commands for Test Run ${testRunId} ===`);
  console.log("# Check account balances:");
  console.log(`solana balance ${authorityPubkey}`);
  console.log("\n# List program accounts (if available):");
  console.log("# solana program show <program-id> --accounts");
  console.log("\n# Manual account inspection:");
  console.log("# solana account <pda-address>");
  console.log("=========================================\n");
}

if (require.main === module) {
  cleanupAccounts().catch(console.error);
}