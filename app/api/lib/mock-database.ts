// Mock database for storing platform verification data
// In production, this should be replaced with a real database

export interface PlatformData {
  platform: string;
  isConnected: boolean;
  data: string;
  attestation: any;
  verifiedAt: string;
  vipStatus?: string;
  expiryDate?: string;
}

// Global mock database instance
export const mockDatabase: { [address: string]: PlatformData[] } = {};

// Helper functions for database operations
export const getUserPlatforms = (address: string): PlatformData[] => {
  return mockDatabase[address] || [];
};

export const savePlatformVerification = (
  address: string, 
  platform: string, 
  attestation: any, 
  verificationData: string
): void => {
  // Initialize user data if doesn't exist
  if (!mockDatabase[address]) {
    mockDatabase[address] = [];
  }

  // Parse verification data to extract VIP info
  let vipStatus = 'Unknown';
  let expiryDate = 'Unknown';

  try {
    const parsedData = JSON.parse(verificationData);
    
    if (platform === 'bilibili') {
      vipStatus = parsedData.current_level ? `Level ${parsedData.current_level}` : 'Unknown';
      expiryDate = parsedData.vipDueDate ? new Date(parseInt(parsedData.vipDueDate)).toLocaleDateString() : 'Unknown';
    } else if (platform === 'youku') {
      vipStatus = parsedData.is_vip === '1' ? 'VIP Active' : 'Not VIP';
      expiryDate = parsedData.exptime || 'Unknown';
    }
  } catch (error) {
    console.error('Error parsing verification data:', error);
  }

  // Find existing platform verification or create new one
  const existingIndex = mockDatabase[address].findIndex(p => p.platform === platform);
  
  const platformData: PlatformData = {
    platform,
    isConnected: true,
    data: verificationData,
    attestation,
    verifiedAt: new Date().toISOString(),
    vipStatus,
    expiryDate,
  };

  if (existingIndex >= 0) {
    mockDatabase[address][existingIndex] = platformData;
  } else {
    mockDatabase[address].push(platformData);
  }

  console.log(`Saved platform data for ${address}:`, mockDatabase[address]);
};