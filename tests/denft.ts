import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Denft } from "../target/types/denft";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("denft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Denft as Program<Denft>;
  const provider = anchor.AnchorProvider.env();

  // Define top-level test variables
  let authority: Keypair;
  let secondUser: Keypair;
  let thirdUser: Keypair;
  let userAccountPDA: PublicKey;
  let secondUserAccountPDA: PublicKey;
  let fileRecordPDA: PublicKey;
  let accessPermissionPDA: PublicKey;
  
  // Test data constants - Ensure all values are within valid u8 range (0-255)
  const TEST_FILE_HASH = Array.from({ length: 32 }, (_, i) => (i * 7) % 256); // Generate valid u8 values
  const TEST_IPFS_HASH = "QmTestHashExample1234567890abcdef";
  const TEST_METADATA = JSON.stringify({ name: "test-file.txt", encrypted: true });
  const TEST_FILE_SIZE = 1024;
  const TEST_CONTENT_TYPE = "text/plain";
  const TEST_DESCRIPTION = "Test file description";
  const TEST_PERMISSIONS_READ = 1;
  const TEST_PERMISSIONS_DOWNLOAD = 2;
  const TEST_PERMISSIONS_ALL = 7;

  before(async () => {
    // Initialize keypairs
    authority = Keypair.generate();
    secondUser = Keypair.generate();
    thirdUser = Keypair.generate();

    // Fund test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(secondUser.publicKey, 2 * LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(thirdUser.publicKey, 2 * LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Calculate PDAs
    [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), authority.publicKey.toBuffer()],
      program.programId
    );

    [secondUserAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), secondUser.publicKey.toBuffer()],
      program.programId
    );

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
  });

  describe('initialize_user', () => {
    it("Should initialize a new user account successfully", async () => {
      try {
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
        assert.isTrue(userAccount.createdAt.toString() !== "0");
        
        console.log("User initialization transaction signature:", tx);
      } catch (error) {
        console.error("Error in initializeUser:", error);
        throw error;
      }
    });

    it("Should initialize multiple different user accounts", async () => {
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
      assert.equal(fileRecord.accessCount.toString(), "0");
      assert.equal(fileRecord.downloadCount.toString(), "0");
      assert.isTrue(fileRecord.verificationId.toString() !== "0");

      assert.equal(updatedUserAccount.fileCount, 1);
      assert.equal(updatedUserAccount.storageUsed.toString(), TEST_FILE_SIZE.toString());
    });

    it("Should fail to upload file with zero size", async () => {
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => (i + 100) % 256);
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
        assert.include(error.toString(), "Invalid file size");
      }
    });
  });

  describe('grant access', () => {
    it("Should grant read access successfully", async () => {
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
      assert.equal(updatedFileRecord.accessCount.toString(), "1");
    });
  });

  describe('record file access', () => {
    it("Should record read access successfully", async () => {
      const tx = await program.methods
        .recordFileAccess({ read: {} })
        .accountsPartial({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: secondUser.publicKey,
        })
        .signers([secondUser])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.equal(updatedFileRecord.accessCount.toString(), "2");
    });
  });

  describe('revoke access', () => {
    it("Should revoke access successfully", async () => {
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
  });

  describe('update file publicity', () => {
    it("Should update file publicity to public successfully", async () => {
      const tx = await program.methods
        .updateFilePublicity(true)
        .accountsPartial({
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isTrue(updatedFileRecord.isPublicVerification);
    });
  });

  describe('delete file', () => {
    let testFileForDeletion: PublicKey;
    let testFileHashForDeletion: number[];

    beforeEach(async () => {
      // Generate valid u8 values (0-255) for file hash
      testFileHashForDeletion = Array.from({ length: 32 }, (_, i) => (i + Math.floor(Math.random() * 200)) % 256);
      [testFileForDeletion] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(testFileHashForDeletion)
        ],
        program.programId
      );

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
      // First delete
      await program.methods
        .deleteFile()
        .accountsPartial({
          userAccount: userAccountPDA,
          fileRecord: testFileForDeletion,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

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
        assert.include(error.toString(), "File already deleted");
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
        assert.include(error.toString(), "Unauthorized");
      }
    });
  });

  // Additional test for edge cases
  describe('Edge Cases', () => {
    it("Should handle multiple file operations correctly", async () => {
      // Create another file for testing
      const anotherFileHash = Array.from({ length: 32 }, (_, i) => (i + 50) % 256);
      const [anotherFilePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(anotherFileHash)
        ],
        program.programId
      );

      await program.methods
        .uploadFile(
          anotherFileHash,
          "QmAnotherTestFile",
          TEST_METADATA,
          new BN(2048),
          TEST_CONTENT_TYPE,
          "Another test file"
        )
        .accountsPartial({
          userAccount: userAccountPDA,
          fileRecord: anotherFilePDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      // Should have multiple files now
      assert.isTrue(updatedUserAccount.fileCount >= 2);
      
      // Total storage should be cumulative
      const expectedStorage = new BN(TEST_FILE_SIZE + 2048);
      assert.isTrue(updatedUserAccount.storageUsed.gte(expectedStorage));
    });
  });
});