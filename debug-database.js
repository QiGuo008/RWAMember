#!/usr/bin/env node

// Database inspection script for debugging the sharing function issue
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error'],
});

async function inspectDatabase() {
  console.log('🔍 Database Inspection Report\n');
  
  try {
    // Check if database connection is working
    console.log('📊 Database Connection Test...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Check users table
    console.log('👥 Users Table:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        address: true,
        createdAt: true,
        _count: {
          select: {
            platformVerifications: true,
            sharedMemberships: true
          }
        }
      }
    });
    
    console.log(`   Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. Address: ${user.address}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Platform Verifications: ${user._count.platformVerifications}`);
      console.log(`      Shared Memberships: ${user._count.sharedMemberships}`);
      console.log(`      Created: ${user.createdAt.toISOString()}`);
    });
    console.log();
    
    // Check platform verifications table
    console.log('🔗 Platform Verifications Table:');
    const verifications = await prisma.platformVerification.findMany({
      include: {
        user: {
          select: {
            address: true
          }
        },
        platformStatus: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    console.log(`   Total verifications: ${verifications.length}`);
    verifications.forEach((verification, index) => {
      const status = verification.platformStatus[0];
      console.log(`   ${index + 1}. User: ${verification.user.address}`);
      console.log(`      Platform: ${verification.platform}`);
      console.log(`      Is Connected: ${verification.isConnected}`);
      console.log(`      Verified At: ${verification.verifiedAt.toISOString()}`);
      console.log(`      VIP Status: ${status?.vipStatus || 'No status'}`);
      console.log(`      Expiry Date: ${status?.expiryDate?.toDateString() || 'No expiry'}`);
      console.log(`      Has Verification Data: ${verification.verificationData ? 'Yes' : 'No'}`);
      console.log(`      Has Attestation Data: ${verification.attestationData ? 'Yes' : 'No'}`);
    });
    console.log();
    
    // Check platform status table
    console.log('📈 Platform Status Table:');
    const statuses = await prisma.platformStatus.findMany({
      include: {
        verification: {
          include: {
            user: {
              select: {
                address: true
              }
            }
          }
        }
      }
    });
    
    console.log(`   Total status records: ${statuses.length}`);
    statuses.forEach((status, index) => {
      console.log(`   ${index + 1}. User: ${status.verification.user.address}`);
      console.log(`      Platform: ${status.platform}`);
      console.log(`      VIP Status: ${status.vipStatus || 'Unknown'}`);
      console.log(`      Level: ${status.level || 'N/A'}`);
      console.log(`      Expiry Date: ${status.expiryDate?.toDateString() || 'No expiry'}`);
      console.log(`      Created: ${status.createdAt.toISOString()}`);
    });
    console.log();
    
    // Check shared memberships table
    console.log('🔄 Shared Memberships Table:');
    const sharedMemberships = await prisma.sharedMembership.findMany({
      include: {
        owner: {
          select: {
            address: true
          }
        },
        verification: {
          select: {
            platform: true,
            isConnected: true
          }
        }
      }
    });
    
    console.log(`   Total shared memberships: ${sharedMemberships.length}`);
    sharedMemberships.forEach((membership, index) => {
      console.log(`   ${index + 1}. Owner: ${membership.owner.address}`);
      console.log(`      Platform: ${membership.platform}`);
      console.log(`      Price (MON): ${membership.priceMon}`);
      console.log(`      Duration: ${membership.durationDays} days`);
      console.log(`      Is Active: ${membership.isActive}`);
      console.log(`      Times Shared: ${membership.timesShared}`);
      console.log(`      Max Shares: ${membership.maxShares}`);
      console.log(`      Created: ${membership.createdAt.toISOString()}`);
    });
    console.log();
    
    // Test the specific query that's failing in share-database.ts
    console.log('🔍 Testing Problematic Query (shareUserPlatform function):');
    const testAddress = users.length > 0 ? users[0].address : '0x1234567890123456789012345678901234567890';
    const testPlatform = 'bilibili';
    
    console.log(`   Testing with address: ${testAddress}`);
    console.log(`   Testing with platform: ${testPlatform}`);
    
    const testUser = await prisma.user.findUnique({
      where: { address: testAddress },
      include: {
        platformVerifications: {
          where: {
            platform: testPlatform,
            isConnected: true
          },
          include: {
            platformStatus: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });
    
    if (!testUser) {
      console.log(`   ❌ No user found with address: ${testAddress}`);
    } else {
      console.log(`   ✅ User found: ${testUser.address}`);
      console.log(`   Platform verifications found: ${testUser.platformVerifications.length}`);
      
      if (testUser.platformVerifications.length === 0) {
        console.log(`   ❌ No platform verifications found for ${testPlatform} (isConnected: true)`);
        
        // Check if there are any verifications for this user at all
        const allVerifications = await prisma.platformVerification.findMany({
          where: { userId: testUser.id },
          select: {
            platform: true,
            isConnected: true
          }
        });
        
        console.log(`   Available verifications for this user:`);
        allVerifications.forEach(v => {
          console.log(`     - ${v.platform}: isConnected=${v.isConnected}`);
        });
      } else {
        console.log(`   ✅ Platform verification found for ${testPlatform}`);
        testUser.platformVerifications.forEach(v => {
          console.log(`     Platform: ${v.platform}, Connected: ${v.isConnected}`);
        });
      }
    }
    
    console.log('\n📝 Summary:');
    console.log(`   - Total Users: ${users.length}`);
    console.log(`   - Total Platform Verifications: ${verifications.length}`);
    console.log(`   - Total Platform Status Records: ${statuses.length}`);
    console.log(`   - Total Shared Memberships: ${sharedMemberships.length}`);
    
    if (users.length === 0) {
      console.log('\n⚠️  WARNING: No users found in database. You may need to:');
      console.log('   1. Connect a wallet and sign in to create a user record');
      console.log('   2. Run database migrations if not already done');
    }
    
    if (verifications.length === 0) {
      console.log('\n⚠️  WARNING: No platform verifications found. You may need to:');
      console.log('   1. Verify a platform (bilibili, youku) through the UI');
      console.log('   2. Ensure the verification process completes successfully');
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. Make sure:');
      console.log('   1. PostgreSQL is running');
      console.log('   2. DATABASE_URL environment variable is set correctly');
      console.log('   3. Database exists and is accessible');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the inspection
inspectDatabase().catch(console.error);