'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { platformEvents } from '@/lib/platform-events';

// Import Primus SDK
import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk';

interface PlatformData {
  platform: string;
  isConnected: boolean;
  vipStatus: string;
  expiryDate?: string;
  data?: string;
}

const PLATFORMS = [
  {
    id: 'bilibili',
    name: '哔哩哔哩 (Bilibili)',
    templateId: process.env.NEXT_PUBLIC_BILIBILI_TEMPLATE_ID || 'bilibili-template',
    description: 'Verify your Bilibili membership status',
  },
  {
    id: 'youku',
    name: '优酷 (Youku)', 
    templateId: process.env.NEXT_PUBLIC_YOUKU_TEMPLATE_ID || 'youku-template',
    description: 'Verify your Youku VIP status',
  }
];

export function PlatformVerification() {
  const { address, isConnected } = useAccount();
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [primusZKTLS, setPrimusZKTLS] = useState<PrimusZKTLS | null>(null);

  useEffect(() => {
    // Initialize Primus SDK
    const initPrimus = async () => {
      try {
        const primus = new PrimusZKTLS();
        const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
        if (!appId) {
          console.error('NEXT_PUBLIC_PRIMUS_APP_ID is not configured');
          return;
        }
        console.log('Initializing Primus SDK with appId:', appId);
        const initResult = await primus.init(appId);
        console.log('Primus SDK initialization result:', initResult);
        
        // Verify that the SDK is properly initialized before setting it
        if (initResult && primus) {
          setPrimusZKTLS(primus);
        } else {
          throw new Error('SDK initialization returned invalid result');
        }
      } catch (error) {
        console.error('Failed to initialize Primus SDK:', error);
        toast({
          title: 'Initialization Error',
          description: 'Failed to initialize Primus SDK. Please refresh the page.',
          variant: 'destructive',
        });
      }
    };

    initPrimus();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchPlatformData();
    }
  }, [isConnected, address]);

  const fetchPlatformData = async () => {
    try {
      console.log('Fetching platform data...');
      const response = await fetch('/api/platforms/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Platform data received:', data);
        setPlatforms(data.platforms || []);
      } else {
        console.error('Failed to fetch platforms:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
    }
  };

  const handleVerifyPlatform = async (platformId: string, templateId: string) => {
    if (!primusZKTLS || !address) {
      toast({
        title: 'Not Ready',
        description: 'Primus SDK is not initialized or wallet not connected. Please wait or refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(prev => ({ ...prev, [platformId]: true }));

    try {
      // Generate request parameters
      const request = primusZKTLS.generateRequestParams(templateId, address);
      
      // Set additional parameters if needed
      const additionParams = JSON.stringify({
        platform: platformId,
        timestamp: Date.now(),
      });
      request.setAdditionParams(additionParams);

      // Set zkTLS mode to proxy (faster)
      request.setAttMode({
        algorithmType: 'proxytls',
      });

      const requestStr = request.toJsonString();

      // Get signed request from backend
      const signResponse = await fetch('/api/primus/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ signParams: requestStr }),
      });

      if (!signResponse.ok) {
        throw new Error('Failed to sign request');
      }

      const { signResult } = await signResponse.json();

      if (!signResult) {
        throw new Error('Empty signature result from server');
      }

      console.log('Starting attestation with signResult:', signResult);
      
      // Verify primusZKTLS is still properly initialized
      if (!primusZKTLS) {
        throw new Error('Primus SDK instance is null');
      }

      // Start attestation process
      const attestation = await primusZKTLS.startAttestation(signResult);
      console.log('Attestation result:', attestation);

      // Verify the attestation
      const verifyResult = await primusZKTLS.verifyAttestation(attestation);
      
      if (verifyResult) {
        // Save verification result to backend
        const saveResponse = await fetch('/api/platforms/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            platform: platformId,
            attestation,
            verificationData: attestation.data || JSON.stringify(attestation),
          }),
        });

        if (saveResponse.ok) {
          console.log('Verification saved successfully');
          toast({
            title: 'Verification successful',
            description: `${platformId} platform has been verified successfully!`,
          });
          
          // Trigger global refresh event
          platformEvents.emit();
          
          // Add small delay before refreshing to ensure data is saved
          setTimeout(() => {
            fetchPlatformData();
          }, 1000);
        } else {
          throw new Error('Failed to save verification result');
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Platform verification error:', error);
      toast({
        title: 'Verification failed',
        description: `Failed to verify ${platformId} platform. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const getPlatformStatus = (platformId: string) => {
    return platforms.find(p => p.platform === platformId);
  };

  const formatVipData = (platform: string, data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      if (platform === 'bilibili') {
        return {
          level: parsed.current_level,
          vipDueDate: parsed.vipDueDate ? new Date(parseInt(parsed.vipDueDate)).toLocaleDateString() : 'Not available',
        };
      } else if (platform === 'youku') {
        return {
          isVip: parsed.is_vip === '1',
          exptime: parsed.exptime,
        };
      }
      
      return parsed;
    } catch {
      return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to verify platforms</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Verification</h2>
        <p className="text-muted-foreground">
          Verify your membership status on supported platforms using zkTLS technology
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const status = getPlatformStatus(platform.id);
          const isLoading = loading[platform.id];
          const vipData = status?.data ? formatVipData(platform.id, status.data) : null;

          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{platform.name}</CardTitle>
                  {status?.isConnected && (
                    <Badge variant="outline" className="text-green-600">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {status?.isConnected && vipData && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">VIP Status</h4>
                      {platform.id === 'bilibili' && (
                        <div className="text-sm space-y-1">
                          <p>Level: {vipData.level}</p>
                          <p>VIP Until: {vipData.vipDueDate}</p>
                        </div>
                      )}
                      {platform.id === 'youku' && (
                        <div className="text-sm space-y-1">
                          <p>VIP Status: {vipData.isVip ? 'Active' : 'Inactive'}</p>
                          <p>Expires: {vipData.exptime}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button
                    onClick={() => handleVerifyPlatform(platform.id, platform.templateId)}
                    disabled={isLoading || !primusZKTLS}
                    className="w-full"
                  >
                    {isLoading 
                      ? 'Verifying...' 
                      : status?.isConnected 
                        ? 'Re-verify' 
                        : 'Verify Platform'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}