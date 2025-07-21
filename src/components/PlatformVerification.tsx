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
  },
  {
    id: 'tencent',
    name: '腾讯视频 (Tencent Video)',
    templateId: process.env.NEXT_PUBLIC_TENCENT_TEMPLATE_ID || 'tencent-template',
    description: 'Verify your Tencent Video VIP status',
  },
  {
    id: 'iqiyi',
    name: '爱奇艺 (iQIYI)',
    templateId: process.env.NEXT_PUBLIC_IQIYI_TEMPLATE_ID || 'iqiyi-template',
    description: 'Verify your iQIYI VIP status',
  }
];

export function PlatformVerification() {
  const { address, isConnected } = useAccount();
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [shareLoading, setShareLoading] = useState<{ [key: string]: boolean }>({});
  const [sharedPlatforms, setSharedPlatforms] = useState<{ [key: string]: boolean }>({});
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
      fetchSharedPlatforms();
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

  const fetchSharedPlatforms = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/share?owner=${address}`);
      const data = await response.json();
      const shared: { [key: string]: boolean } = {};
      
      if (data.sharedMemberships) {
        data.sharedMemberships.forEach((membership: any) => {
          if (membership.isActive) {
            shared[membership.platform] = true;
          }
        });
      }
      
      setSharedPlatforms(shared);
    } catch (error) {
      console.error('Failed to fetch shared platforms:', error);
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

  const handleSharePlatform = async (platformId: string) => {
    if (!address) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setShareLoading(prev => ({ ...prev, [platformId]: true }));

    try {
      const isCurrentlyShared = sharedPlatforms[platformId];
      
      if (isCurrentlyShared) {
        // Find the shared membership ID and stop sharing
        const response = await fetch(`/api/share?owner=${address}&platform=${platformId}`);
        const data = await response.json();
        const sharedMembership = data.sharedMemberships?.[0];
        
        if (sharedMembership) {
          const stopResponse = await fetch(`/api/share/${sharedMembership.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              isActive: false,
            }),
          });

          if (stopResponse.ok) {
            toast({
              title: '取消共享成功',
              description: `${platformId} 会员已从市场移除`,
            });
            setSharedPlatforms(prev => ({ ...prev, [platformId]: false }));
          } else {
            throw new Error('Failed to stop sharing');
          }
        }
      } else {
        // Start sharing
        const response = await fetch('/api/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            address,
            platform: platformId,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: '分享成功',
            description: `${platformId} 会员已分享到市场，其他用户可以租借使用！`,
          });
          setSharedPlatforms(prev => ({ ...prev, [platformId]: true }));
        } else {
          throw new Error(data.error || 'Failed to share platform');
        }
      }
    } catch (error) {
      console.error('Error handling share platform:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : 'Failed to handle share operation',
        variant: 'destructive',
      });
    } finally {
      setShareLoading(prev => ({ ...prev, [platformId]: false }));
    }
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
      } else if (platform === 'tencent') {
        return {
          isVip: parsed.is_vip === '1' || parsed.vip_status === 'active',
          exptime: parsed.exptime || parsed.expire_time,
          vipType: parsed.vip_type || 'VIP',
        };
      } else if (platform === 'iqiyi') {
        return {
          isVip: parsed.is_vip === '1' || parsed.vip_status === 'active',
          exptime: parsed.exptime || parsed.expire_time,
          vipLevel: parsed.vip_level || 'VIP',
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
          const isShareLoading = shareLoading[platform.id];
          const vipData = status?.data ? formatVipData(platform.id, status.data) : null;
          const isShared = sharedPlatforms[platform.id];

          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{platform.name}</CardTitle>
                  <div className="flex gap-2">
                    {status?.isConnected && (
                      <Badge variant="outline" className="text-green-600">
                        ✓ Verified
                      </Badge>
                    )}
                    {isShared && (
                      <Badge className="bg-blue-600 text-white">
                        正在共享赚钱
                      </Badge>
                    )}
                  </div>
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
                      {platform.id === 'tencent' && (
                        <div className="text-sm space-y-1">
                          <p>VIP Status: {vipData.isVip ? 'Active' : 'Inactive'}</p>
                          <p>VIP Type: {vipData.vipType}</p>
                          <p>Expires: {vipData.exptime}</p>
                        </div>
                      )}
                      {platform.id === 'iqiyi' && (
                        <div className="text-sm space-y-1">
                          <p>VIP Status: {vipData.isVip ? 'Active' : 'Inactive'}</p>
                          <p>VIP Level: {vipData.vipLevel}</p>
                          <p>Expires: {vipData.exptime}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {!status?.isConnected && (
                      <Button
                        onClick={() => handleVerifyPlatform(platform.id, platform.templateId)}
                        disabled={isLoading || !primusZKTLS}
                        className="w-full"
                      >
                        {isLoading 
                          ? 'Verifying...' 
                          : 'Verify Platform'
                        }
                      </Button>
                    )}
                    
                    {status?.isConnected && (
                      <Button
                        onClick={() => handleSharePlatform(platform.id)}
                        disabled={isShareLoading || !address}
                        className={isShared 
                          ? "w-full bg-red-600 hover:bg-red-700 text-white" 
                          : "w-full bg-blue-600 hover:bg-blue-700 text-white"
                        }
                      >
                        {isShareLoading 
                          ? (isShared ? '取消中...' : '分享中...') 
                          : isShared 
                            ? '取消共享' 
                            : '分享到市场 (0.1 MON/天)'
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}