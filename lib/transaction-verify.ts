import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { monadTestnet } from '@/lib/chains';

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http()
});

export interface TransactionVerification {
  isValid: boolean;
  transactionHash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: bigint | null;
  error?: string;
}

/**
 * Verify a transaction on Monad testnet
 * @param txHash - Transaction hash to verify
 * @param expectedTo - Expected recipient address (NEXT_PUBLIC_ADMIN_ADDRESS)
 * @param expectedAmount - Expected amount in MON (e.g., "0.1")
 * @returns Promise<TransactionVerification>
 */
export async function verifyTransaction(
  txHash: string,
  expectedTo: string,
  expectedAmount: string
): Promise<TransactionVerification> {
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    });

    if (!receipt || receipt.status !== 'success') {
      return {
        isValid: false,
        transactionHash: txHash,
        from: '',
        to: '',
        value: '0',
        blockNumber: null,
        error: 'Transaction not found or failed'
      };
    }

    // Get transaction details
    const transaction = await publicClient.getTransaction({
      hash: txHash as `0x${string}`
    });

    if (!transaction) {
      return {
        isValid: false,
        transactionHash: txHash,
        from: '',
        to: '',
        value: '0',
        blockNumber: null,
        error: 'Transaction details not found'
      };
    }

    const from = transaction.from.toLowerCase();
    const to = transaction.to?.toLowerCase() || '';
    const value = formatEther(transaction.value);
    const blockNumber = receipt.blockNumber;

    // Verify recipient address
    if (to !== expectedTo.toLowerCase()) {
      return {
        isValid: false,
        transactionHash: txHash,
        from,
        to,
        value,
        blockNumber,
        error: `Transaction sent to wrong address. Expected: ${expectedTo}, Got: ${to}`
      };
    }

    // Verify amount (allow small precision differences)
    const expectedValueWei = parseEther(expectedAmount);
    const actualValueWei = transaction.value;
    
    if (actualValueWei < expectedValueWei) {
      return {
        isValid: false,
        transactionHash: txHash,
        from,
        to,
        value,
        blockNumber,
        error: `Insufficient amount. Expected: ${expectedAmount} MON, Got: ${value} MON`
      };
    }

    return {
      isValid: true,
      transactionHash: txHash,
      from,
      to,
      value,
      blockNumber
    };

  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      isValid: false,
      transactionHash: txHash,
      from: '',
      to: '',
      value: '0',
      blockNumber: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if a transaction hash has already been used
 * @param txHash - Transaction hash to check
 * @returns Promise<boolean>
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function isTransactionUsed(txHash: string): Promise<boolean> {
  // This would need to be implemented with your database
  // For now, returning false - implement with actual database check
  return false;
}