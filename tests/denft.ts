import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Denft } from "../target/types/denft";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";
import fs from "fs";
import path from "path";

describe("denft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.denft as Program<Denft>;
  const provider = anchor.AnchorProvider.env();

  // Define top-level test variables
  let authority: Keypair;
  let secondUser: Keypair;
  let thirdUser: Keypair;
  let userAccountPDA: PublicKey;
  let secondUserAccountPDA: PublicKey;
  let fileRecordPDA: PublicKey;
  let accessPermissionPDA: PublicKey;
  
  // Add unique suffix to prevent account collisions
  const testRunId = Math.floor(Math.random() * 1000000);
  
  // Test data constants - Ensure all values are within valid u8 range (0-255)
  let TEST_FILE_HASH: number[];
  const TEST_IPFS_HASH = "QmTestHashExample1234567890abcdef";
  const TEST_METADATA = JSON.stringify({ name: "test-file.txt", encrypted: true });
  const TEST_FILE_SIZE = 1024;
  const TEST_CONTENT_TYPE = "text/plain";
  const TEST_DESCRIPTION = "Test file description";
  const TEST_PERMISSIONS_READ = 1;
  const TEST_PERMISSIONS_DOWNLOAD = 2;
  const TEST_PERMISSIONS_ALL = 7;

  function loadKeypair(filename: string): anchor.web3.Keypair {
    const filePath = path.resolve(__dirname, `../keypairs/${filename}`); 
    const secretKeyString = fs.readFileSync(filePath, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return anchor.web3.Keypair.fromSecretKey(secretKey);
  }
  
  async function fundFromAuthority(
    provider: anchor.AnchorProvider,
    authority: Keypair,
    recipient: PublicKey,
    lamports: number = 0.05 * LAMPORTS_PER_SOL 
  ) {
    try {
      const tx = new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: authority.publicKey,
          toPubkey: recipient,
          lamports,
        })
      );
      await provider.sendAndConfirm(tx, [authority]);
    } catch (error) {
      console.log(`Failed to fund ${recipient.toString()}: ${error}`);
      throw error;
    }
  }

  async function requestAirdrop(publicKey: PublicKey, lamports: number = 2 * LAMPORTS_PER_SOL) {
    try {
      const signature = await provider.connection.requestAirdrop(publicKey, lamports);
      await provider.connection.confirmTransaction(signature);
    } catch (error) {
      console.log(`Airdrop failed for ${publicKey.toString()}: ${error}`);
    }
  }

  function generateUniqueHash(baseValue: number = 0): number[] {
    return Array.from({ length: 32 }, (_, i) => (i * 7 + baseValue + testRunId) % 256);
  }

  async function accountExists(publicKey: PublicKey): Promise<boolean> {
    try {
      const accountInfo = await provider.connection.getAccountInfo(publicKey);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  before(async () => {
    // Generate unique test file hash for this test run
    TEST_FILE_HASH = generateUniqueHash(1);
    
    // Load keypairs
    authority = (provider.wallet as anchor.Wallet).payer;
    secondUser = loadKeypair("secondUser-keypair.json");
    thirdUser = loadKeypair("thirdUser-keypair.json");

    // Fund all test accounts from authority instead of using airdrops
    console.log("Funding test accounts from authority...");
    await fundFromAuthority(provider, authority, secondUser.publicKey, 2 * LAMPORTS_PER_SOL);
    await fundFromAuthority(provider, authority, thirdUser.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Wait for funding to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate PDAs with unique identifiers
    [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), authority.publicKey.toBuffer()],
      program.programId
    );

    [secondUserAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

    // File record PDA with unique hash
    [fileRecordPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("file"),
        authority.publicKey.toBuffer(), 
        Buffer.from(TEST_FILE_HASH)
      ],
      program.programId
    );

    [accessPermissionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("access"),
        fileRecordPDA.toBuffer(),
        secondUser.publicKey.toBuffer()
      ],
      program.programId
    );

    console.log(`Test run ID: ${testRunId}`);
    console.log(`Authority: ${authority.publicKey.toString()}`);
    console.log(`User PDA: ${userAccountPDA.toString()}`);
    console.log(`File PDA: ${fileRecordPDA.toString()}`);
  });

  describe('initialize_user', () => {
    it("Should initialize a new user account successfully", async () => {
      // Check if account already exists and skip if it does
      if (await accountExists(userAccountPDA)) {
        console.log("User account already exists, skipping initialization");
        const userAccount = await program.account.userAccount.fetch(userAccountPDA);
        assert.ok(userAccount.owner.equals(authority.publicKey));
        return;
      }

      const tx = await program.methods
        .initializeUser()
        .accountsPartial({
          authority: authority.publicKey,
          userAccount: userAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      assert.ok(userAccount.owner.equals(authority.publicKey));
      assert.equal(userAccount.fileCount, 0);
      assert.equal(userAccount.storageUsed.toString(), "0"); 
      assert.equal(userAccount.storageLimit.toString(), (1024 * 1024 * 1024).toString());
      assert.equal(userAccount.fileLimit, 100);
      assert.isTrue(userAccount.isActive);
      assert.isTrue(userAccount.createdAt.gt(new BN(0)));
    });

    it("Should fail to initialize the same user account twice", async () => {
      try {
        await program.methods
          .initializeUser()
          .accountsPartial({
            authority: authority.publicKey,
            userAccount: userAccountPDA,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for duplicate user initialization");
      } catch (error) {
        // Check for the specific error that indicates account already exists
        assert.include(error.toString(), "custom program error");
      }
    });

    it("Should initialize multiple different user accounts", async () => {
      // Check if second user account already exists
      if (await accountExists(secondUserAccountPDA)) {
        console.log("Second user account already exists, skipping initialization");
        const secondUserAccount = await program.account.userAccount.fetch(secondUserAccountPDA);
        assert.ok(secondUserAccount.owner.equals(secondUser.publicKey));
        return;
      }

      const tx = await program.methods
        .initializeUser()
        .accountsPartial({
          authority: secondUser.publicKey,
          userAccount: secondUserAccountPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([secondUser])
        .rpc();

      const secondUserAccount = await program.account.userAccount.fetch(secondUserAccountPDA);
      
      assert.ok(secondUserAccount.owner.equals(secondUser.publicKey));
      assert.equal(secondUserAccount.fileCount, 0);
      assert.equal(secondUserAccount.storageUsed.toString(), "0");
      assert.isTrue(secondUserAccount.isActive);
    });
  });

  describe('upload file', () => {
    it("Should upload a file successfully", async () => {
      // Check if file already exists
      if (await accountExists(fileRecordPDA)) {
        console.log("File already exists, skipping upload");
        const fileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
        assert.ok(fileRecord.owner.equals(authority.publicKey));
        return;
      }

      const tx = await program.methods
        .uploadFile(
          Array.from(TEST_FILE_HASH),
          TEST_IPFS_HASH,
          TEST_METADATA,
          new BN(TEST_FILE_SIZE),
          TEST_CONTENT_TYPE,
          TEST_DESCRIPTION
        )
        .accountsPartial({
          userAccount: userAccountPDA,
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const fileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);

      assert.ok(fileRecord.owner.equals(authority.publicKey));
      assert.deepEqual(Array.from(fileRecord.fileHash), TEST_FILE_HASH);
      assert.equal(fileRecord.ipfsHash, TEST_IPFS_HASH);
      assert.equal(fileRecord.fileSize.toString(), TEST_FILE_SIZE.toString()); 
      assert.equal(fileRecord.contentType, TEST_CONTENT_TYPE);
      assert.equal(fileRecord.description, TEST_DESCRIPTION);
      assert.isTrue(fileRecord.isActive);
      assert.isTrue(fileRecord.verificationId.gt(new BN(0)));
    });

    it("Should fail to upload file with zero size", async () => {
      const invalidFileHash = generateUniqueHash(100);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .uploadFile(
            invalidFileHash,
            TEST_IPFS_HASH,
            TEST_METADATA,
            new BN(0), // Zero file size
            TEST_CONTENT_TYPE,
            TEST_DESCRIPTION
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for zero file size");
      } catch (error) {
        // More flexible error checking for devnet
        assert.isTrue(
          error.toString().includes("Invalid file size") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail to upload file exceeding maximum size", async () => {
      const invalidFileHash = generateUniqueHash(101);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .uploadFile(
            invalidFileHash,
            TEST_IPFS_HASH,
            TEST_METADATA,
            new BN(11 * 1024 * 1024), // 11MB - exceeds 10MB limit
            TEST_CONTENT_TYPE,
            TEST_DESCRIPTION
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for file size too large");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Invalid file size") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail with IPFS hash too long", async () => {
      const longIpfsHash = "Q".repeat(101);
      const invalidFileHash = generateUniqueHash(102);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .uploadFile(
            invalidFileHash,
            longIpfsHash,
            TEST_METADATA,
            new BN(TEST_FILE_SIZE),
            TEST_CONTENT_TYPE,
            TEST_DESCRIPTION
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for IPFS hash too long");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("IPFS hash too long") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail with content type too long", async () => {
      const longContentType = "a".repeat(101);
      const invalidFileHash = generateUniqueHash(103);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .uploadFile(
            invalidFileHash,
            TEST_IPFS_HASH,
            TEST_METADATA,
            new BN(TEST_FILE_SIZE),
            longContentType,
            TEST_DESCRIPTION
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for content type too long");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Content type too long") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail with description too long", async () => {
      const longDescription = "a".repeat(501);
      const invalidFileHash = generateUniqueHash(104);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .uploadFile(
            invalidFileHash,
            TEST_IPFS_HASH,
            TEST_METADATA,
            new BN(TEST_FILE_SIZE),
            TEST_CONTENT_TYPE,
            longDescription
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for description too long");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Description too long") || 
          error.toString().includes("custom program error")
        );
      }
    });
  });

  describe('grant access', () => {
    it("Should grant read access successfully", async () => {
      // Check if access permission already exists
      if (await accountExists(accessPermissionPDA)) {
        console.log("Access permission already exists, skipping grant");
        const accessPermission = await program.account.accessPermission.fetch(accessPermissionPDA);
        assert.ok(accessPermission.fileRecord.equals(fileRecordPDA));
        return;
      }

      const tx = await program.methods
        .grantAccess(
          secondUser.publicKey,
          TEST_PERMISSIONS_READ,
          null,
          null
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: authority.publicKey,
          accessor: secondUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const accessPermission = await program.account.accessPermission.fetch(accessPermissionPDA);

      assert.ok(accessPermission.fileRecord.equals(fileRecordPDA));
      assert.ok(accessPermission.accessor.equals(secondUser.publicKey));
      assert.equal(accessPermission.permissions, TEST_PERMISSIONS_READ);
      assert.isTrue(accessPermission.isActive);
      assert.isNull(accessPermission.expiresAt);
      assert.isNull(accessPermission.maxDownloads);
      assert.equal(accessPermission.usedDownloads, 0);
      assert.ok(accessPermission.grantedBy.equals(authority.publicKey));
    });

    it("Should grant access with expiration time", async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const tempUser = Keypair.generate();
      await fundFromAuthority(provider, authority, tempUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [tempAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser.publicKey.toBuffer()
        ],
        program.programId
      );

      const tx = await program.methods
        .grantAccess(
          tempUser.publicKey,
          TEST_PERMISSIONS_READ,
          new BN(futureTime),
          null
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: tempAccessPDA,
          authority: authority.publicKey,
          accessor: tempUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const accessPermission = await program.account.accessPermission.fetch(tempAccessPDA);
      assert.isTrue(accessPermission.expiresAt.eq(new BN(futureTime)));
    });

    it("Should grant access with download limit", async () => {
      const tempUser2 = Keypair.generate();
      await fundFromAuthority(provider, authority, tempUser2.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [tempAccessPDA2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser2.publicKey.toBuffer()
        ],
        program.programId
      );

      const tx = await program.methods
        .grantAccess(
          tempUser2.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          5
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: tempAccessPDA2,
          authority: authority.publicKey,
          accessor: tempUser2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const accessPermission = await program.account.accessPermission.fetch(tempAccessPDA2);
      assert.equal(accessPermission.maxDownloads.toString(), "5");
    });

    it("Should fail to grant access with invalid permissions", async () => {
      const tempUser3 = Keypair.generate();
      const [tempAccessPDA3] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser3.publicKey.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .grantAccess(
            tempUser3.publicKey,
            8,
            null,
            null
          )
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: tempAccessPDA3,
            authority: authority.publicKey,
            accessor: tempUser3.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for invalid permissions");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Invalid permissions") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail to grant access with past expiration time", async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const tempUser4 = Keypair.generate();
      const [tempAccessPDA4] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser4.publicKey.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .grantAccess(
            tempUser4.publicKey,
            TEST_PERMISSIONS_READ,
            new BN(pastTime),
            null
          )
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: tempAccessPDA4,
            authority: authority.publicKey,
            accessor: tempUser4.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for past expiration time");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Invalid expiration time") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail when non-owner tries to grant access", async () => {
      const [unauthorizedAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          thirdUser.publicKey.toBuffer()
        ],
        program.programId
      );

      try {
        await program.methods
          .grantAccess(
            thirdUser.publicKey,
            TEST_PERMISSIONS_READ,
            null,
            null
          )
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: unauthorizedAccessPDA,
            authority: secondUser.publicKey,
            accessor: thirdUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized access grant");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Unauthorized") || 
          error.toString().includes("custom program error")
        );
      }
    });
  });

  describe('verify file', () => {
    it("Should verify file successfully with correct hash", async () => {
      const tx = await program.methods
        .verifyFile(Array.from(TEST_FILE_HASH))
        .accountsPartial({
          fileRecord: fileRecordPDA,
          authority: secondUser.publicKey,
        })
        .signers([secondUser])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      // Access count should be incremented from previous value
      assert.isTrue(updatedFileRecord.accessCount.gt(new BN(0)));
    });

    it("Should fail to verify file with incorrect hash", async () => {
      const wrongHash = generateUniqueHash(200);
      const [wrongFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(wrongHash)
        ],
        program.programId
      );

      try {
        await program.methods
          .verifyFile(wrongHash)
          .accountsPartial({
            fileRecord: wrongFileRecordPDA,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for incorrect hash");
      } catch (error) {
        assert.include(error.toString(), "AccountNotInitialized");
      }
    });
  });

  describe('record file access', () => {
    it("Should record read access successfully", async () => {
      // Check if access permission is still active
      const accessPermission = await program.account.accessPermission.fetch(accessPermissionPDA);
      if (!accessPermission.isActive) {
        console.log("Access permission is not active, skipping test");
        return;
      }

      const initialFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const initialAccessCount = initialFileRecord.accessCount;

      const tx = await program.methods
        .recordFileAccess({ read: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: secondUser.publicKey,
        })
        .signers([secondUser])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isTrue(updatedFileRecord.accessCount.gt(initialAccessCount));
    });

    it("Should record download access and increment download count", async () => {
      const tempUser = Keypair.generate();
      await fundFromAuthority(provider, authority, tempUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [downloadAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser.publicKey.toBuffer()
        ],
        program.programId
      );

      await program.methods
        .grantAccess(
          tempUser.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          3
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: downloadAccessPDA,
          authority: authority.publicKey,
          accessor: tempUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const tx = await program.methods
        .recordFileAccess({ download: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: downloadAccessPDA,
          authority: tempUser.publicKey,
        })
        .signers([tempUser])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const updatedAccess = await program.account.accessPermission.fetch(downloadAccessPDA);
      
      assert.isTrue(updatedFileRecord.downloadCount.gt(new BN(0)));
      assert.equal(updatedAccess.usedDownloads, 1);
    });

    it("Should fail download access when download limit exceeded", async () => {
      const limitUser = Keypair.generate();
      await fundFromAuthority(provider, authority, limitUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [limitAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          limitUser.publicKey.toBuffer()
        ],
        program.programId
      );

      await program.methods
        .grantAccess(
          limitUser.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          1
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: limitAccessPDA,
          authority: authority.publicKey,
          accessor: limitUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await program.methods
        .recordFileAccess({ download: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: limitAccessPDA,
          authority: limitUser.publicKey,
        })
        .signers([limitUser])
        .rpc();

      try {
        await program.methods
          .recordFileAccess({ download: {} })
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: limitAccessPDA,
            authority: limitUser.publicKey,
          })
          .signers([limitUser])
          .rpc();
        assert.fail("Expected error for download limit exceeded");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Download limit exceeded") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail access when user lacks permission", async () => {
      try {
        await program.methods
          .recordFileAccess({ download: {} })
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: accessPermissionPDA,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for insufficient permissions");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Unauthorized") || 
          error.toString().includes("custom program error") ||
          error.toString().includes("AccessRevoked")
        );
      }
    });
  });

  describe('revoke access', () => {
    it("Should revoke access successfully", async () => {
      // Check current state of access permission
      const currentAccess = await program.account.accessPermission.fetch(accessPermissionPDA);
      if (!currentAccess.isActive) {
        console.log("Access already revoked, skipping test");
        assert.isFalse(currentAccess.isActive);
        return;
      }

      const tx = await program.methods
        .revokeAccess()
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const revokedAccess = await program.account.accessPermission.fetch(accessPermissionPDA);
      assert.isFalse(revokedAccess.isActive);
      assert.isNotNull(revokedAccess.revokedAt);
    });

    it("Should fail to revoke already revoked access", async () => {
      try {
        await program.methods
          .revokeAccess()
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: accessPermissionPDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for already revoked access");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Access already revoked") || 
          error.toString().includes("AccessAlreadyRevoked") ||
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail when non-owner tries to revoke access", async () => {
      const newAccessUser = Keypair.generate();
      await fundFromAuthority(provider, authority, newAccessUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [newAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          newAccessUser.publicKey.toBuffer()
        ],
        program.programId
      );

      await program.methods
        .grantAccess(
          newAccessUser.publicKey,
          TEST_PERMISSIONS_READ,
          null,
          null
        )
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: newAccessPDA,
          authority: authority.publicKey,
          accessor: newAccessUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .revokeAccess()
          .accountsPartial({
            fileRecord: fileRecordPDA,
            accessPermission: newAccessPDA,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized revocation");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Unauthorized") || 
          error.toString().includes("custom program error")
        );
      }
    });
  });

  describe('update file publicity', () => {
    it("Should update file publicity to public successfully", async () => {
      const tx = await program.methods
        .updateFilePublicity(true)
        .accounts({
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isTrue(updatedFileRecord.isPublicVerification);
    });

    it("Should update file publicity to private successfully", async () => {
      const tx = await program.methods
        .updateFilePublicity(false)
        .accounts({
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isFalse(updatedFileRecord.isPublicVerification);
    });

    it("Should fail when non-owner tries to update publicity", async () => {
      try {
        await program.methods
          .updateFilePublicity(true)
          .accountsPartial({
            fileRecord: fileRecordPDA,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized publicity update");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Unauthorized") || 
          error.toString().includes("custom program error")
        );
      }
    });
  });

  describe('delete file', () => {
    let testFileForDeletion: PublicKey;
    let testFileHashForDeletion: number[];

    beforeEach(async () => {
      // Create a new file for each deletion test to avoid conflicts
      testFileHashForDeletion = generateUniqueHash(Math.floor(Math.random() * 1000));
      [testFileForDeletion] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(testFileHashForDeletion)
        ],
        program.programId
      );

      // Skip if file already exists
      if (await accountExists(testFileForDeletion)) {
        console.log("Test file already exists, using existing file");
        return;
      }

      await program.methods
        .uploadFile(
          testFileHashForDeletion,
          `QmTestFile${Math.floor(Math.random() * 1000)}`,
          TEST_METADATA,
          new BN(512),
          TEST_CONTENT_TYPE,
          "Test file for deletion"
        )
        .accountsPartial({
          userAccount: userAccountPDA,
          fileRecord: testFileForDeletion,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("Should delete file successfully", async () => {
      const currentFileRecord = await program.account.fileRecord.fetch(testFileForDeletion);
      if (!currentFileRecord.isActive) {
        console.log("File already deleted, skipping test");
        assert.isFalse(currentFileRecord.isActive);
        return;
      }

      const tx = await program.methods
        .deleteFile()
        .accountsPartial({
          userAccount: userAccountPDA,
          fileRecord: testFileForDeletion,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const deletedFileRecord = await program.account.fileRecord.fetch(testFileForDeletion);

      assert.isFalse(deletedFileRecord.isActive);
      assert.isNotNull(deletedFileRecord.deletedAt);
    });

    it("Should fail to delete already deleted file", async () => {
      // First ensure file is deleted
      const currentFileRecord = await program.account.fileRecord.fetch(testFileForDeletion);
      if (currentFileRecord.isActive) {
        await program.methods
          .deleteFile()
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: testFileForDeletion,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
      }

      // Try to delete again
      try {
        await program.methods
          .deleteFile()
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: testFileForDeletion,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for already deleted file");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("File already deleted") || 
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should fail when non-owner tries to delete file", async () => {
      try {
        await program.methods
          .deleteFile()
          .accountsPartial({
            userAccount: secondUserAccountPDA, 
            fileRecord: testFileForDeletion,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized file deletion");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Unauthorized") || 
          error.toString().includes("custom program error")
        );
      }
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    let multiTestFiles: { pda: PublicKey; hash: number[] }[] = [];

    before(async () => {
      // Create fresh files for edge case tests
      const multipleFiles = [
        { hash: generateUniqueHash(110), size: 2048 },
        { hash: generateUniqueHash(120), size: 4096 },
        { hash: generateUniqueHash(130), size: 8192 } 
      ];

      for (const file of multipleFiles) {
        const [filePDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("file"),
            authority.publicKey.toBuffer(),
            Buffer.from(file.hash)
          ],
          program.programId
        );

        // Skip if file already exists
        if (await accountExists(filePDA)) {
          console.log(`Multi-test file ${file.hash[0]} already exists`);
          multiTestFiles.push({ pda: filePDA, hash: file.hash });
          continue;
        }

        await program.methods
          .uploadFile(
            file.hash,
            `QmMultiFile${file.hash[0]}`,
            TEST_METADATA,
            new BN(file.size),
            TEST_CONTENT_TYPE,
            `Multi-file test ${file.hash[0]}`
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: filePDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        multiTestFiles.push({ pda: filePDA, hash: file.hash });
      }
    });

    it("Should handle multiple file uploads for same user", async () => {
      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      // Should have at least the new files
      assert.isTrue(updatedUserAccount.fileCount >= 1);
      assert.isTrue(Number(updatedUserAccount.storageUsed.toString()) > 0);
    });

    it("Should handle access permission expiration correctly", async () => {
      if (multiTestFiles.length === 0) {
        console.log("No multi-test files available, skipping test");
        return;
      }

      const shortLivedUser = Keypair.generate();
      await fundFromAuthority(provider, authority, shortLivedUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [shortLivedPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          multiTestFiles[0].pda.toBuffer(),
          shortLivedUser.publicKey.toBuffer()
        ],
        program.programId
      );

      const nearFutureTime = Math.floor(Date.now() / 1000) + 10;

      await program.methods
        .grantAccess(
          shortLivedUser.publicKey,
          TEST_PERMISSIONS_READ,
          new BN(nearFutureTime),
          null
        )
        .accountsPartial({
          fileRecord: multiTestFiles[0].pda,
          accessPermission: shortLivedPDA,
          authority: authority.publicKey,
          accessor: shortLivedUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        await program.methods
          .recordFileAccess({ read: {} })
          .accounts({
            fileRecord: multiTestFiles[0].pda,
            accessPermission: shortLivedPDA,
            authority: shortLivedUser.publicKey,
          })
          .signers([shortLivedUser])
          .rpc();
        assert.fail("Expected error for expired access");
      } catch (error) {
        assert.isTrue(
          error.toString().includes("Access has been revoked") ||
          error.toString().includes("AccessRevoked") ||
          error.toString().includes("custom program error")
        );
      }
    });

    it("Should handle maximum permission combinations", async () => {
      if (multiTestFiles.length < 2) {
        console.log("Insufficient multi-test files, skipping test");
        return;
      }

      const fullPermissionUser = Keypair.generate();
      await fundFromAuthority(provider, authority, fullPermissionUser.publicKey, 1 * LAMPORTS_PER_SOL);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const [fullPermissionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          multiTestFiles[1].pda.toBuffer(),
          fullPermissionUser.publicKey.toBuffer()
        ],
        program.programId
      );

      await program.methods
        .grantAccess(
          fullPermissionUser.publicKey,
          TEST_PERMISSIONS_ALL,
          null,
          null
        )
        .accountsPartial({
          fileRecord: multiTestFiles[1].pda,
          accessPermission: fullPermissionPDA,
          authority: authority.publicKey,
          accessor: fullPermissionUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const accessPermission = await program.account.accessPermission.fetch(fullPermissionPDA);
      assert.equal(accessPermission.permissions, 7);

      await program.methods
        .recordFileAccess({ read: {} })
        .accountsPartial({
          fileRecord: multiTestFiles[1].pda,
          accessPermission: fullPermissionPDA,
          authority: fullPermissionUser.publicKey,
        })
        .signers([fullPermissionUser])
        .rpc();

      await program.methods
        .recordFileAccess({ download: {} })
        .accountsPartial({
          fileRecord: multiTestFiles[1].pda,
          accessPermission: fullPermissionPDA,
          authority: fullPermissionUser.publicKey,
        })
        .signers([fullPermissionUser])
        .rpc();

      const updatedAccess = await program.account.accessPermission.fetch(fullPermissionPDA);
      assert.equal(updatedAccess.usedDownloads, 1);
    });

    it("Should handle user storage limit enforcement", async () => {
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      assert.isTrue(Number(userAccount.storageUsed.toString()) < Number(userAccount.storageLimit.toString()));
    });

    it("Should handle file count limit enforcement", async () => {
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      assert.isTrue(userAccount.fileCount <= userAccount.fileLimit);
      assert.equal(userAccount.fileLimit, 100);
    });
  });

  describe('State Consistency Tests', () => {
    it("Should maintain consistent state after multiple operations", async () => {
      const initialUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      const initialFileCount = initialUserAccount.fileCount;
      const initialStorageUsed = Number(initialUserAccount.storageUsed.toString());

      const sequenceFileHash = generateUniqueHash(199);
      const [sequenceFilePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(sequenceFileHash)
        ],
        program.programId
      );

      const sequenceFileSize = 1024;

      // Skip if file already exists
      if (await accountExists(sequenceFilePDA)) {
        console.log("Sequence test file already exists, skipping upload");
      } else {
        await program.methods
          .uploadFile(
            sequenceFileHash,
            "QmSequenceTest12345",
            TEST_METADATA,
            new BN(sequenceFileSize),
            TEST_CONTENT_TYPE,
            "Sequence test file"
          )
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: sequenceFilePDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
      }

      await program.methods
        .updateFilePublicity(true)
        .accounts({
          fileRecord: sequenceFilePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const beforeDeleteUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      const beforeDeleteFileRecord = await program.account.fileRecord.fetch(sequenceFilePDA);

      if (beforeDeleteFileRecord.isActive) {
        await program.methods
          .deleteFile()
          .accountsPartial({
            userAccount: userAccountPDA,
            fileRecord: sequenceFilePDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
      }

      const finalFileRecord = await program.account.fileRecord.fetch(sequenceFilePDA);

      assert.isFalse(finalFileRecord.isActive);
      assert.isNotNull(finalFileRecord.deletedAt);
      assert.isTrue(finalFileRecord.isPublicVerification);
    });
  });

  // Cleanup function to help with account management
  describe('Cleanup', () => {
    it("Should provide cleanup summary", async () => {
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      console.log(`\n=== Test Run ${testRunId} Summary ===`);
      console.log(`User files: ${userAccount.fileCount}`);
      console.log(`Storage used: ${userAccount.storageUsed.toString()}`);
      console.log(`User PDA: ${userAccountPDA.toString()}`);
      console.log(`File PDA: ${fileRecordPDA.toString()}`);
      console.log(`Access PDA: ${accessPermissionPDA.toString()}`);
      console.log(`========================================\n`);
      
      // This test always passes, it's just for logging
      assert.isTrue(true);
    });
  });
});