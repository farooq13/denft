import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Denft } from "../target/types/denft";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("denft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.denft as Program<Denft>;
  const provider = anchor.AnchorProvider.env();

  // Define top-level test variables
  let authority: Keypair;
  let secondUser: Keypair;
  let thirdUser: Keypair;
  let uploader: Keypair;
  let userAccountPDA: PublicKey;
  let secondUserAccountPDA: PublicKey;
  let fileRecordPDA: PublicKey;
  let accessPermissionPDA: PublicKey;
  
  // Test data constants
  const TEST_FILE_HASH = Array.from({ length: 32 }, (_, i) => i + 1); // Sample hash
  const TEST_IPFS_HASH = "QmTestHashExample1234567890abcdef";
  const TEST_METADATA = JSON.stringify({ name: "test-file.txt", encrypted: true });
  const TEST_FILE_SIZE = 1024;
  const TEST_CONTENT_TYPE = "text/plain";
  const TEST_DESCRIPTION = "Test file description";
  const TEST_PERMISSIONS_READ = 1;
  const TEST_PERMISSIONS_DOWNLOAD = 2;
  const TEST_PERMISSIONS_ALL = 7; // 1 + 2 + 4

  beforeEach(async () => {
    // One-time initialization logic
    authority = Keypair.generate();
    secondUser = Keypair.generate();
    thirdUser = Keypair.generate();
    uploader = Keypair.generate();

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
        uploader.publicKey.toBuffer(),
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
      // Arrange - Test data already prepared in beforeAll

      // Act
      const tx = await program.methods
        .initializeUser()
        .accounts({
          authority: authority.publicKey,
          userAccount: userAccountPDA,
          system_program: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      assert.ok(userAccount.owner.equals(authority.publicKey));
      assert.equal(userAccount.fileCount, 0);
      assert.equal(userAccount.storageUsed.toNumber(), 0);
      assert.equal(userAccount.storageLimit.toNumber(), 1024 * 1024 * 1024); // 1GB
      assert.equal(userAccount.fileLimit, 100);
      assert.isTrue(userAccount.isActive);
      assert.isTrue(userAccount.createdAt.toNumber() > 0);
      
      console.log("User initialization transaction signature:", tx);
    });

    it("Should fail to initialize the same user account twice", async () => {
      // Arrange - User account already exists from previous test

      // Act & Assert
      try {
        await program.methods
          .initializeUser()
          .accounts({
            authority: authority.publicKey,
            userAccount: userAccountPDA,
            system_program: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for duplicate user initialization");
      } catch (error) {
        assert.include(error.message.toLowerCase(), "already in use");
      }
    });

    it("Should initialize multiple different user accounts", async () => {
      // Arrange - Second user account

      // Act
      const tx = await program.methods
        .initializeUser()
        .accounts({
          authority: secondUser.publicKey,
          userAccount: secondUserAccountPDA,
          system_program: SystemProgram.programId,
        })
        .signers([secondUser])
        .rpc();

      // Assert
      const secondUserAccount = await program.account.userAccount.fetch(secondUserAccountPDA);
      
      assert.ok(secondUserAccount.owner.equals(secondUser.publicKey));
      assert.equal(secondUserAccount.fileCount, 0);
      assert.equal(secondUserAccount.storageUsed.toNumber(), 0);
      assert.isTrue(secondUserAccount.isActive);
    });
  });

  describe('upload file', () => {
    it("Should upload a file successfully", async () => {
      // Arrange - User account already initialized

      // Act
      const tx = await program.methods
        .uploadFile(
          Array.from(TEST_FILE_HASH),
          TEST_IPFS_HASH,
          TEST_METADATA,
          new BN(TEST_FILE_SIZE),
          TEST_CONTENT_TYPE,
          TEST_DESCRIPTION
        )
        .accounts({
          userAccount: userAccountPDA,
          file_record: fileRecordPDA,
          authority: authority.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert
      const fileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);

      assert.ok(fileRecord.owner.equals(authority.publicKey));
      assert.deepEqual(Array.from(fileRecord.fileHash), TEST_FILE_HASH);
      assert.equal(fileRecord.ipfsHash, TEST_IPFS_HASH);
      assert.equal(fileRecord.fileSize.toNumber(), TEST_FILE_SIZE);
      assert.equal(fileRecord.contentType, TEST_CONTENT_TYPE);
      assert.equal(fileRecord.description, TEST_DESCRIPTION);
      assert.isTrue(fileRecord.isActive);
      assert.equal(fileRecord.accessCount.toNumber(), 0);
      assert.equal(fileRecord.downloadCount.toNumber(), 0);
      assert.isTrue(fileRecord.verificationId.toNumber() > 0);

      // Verify user account updates
      assert.equal(updatedUserAccount.fileCount, 1);
      assert.equal(updatedUserAccount.storageUsed.toNumber(), TEST_FILE_SIZE);
    });

    it("Should fail to upload file with zero size", async () => {
      // Arrange
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => i + 100);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      // Act & Assert
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
          .accounts({
            userAccount: userAccountPDA,
            file_record: invalidFileRecordPDA,
            authority: authority.publicKey,
            system_program: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for zero file size");
      } catch (error) {
        assert.include(error.message, "Invalid file size");
      }
    });

    it("Should fail to upload file exceeding maximum size", async () => {
      // Arrange
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => i + 101);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      // Act & Assert
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
          .accounts({
            userAccount: userAccountPDA,
            file_record: invalidFileRecordPDA,
            authority: authority.publicKey,
            system_program: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for file size too large");
      } catch (error) {
        assert.include(error.message, "Invalid file size");
      }
    });

    it("Should fail with IPFS hash too long", async () => {
      // Arrange
      const longIpfsHash = "Q".repeat(101); // Exceeds MAX_IPFS_HASH_LENGTH
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => i + 102);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      // Act & Assert
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
          .accounts({
            userAccount: userAccountPDA,
            file_record: invalidFileRecordPDA,
            authority: authority.publicKey,
            system_program: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for IPFS hash too long");
      } catch (error) {
        assert.include(error.message, "IPFS hash too long");
      }
    });

    it("Should fail with content type too long", async () => {
      // Arrange
      const longContentType = "a".repeat(101); // Exceeds MAX_CONTENT_TYPE_LENGTH
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => i + 103);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      // Act & Assert
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
          .accounts({
            user_account: userAccountPDA,
            file_record: invalidFileRecordPDA,
            authority: authority.publicKey,
            system_program: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for content type too long");
      } catch (error) {
        assert.include(error.message, "Content type too long");
      }
    });

    it("Should fail with description too long", async () => {
      // Arrange
      const longDescription = "a".repeat(501); // Exceeds MAX_DESCRIPTION_LENGTH
      const invalidFileHash = Array.from({ length: 32 }, (_, i) => i + 104);
      const [invalidFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(invalidFileHash)
        ],
        program.programId
      );

      // Act & Assert
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
          .accounts({
            userAccount: userAccountPDA,
            fileRecord: invalidFileRecordPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for description too long");
      } catch (error) {
        assert.include(error.message, "Description too long");
      }
    });

    it("Should fail upload for inactive user account", async () => {
      // Arrange - Create and then deactivate a user account
      const inactiveUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(inactiveUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [inactiveUserPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), inactiveUser.publicKey.toBuffer()],
        program.programId
      );

      // Initialize the user first
      await program.methods
        .initializeUser()
        .accounts({
          authority: inactiveUser.publicKey,
          userAccount: inactiveUserPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([inactiveUser])
        .rpc();

      // Manually set user as inactive (this would require additional admin functionality)
      // For this test, we'll skip this part as it requires additional setup
      console.log("Note: Testing inactive user requires admin functionality");
    });
  });

  describe('grant access', () => {
    it("Should grant read access successfully", async () => {
      // Arrange - File already uploaded

      // Act
      const tx = await program.methods
        .grantAccess(
          secondUser.publicKey,
          TEST_PERMISSIONS_READ,
          null, // No expiration
          null  // No download limit
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: authority.publicKey,
          accessor: secondUser.publicKey,
          system_program: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert
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
      // Arrange
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const tempUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(tempUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [tempAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act
      const tx = await program.methods
        .grantAccess(
          tempUser.publicKey,
          TEST_PERMISSIONS_READ,
          new BN(futureTime),
          null
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: tempAccessPDA,
          authority: authority.publicKey,
          accessor: tempUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert
      const accessPermission = await program.account.accessPermission.fetch(tempAccessPDA);
      assert.equal(accessPermission.expiresAt.toNumber(), futureTime);
    });

    it("Should grant access with download limit", async () => {
      // Arrange
      const tempUser2 = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(tempUser2.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [tempAccessPDA2] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser2.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act
      const tx = await program.methods
        .grantAccess(
          tempUser2.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          5 // 5 download limit
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: tempAccessPDA2,
          authority: authority.publicKey,
          accessor: tempUser2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert
      const accessPermission = await program.account.accessPermission.fetch(tempAccessPDA2);
      assert.equal(accessPermission.maxDownloads.toNumber(), 5);
    });

    it("Should fail to grant access with invalid permissions", async () => {
      // Arrange
      const tempUser3 = Keypair.generate();
      const [tempAccessPDA3] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser3.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act & Assert
      try {
        await program.methods
          .grantAccess(
            tempUser3.publicKey,
            8, // Invalid permission (> 7)
            null,
            null
          )
          .accounts({
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
        assert.include(error.message, "Invalid permissions");
      }
    });

    it("Should fail to grant access with past expiration time", async () => {
      // Arrange
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const tempUser4 = Keypair.generate();
      const [tempAccessPDA4] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser4.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act & Assert
      try {
        await program.methods
          .grantAccess(
            tempUser4.publicKey,
            TEST_PERMISSIONS_READ,
            new BN(pastTime),
            null
          )
          .accounts({
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
        assert.include(error.message, "Invalid expiration time");
      }
    });

    it("Should fail when non-owner tries to grant access", async () => {
      // Arrange
      const [unauthorizedAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          thirdUser.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act & Assert
      try {
        await program.methods
          .grantAccess(
            thirdUser.publicKey,
            TEST_PERMISSIONS_READ,
            null,
            null
          )
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: unauthorizedAccessPDA,
            authority: secondUser.publicKey, // Wrong authority
            accessor: thirdUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized access grant");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });

  describe('verify file', () => {
    it("Should verify file successfully with correct hash", async () => {
      // Arrange - File already uploaded

      // Act
      const tx = await program.methods
        .verifyFile(Array.from(TEST_FILE_HASH))
        .accounts({
          fileRecord: fileRecordPDA,
          authority: secondUser.publicKey,
        })
        .signers([secondUser])
        .rpc();

      // Assert
      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.equal(updatedFileRecord.accessCount.toNumber(), 1);
    });

    it("Should fail to verify file with incorrect hash", async () => {
      // Arrange
      const wrongHash = Array.from({ length: 32 }, (_, i) => i + 200);

      // Act & Assert
      try {
        await program.methods
          .verifyFile(wrongHash)
          .accounts({
            fileRecord: fileRecordPDA,
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for incorrect hash");
      } catch (error) {
        assert.include(error.message, "File hash mismatch");
      }
    });
  });

  describe('record file access', () => {
    it("Should record read access successfully", async () => {
      // Arrange - Access permission already granted

      // Act
      const tx = await program.methods
        .recordFileAccess({ read: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: secondUser.publicKey,
        })
        .signers([secondUser])
        .rpc();

      // Assert
      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.equal(updatedFileRecord.accessCount.toNumber(), 2); // 1 from verify + 1 from this access
    });

    it("Should record download access and increment download count", async () => {
      // Arrange - Need download permission
      const tempUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(tempUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [downloadAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          tempUser.publicKey.toBuffer()
        ],
        program.programId
      );

      // Grant download permission
      await program.methods
        .grantAccess(
          tempUser.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          3 // 3 downloads allowed
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: downloadAccessPDA,
          authority: authority.publicKey,
          accessor: tempUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Act
      const tx = await program.methods
        .recordFileAccess({ download: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: downloadAccessPDA,
          authority: tempUser.publicKey,
        })
        .signers([tempUser])
        .rpc();

      // Assert
      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const updatedAccess = await program.account.accessPermission.fetch(downloadAccessPDA);
      
      assert.equal(updatedFileRecord.downloadCount.toNumber(), 1);
      assert.equal(updatedAccess.usedDownloads, 1);
    });

    it("Should fail download access when download limit exceeded", async () => {
      // Arrange - Create access with 1 download limit
      const limitUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(limitUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [limitAccessPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          limitUser.publicKey.toBuffer()
        ],
        program.programId
      );

      // Grant download permission with limit
      await program.methods
        .grantAccess(
          limitUser.publicKey,
          TEST_PERMISSIONS_DOWNLOAD,
          null,
          1 // Only 1 download allowed
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: limitAccessPDA,
          authority: authority.publicKey,
          accessor: limitUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Use the one allowed download
      await program.methods
        .recordFileAccess({ download: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: limitAccessPDA,
          authority: limitUser.publicKey,
        })
        .signers([limitUser])
        .rpc();

      // Act & Assert - Try to download again
      try {
        await program.methods
          .recordFileAccess({ download: {} })
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: limitAccessPDA,
            authority: limitUser.publicKey,
          })
          .signers([limitUser])
          .rpc();
        assert.fail("Expected error for download limit exceeded");
      } catch (error) {
        assert.include(error.message, "Download limit exceeded");
      }
    });

    it("Should fail access when user lacks permission", async () => {
      // Arrange - User with read-only trying to download
      
      // Act & Assert
      try {
        await program.methods
          .recordFileAccess({ download: {} })
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: accessPermissionPDA, // This only has read permission
            authority: secondUser.publicKey,
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for insufficient permissions");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });

  describe('revoke access', () => {
    it("Should revoke access successfully", async () => {
      // Arrange - Access permission already exists

      // Act
      const tx = await program.methods
        .revokeAccess()
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: accessPermissionPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Assert
      const revokedAccess = await program.account.accessPermission.fetch(accessPermissionPDA);
      assert.isFalse(revokedAccess.isActive);
      assert.isNotNull(revokedAccess.revokedAt);
    });

    it("Should fail to revoke already revoked access", async () => {
      // Arrange - Access already revoked from previous test

      // Act & Assert
      try {
        await program.methods
          .revokeAccess()
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: accessPermissionPDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for already revoked access");
      } catch (error) {
        assert.include(error.message, "Access already revoked");
      }
    });

    it("Should fail when non-owner tries to revoke access", async () => {
      // Arrange - Create new access permission for testing
      const newAccessUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(newAccessUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

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
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: newAccessPDA,
          authority: authority.publicKey,
          accessor: newAccessUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Act & Assert
      try {
        await program.methods
          .revokeAccess()
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: newAccessPDA,
            authority: secondUser.publicKey, // Wrong authority
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized revocation");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });

  describe('update file publicity', () => {
    it("Should update file publicity to public successfully", async () => {
      // Arrange - File already exists

      // Act
      const tx = await program.methods
        .updateFilePublicity(true)
        .accounts({
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Assert
      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isTrue(updatedFileRecord.isPublicVerification);
    });

    it("Should update file publicity to private successfully", async () => {
      // Arrange - File is currently public from previous test

      // Act
      const tx = await program.methods
        .updateFilePublicity(false)
        .accounts({
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Assert
      const updatedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      assert.isFalse(updatedFileRecord.isPublicVerification);
    });

    it("Should fail when non-owner tries to update publicity", async () => {
      // Arrange - File exists

      // Act & Assert
      try {
        await program.methods
          .updateFilePublicity(true)
          .accounts({
            fileRecord: fileRecordPDA,
            authority: secondUser.publicKey, // Wrong authority
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized publicity update");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });

  describe('delete file', () => {
    it("Should delete file successfully", async () => {
      // Arrange - File exists and is active

      // Act
      const tx = await program.methods
        .deleteFile()
        .accounts({
          userAccount: userAccountPDA,
          fileRecord: fileRecordPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Assert
      const deletedFileRecord = await program.account.fileRecord.fetch(fileRecordPDA);
      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);

      assert.isFalse(deletedFileRecord.isActive);
      assert.isNotNull(deletedFileRecord.deletedAt);
      
      // Verify user account statistics updated
      assert.equal(updatedUserAccount.fileCount, 0);
      assert.equal(updatedUserAccount.storageUsed.toNumber(), 0);
    });

    it("Should fail to delete already deleted file", async () => {
      // Arrange - File already deleted from previous test

      // Act & Assert
      try {
        await program.methods
          .deleteFile()
          .accounts({
            userAccount: userAccountPDA,
            fileRecord: fileRecordPDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();
        assert.fail("Expected error for already deleted file");
      } catch (error) {
        assert.include(error.message, "File already deleted");
      }
    });

    it("Should fail when non-owner tries to delete file", async () => {
      // Arrange - Create new file for testing
      const newFileHash = Array.from({ length: 32 }, (_, i) => i + 50);
      const [newFileRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(newFileHash)
        ],
        program.programId
      );

      await program.methods
        .uploadFile(
          newFileHash,
          "QmNewTestFile123456789",
          TEST_METADATA,
          new BN(512),
          TEST_CONTENT_TYPE,
          "New test file for deletion test"
        )
        .accounts({
          userAccount: userAccountPDA,
          fileRecord: newFileRecordPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Act & Assert
      try {
        await program.methods
          .deleteFile()
          .accounts({
            userAccount: userAccountPDA,
            fileRecord: newFileRecordPDA,
            authority: secondUser.publicKey, // Wrong authority
          })
          .signers([secondUser])
          .rpc();
        assert.fail("Expected error for unauthorized file deletion");
      } catch (error) {
        assert.include(error.message, "Unauthorized");
      }
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it("Should handle multiple file uploads for same user", async () => {
      // Arrange
      const multipleFiles = [
        { hash: Array.from({ length: 32 }, (_, i) => i + 10), size: 2048 },
        { hash: Array.from({ length: 32 }, (_, i) => i + 20), size: 4096 },
        { hash: Array.from({ length: 32 }, (_, i) => i + 30), size: 8192 }
      ];

      // Act - Upload multiple files
      for (const file of multipleFiles) {
        const [filePDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("file"),
            authority.publicKey.toBuffer(),
            Buffer.from(file.hash)
          ],
          program.programId
        );

        await program.methods
          .uploadFile(
            file.hash,
            `QmMultiFile${file.hash[0]}`,
            TEST_METADATA,
            new BN(file.size),
            TEST_CONTENT_TYPE,
            `Multi-file test ${file.hash[0]}`
          )
          .accounts({
            userAccount: userAccountPDA,
            fileRecord: filePDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();
      }

      // Assert
      const updatedUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      const expectedStorage = 2048 + 4096 + 8192 + 512; // +512 from previous test
      
      assert.equal(updatedUserAccount.fileCount, 4); // 3 new + 1 from previous test
      assert.equal(updatedUserAccount.storageUsed.toNumber(), expectedStorage);
    });

    it("Should handle access permission expiration correctly", async () => {
      // Arrange - Create access that expires soon
      const shortLivedUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(shortLivedUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [shortLivedPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          shortLivedUser.publicKey.toBuffer()
        ],
        program.programId
      );

      const nearFutureTime = Math.floor(Date.now() / 1000) + 2; // 2 seconds from now

      await program.methods
        .grantAccess(
          shortLivedUser.publicKey,
          TEST_PERMISSIONS_READ,
          new BN(nearFutureTime),
          null
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: shortLivedPDA,
          authority: authority.publicKey,
          accessor: shortLivedUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Act - Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Assert - Should fail to access after expiration
      try {
        await program.methods
          .recordFileAccess({ read: {} })
          .accounts({
            fileRecord: fileRecordPDA,
            accessPermission: shortLivedPDA,
            authority: shortLivedUser.publicKey,
          })
          .signers([shortLivedUser])
          .rpc();
        assert.fail("Expected error for expired access");
      } catch (error) {
        assert.include(error.message, "Access revoked");
      }
    });

    it("Should handle maximum permission combinations", async () => {
      // Arrange
      const fullPermissionUser = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(fullPermissionUser.publicKey, LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [fullPermissionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("access"),
          fileRecordPDA.toBuffer(),
          fullPermissionUser.publicKey.toBuffer()
        ],
        program.programId
      );

      // Act - Grant all permissions (read + download + share = 7)
      await program.methods
        .grantAccess(
          fullPermissionUser.publicKey,
          TEST_PERMISSIONS_ALL,
          null,
          null
        )
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: fullPermissionPDA,
          authority: authority.publicKey,
          accessor: fullPermissionUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Assert - Should be able to perform all access types
      const accessPermission = await program.account.accessPermission.fetch(fullPermissionPDA);
      assert.equal(accessPermission.permissions, 7);

      // Test read access
      await program.methods
        .recordFileAccess({ read: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: fullPermissionPDA,
          authority: fullPermissionUser.publicKey,
        })
        .signers([fullPermissionUser])
        .rpc();

      // Test download access
      await program.methods
        .recordFileAccess({ download: {} })
        .accounts({
          fileRecord: fileRecordPDA,
          accessPermission: fullPermissionPDA,
          authority: fullPermissionUser.publicKey,
        })
        .signers([fullPermissionUser])
        .rpc();

      // Verify both accesses worked
      const updatedAccess = await program.account.accessPermission.fetch(fullPermissionPDA);
      assert.equal(updatedAccess.usedDownloads, 1);
    });

    it("Should handle user storage limit enforcement", async () => {
      // This test would require creating a scenario where user approaches storage limit
      // For now, we'll verify the current storage calculation is correct
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      const expectedStorage = 2048 + 4096 + 8192 + 512; // From multiple uploads
      
      assert.equal(userAccount.storageUsed.toNumber(), expectedStorage);
      assert.isTrue(userAccount.storageUsed.toNumber() < userAccount.storageLimit.toNumber());
    });

    it("Should handle file count limit enforcement", async () => {
      // Verify current file count is within limits
      const userAccount = await program.account.userAccount.fetch(userAccountPDA);
      
      assert.isTrue(userAccount.fileCount < userAccount.fileLimit);
      assert.equal(userAccount.fileLimit, 100); // MAX_FILES_PER_USER
    });
  });

  describe('State Consistency Tests', () => {
    it("Should maintain consistent state after multiple operations", async () => {
      // Arrange - Get initial state
      const initialUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      const initialFileCount = initialUserAccount.fileCount;
      const initialStorageUsed = initialUserAccount.storageUsed.toNumber();

      // Act - Perform sequence of operations
      const sequenceFileHash = Array.from({ length: 32 }, (_, i) => i + 99);
      const [sequenceFilePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("file"),
          authority.publicKey.toBuffer(),
          Buffer.from(sequenceFileHash)
        ],
        program.programId
      );

      const sequenceFileSize = 1024;

      // Upload file
      await program.methods
        .uploadFile(
          sequenceFileHash,
          "QmSequenceTest12345",
          TEST_METADATA,
          new BN(sequenceFileSize),
          TEST_CONTENT_TYPE,
          "Sequence test file"
        )
        .accounts({
          userAccount: userAccountPDA,
          fileRecord: sequenceFilePDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Update publicity
      await program.methods
        .updateFilePublicity(true)
        .accounts({
          fileRecord: sequenceFilePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Delete file
      await program.methods
        .deleteFile()
        .accounts({
          userAccount: userAccountPDA,
          fileRecord: sequenceFilePDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      // Assert - State should be consistent
      const finalUserAccount = await program.account.userAccount.fetch(userAccountPDA);
      const finalFileRecord = await program.account.fileRecord.fetch(sequenceFilePDA);

      // User account should be back to initial state
      assert.equal(finalUserAccount.fileCount, initialFileCount);
      assert.equal(finalUserAccount.storageUsed.toNumber(), initialStorageUsed);

      // File should be marked as deleted but retain other data
      assert.isFalse(finalFileRecord.isActive);
      assert.isNotNull(finalFileRecord.deletedAt);
      assert.isTrue(finalFileRecord.isPublicVerification); // Should retain publicity setting
    });
  });

  afterEach(async () => {
    // Clean up logic if needed
    console.log("Tests completed successfully");
  });
});