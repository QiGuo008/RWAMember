// Database operations for membership rentals
import { prisma } from './prisma'
import { verifyTransaction } from './transaction-verify'

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

/**
 * Check if a transaction has already been used
 */
export const isTransactionUsed = async (transactionHash: string): Promise<boolean> => {
  try {
    const existingTx = await prisma.usedTransaction.findUnique({
      where: { transactionHash }
    });
    return !!existingTx;
  } catch (error) {
    console.error('Error checking transaction usage:', error);
    return false;
  }
};

/**
 * Mark a transaction as used
 */
export const markTransactionUsed = async (
  transactionHash: string,
  fromAddress: string,
  toAddress: string,
  amountWei: string,
  blockNumber: bigint | null,
  usedFor: string,
  rentalId?: number
) => {
  try {
    await prisma.usedTransaction.create({
      data: {
        transactionHash,
        fromAddress,
        toAddress,
        amountWei,
        blockNumber: blockNumber ? Number(blockNumber) : null,
        usedFor,
        rentalId
      }
    });
  } catch (error) {
    console.error('Error marking transaction as used:', error);
    throw error;
  }
};

export const createRental = async (
  sharedMembershipId: string,
  renterAddress: string,
  transactionHash: string
) => {
  try {
    const membershipId = parseInt(sharedMembershipId);
    
    if (!transactionHash) {
      throw new Error('Transaction hash is required');
    }

    // Check if transaction has already been used
    const txUsed = await isTransactionUsed(transactionHash);
    if (txUsed) {
      throw new Error('Transaction has already been used');
    }

    // Verify transaction on blockchain
    const adminAddress = process.env.ADMIN_ADDRESS;
    if (!adminAddress) {
      throw new Error('Admin address not configured');
    }

    const txVerification = await verifyTransaction(transactionHash, adminAddress, '0.1');
    if (!txVerification.isValid) {
      throw new Error(`Transaction verification failed: ${txVerification.error}`);
    }

    // Verify that the sender is the renter
    if (txVerification.from.toLowerCase() !== renterAddress.toLowerCase()) {
      throw new Error('Transaction sender does not match renter address');
    }
    
    // Find the shared membership with all details
    const sharedMembership = await prisma.sharedMembership.findFirst({
      where: {
        id: membershipId,
        isActive: true
      },
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
      }
    });

    if (!sharedMembership) {
      throw new Error('Shared membership not found or inactive');
    }

    // Check if user is trying to rent their own membership
    if (sharedMembership.owner.address === renterAddress) {
      throw new Error('Cannot rent your own membership');
    }

    // Find or create renter user
    let renterUser = await prisma.user.findUnique({
      where: { address: renterAddress }
    });

    if (!renterUser) {
      renterUser = await prisma.user.create({
        data: { address: renterAddress }
      });
    }

    // Check if max shares reached
    const activeRentalsCount = await prisma.membershipRental.count({
      where: {
        sharedMembershipId: membershipId,
        status: 'active'
      }
    });

    if (activeRentalsCount >= sharedMembership.maxShares) {
      throw new Error('Maximum shares reached for this membership');
    }

    // Calculate expiry date
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + sharedMembership.durationDays * 24 * 60 * 60 * 1000);

    // Create rental record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create rental
      const rental = await tx.membershipRental.create({
        data: {
          sharedMembershipId: membershipId,
          renterId: renterUser!.id,
          renterAddress,
          pricePaid: sharedMembership.priceMon,
          durationDays: sharedMembership.durationDays,
          startsAt,
          expiresAt,
          status: 'active',
          transactionHash
        }
      });

      // Mark transaction as used
      await tx.usedTransaction.create({
        data: {
          transactionHash,
          fromAddress: txVerification.from,
          toAddress: txVerification.to,
          amountWei: (BigInt(Math.floor(parseFloat(txVerification.value) * 1e18))).toString(),
          blockNumber: txVerification.blockNumber ? Number(txVerification.blockNumber) : null,
          usedFor: 'rental',
          rentalId: rental.id
        }
      });

      // Update shared membership stats
      await tx.sharedMembership.update({
        where: { id: membershipId },
        data: {
          timesShared: { increment: 1 }
        }
      });

      return rental;
    });

    return {
      rental: {
        id: result.id,
        sharedMembershipId: result.sharedMembershipId,
        renterId: renterAddress,
        renterAddress: result.renterAddress,
        pricePaid: Number(result.pricePaid),
        durationDays: result.durationDays,
        startsAt: result.startsAt.toISOString(),
        expiresAt: result.expiresAt.toISOString(),
        status: result.status as 'active' | 'expired' | 'cancelled',
        transactionHash: result.transactionHash,
        createdAt: result.createdAt.toISOString()
      },
      sharedMembership: {
        id: sharedMembership.id,
        ownerId: sharedMembership.owner.address,
        platform: sharedMembership.platform,
        priceMon: Number(sharedMembership.priceMon),
        durationDays: sharedMembership.durationDays,
        isActive: sharedMembership.isActive,
        timesShared: sharedMembership.timesShared + 1,
        maxShares: sharedMembership.maxShares,
        createdAt: sharedMembership.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
        platformData: {
          platform: sharedMembership.verification.platform,
          vipStatus: sharedMembership.verification.platformStatus[0]?.vipStatus || 'Unknown',
          expiryDate: sharedMembership.verification.platformStatus[0]?.expiryDate?.toLocaleDateString() || 'Unknown'
        }
      }
    };
  } catch (error) {
    console.error('Error creating rental:', error);
    throw error;
  }
};

export const getUserRentals = async (renterAddress: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { address: renterAddress },
      include: {
        membershipRentals: {
          include: {
            sharedMembership: {
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
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return [];
    }

    return user.membershipRentals.map(rental => ({
      id: rental.id.toString(),
      sharedMembershipId: rental.sharedMembershipId.toString(),
      renterAddress: rental.renterAddress,
      pricePaid: Number(rental.pricePaid),
      durationDays: rental.durationDays,
      startsAt: rental.startsAt.toISOString(),
      expiresAt: rental.expiresAt.toISOString(),
      status: rental.status,
      transactionHash: rental.transactionHash,
      createdAt: rental.createdAt.toISOString(),
      sharedMembership: {
        id: rental.sharedMembership.id.toString(),
        ownerId: rental.sharedMembership.owner.address,
        platform: rental.sharedMembership.platform,
        priceMon: Number(rental.sharedMembership.priceMon),
        durationDays: rental.sharedMembership.durationDays,
        isActive: rental.sharedMembership.isActive,
        timesShared: rental.sharedMembership.timesShared,
        maxShares: rental.sharedMembership.maxShares,
        createdAt: rental.sharedMembership.createdAt.toISOString(),
        updatedAt: rental.sharedMembership.updatedAt.toISOString(),
        platformData: {
          platform: rental.sharedMembership.verification.platform,
          vipStatus: rental.sharedMembership.verification.platformStatus[0]?.vipStatus || 'Unknown',
          expiryDate: rental.sharedMembership.verification.platformStatus[0]?.expiryDate?.toLocaleDateString() || 'Unknown'
        }
      }
    }));
  } catch (error) {
    console.error('Error getting user rentals:', error);
    throw error;
  }
};