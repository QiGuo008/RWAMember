// Database operations for shared memberships
import { prisma } from './prisma'
import { PlatformData } from './mock-database'

export interface SharedMembershipData {
  id: number;
  ownerId: string;
  platform: string;
  priceMon: number;
  durationDays: number;
  isActive: boolean;
  timesShared: number;
  maxShares: number;
  createdAt: string;
  updatedAt: string;
  platformData: PlatformData;
}

export interface MembershipRentalData {
  id: number;
  sharedMembershipId: number;
  renterId: string;
  renterAddress: string;
  pricePaid: number;
  durationDays: number;
  startsAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'cancelled';
  transactionHash?: string;
  createdAt: string;
}

export const shareUserPlatform = async (
  address: string,
  platform: string
): Promise<SharedMembershipData> => {
  try {
    // Find user by address first
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        platformVerifications: true
      }
    });


    if (!user) {
      throw new Error(`User with address ${address} not found`);
    }

    // Now get user with filtered platform verifications
    const userWithPlatform = await prisma.user.findUnique({
      where: { address },
      include: {
        platformVerifications: {
          where: {
            platform,
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

    if (!userWithPlatform || userWithPlatform.platformVerifications.length === 0) {
      throw new Error(`Platform ${platform} not verified or not connected for address ${address}`);
    }

    const verification = userWithPlatform.platformVerifications[0];
    
    // Check if already sharing this platform
    const existingShare = await prisma.sharedMembership.findFirst({
      where: {
        ownerId: userWithPlatform.id,
        platform,
        isActive: true
      }
    });

    if (existingShare) {
      throw new Error('Platform already being shared');
    }

    // Create new shared membership
    const sharedMembership = await prisma.sharedMembership.create({
      data: {
        ownerId: userWithPlatform.id,
        verificationId: verification.id,
        platform,
        priceMon: 0.1,
        durationDays: 1,
        isActive: true,
        timesShared: 0,
        maxShares: 1
      }
    });

    const status = verification.platformStatus[0];
    
    return {
      id: sharedMembership.id,
      ownerId: address,
      platform,
      priceMon: Number(sharedMembership.priceMon),
      durationDays: sharedMembership.durationDays,
      isActive: sharedMembership.isActive,
      timesShared: sharedMembership.timesShared,
      maxShares: sharedMembership.maxShares,
      createdAt: sharedMembership.createdAt.toISOString(),
      updatedAt: sharedMembership.updatedAt.toISOString(),
      platformData: {
        platform: verification.platform,
        isConnected: verification.isConnected,
        data: verification.verificationData ? JSON.stringify(verification.verificationData) : '',
        attestation: verification.attestationData,
        verifiedAt: verification.verifiedAt.toISOString(),
        vipStatus: status?.vipStatus || 'Unknown',
        expiryDate: status?.expiryDate?.toLocaleDateString() || 'Unknown'
      }
    };
  } catch (error) {
    console.error('Error sharing platform:', error);
    throw error;
  }
};

export const getSharedMemberships = async (
  platform?: string,
  owner?: string
): Promise<SharedMembershipData[]> => {
  try {
    const whereClause: Record<string, unknown> = {
      isActive: true
    };

    if (platform) {
      whereClause.platform = platform;
    }

    if (owner) {
      whereClause.owner = {
        address: owner
      };
    }

    const sharedMemberships = await prisma.sharedMembership.findMany({
      where: whereClause,
      include: {
        owner: true,
        verification: {
          include: {
            platformStatus: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sharedMemberships.map(membership => {
      const status = membership.verification.platformStatus[0];
      
      return {
        id: membership.id,
        ownerId: membership.owner.address,
        platform: membership.platform,
        priceMon: Number(membership.priceMon),
        durationDays: membership.durationDays,
        isActive: membership.isActive,
        timesShared: membership.timesShared,
        maxShares: membership.maxShares,
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
        platformData: {
          platform: membership.verification.platform,
          isConnected: membership.verification.isConnected,
          data: membership.verification.verificationData ? JSON.stringify(membership.verification.verificationData) : '',
          attestation: membership.verification.attestationData,
          verifiedAt: membership.verification.verifiedAt.toISOString(),
          vipStatus: status?.vipStatus || 'Unknown',
          expiryDate: status?.expiryDate?.toLocaleDateString() || 'Unknown'
        }
      };
    });
  } catch (error) {
    console.error('Error getting shared memberships:', error);
    throw error;
  }
};