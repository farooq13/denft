import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({
    where: { walletAddress: 'test_wallet' },
    update: {},
    create: { walletAddress: 'test_wallet', fileCount: 1, storageUsed: BigInt(100), theme: 'system', viewMode: 'grid' }
  });
  await prisma.file.create({
    data: {
      ownerWallet: user.walletAddress,
      fileHash: 'testhash',
      ipfsHash: 'testipfs',
      fileName: 'test.txt',
      fileSize: BigInt(1024),
      contentType: 'text/plain',
      isPublic: true,
      category: 'other'
    }
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
