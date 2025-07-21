'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticate = async () => {
    if (!address) return;

    setIsAuthenticating(true);
    try {
      const message = `Sign this message to authenticate with RWA Member:\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
      
      console.log('Signing message:', message);
      console.log('Address:', address);
      
      const signature = await signMessageAsync({ 
        message,
        account: address as `0x${string}`
      });
      
      console.log('Signature received:', signature);
      
      // Send signature to backend for verification
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      });

      if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem('auth_token', token);
        setIsAuthenticated(true);
        toast({
          title: "Authentication successful",
          description: "You are now logged in!",
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Authentication error response:', response.status, errorData);
        throw new Error(`Authentication failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <ConnectButton />
      {isConnected && !isAuthenticated && (
        <Button 
          onClick={handleAuthenticate} 
          disabled={isAuthenticating}
        >
          {isAuthenticating ? 'Authenticating...' : 'Sign In'}
        </Button>
      )}
      {isConnected && isAuthenticated && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600">✓ Authenticated</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      )}
    </div>
  );
}