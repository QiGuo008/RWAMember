// Database operations for platform verification data
import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export interface PlatformData {
  platform: string;
  isConnected: boolean;
  data: string;
  attestation: unknown;
  verifiedAt: string;
  vipStatus?: string;
  expiryDate?: string;
}

// Helper functions for database operations using Prisma
export const getUserPlatforms = async (address: string): Promise<PlatformData[]> => {
  try {
    // Find user by address
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        platformVerifications: {
          include: {
            platformStatus: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return [];
    }

    return user.platformVerifications.map(verification => {
      const status = verification.platformStatus[0];
      return {
        platform: verification.platform,
        isConnected: verification.isConnected,
        data: verification.verificationData ? JSON.stringify(verification.verificationData) : '',
        attestation: verification.attestationData,
        verifiedAt: verification.verifiedAt.toISOString(),
        vipStatus: status?.vipStatus || 'Unknown',
        expiryDate: status?.expiryDate?.toLocaleDateString() || 'Unknown'
      };
    });
  } catch (error) {
    console.error('Error getting user platforms:', error);
    return [];
  }
};

export const savePlatformVerification = async (
  address: string, 
  platform: string, 
  attestation: unknown, 
  verificationData: string
): Promise<void> => {
  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { address }
      });
    }

    // Parse verification data to extract VIP info
    let vipStatus = 'Unknown';
    let expiryDate: Date | null = null;
    let level: string | null = null;
    let parsedData: Record<string, unknown> | null = null;

    try {
      parsedData = JSON.parse(verificationData) as Record<string, unknown>;
      
      if (platform === 'bilibili' && parsedData) {
        level = (parsedData.current_level as string) || null;
        vipStatus = parsedData.current_level ? `Level ${parsedData.current_level}` : 'Unknown';
        if (parsedData.vipDueDate) {
          expiryDate = new Date(parseInt(parsedData.vipDueDate as string));
        }
      } else if (platform === 'youku' && parsedData) {
        vipStatus = parsedData.is_vip === '1' ? 'VIP Active' : 'Not VIP';
        if (parsedData.exptime) {
          expiryDate = new Date(parsedData.exptime as string);
        }
      }
    } catch (error) {
      console.error('Error parsing verification data:', error);
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Upsert platform verification
      const verification = await tx.platformVerification.upsert({
        where: {
          userId_platform: {
            userId: user!.id,
            platform
          }
        },
        update: {
          isConnected: true,
          verificationData: parsedData as Prisma.InputJsonValue,
          attestationData: attestation as Prisma.InputJsonValue,
          verifiedAt: new Date(),
          expiresAt: expiryDate
        },
        create: {
          userId: user!.id,
          platform,
          isConnected: true,
          verificationData: parsedData as Prisma.InputJsonValue,
          attestationData: attestation as Prisma.InputJsonValue,
          expiresAt: expiryDate
        }
      });

      // Create platform status record
      await tx.platformStatus.create({
        data: {
          verificationId: verification.id,
          platform,
          vipStatus,
          level,
          expiryDate,
          rawData: parsedData as Prisma.InputJsonValue
        }
      });
    });

    console.log(`Saved platform data for ${address} on ${platform}`);
  } catch (error) {
    console.error('Error saving platform verification:', error);
    throw error;
  }
};