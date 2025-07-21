'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { platformEvents } from '@/lib/platform-events'

interface PlatformData {
  platform: string;
  isConnected: boolean;
  data: string;
  attestation: unknown;
  verifiedAt: string;
}

interface ParsedPlatformData {
  current_level?: string;
  vipDueDate?: string;
  exptime?: string;
  is_vip?: string;
  vip_status?: string;
  expire_time?: string;
  vip_type?: string;
  vip_level?: string;
}

export interface Platform {
  id: number;
  name: string;
  logo: string;
  color: string;
  isBound: boolean;
  membershipLevel?: string;
  expiryDate?: string;
}

export function usePlatformStatus() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultPlatforms: Platform[] = useMemo(() => [
    { 
      id: 1, 
      name: "哔哩哔哩", 
      logo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=48&h=48&fit=crop&auto=format", 
      color: "#FB7299", 
      isBound: false
    },
    { 
      id: 2, 
      name: "腾讯视频", 
      logo: "https://images.unsplash.com/photo-1611162616305-c69b3267e129?w=48&h=48&fit=crop&auto=format", 
      color: "#FF6022", 
      isBound: false
    },
    { 
      id: 3, 
      name: "爱奇艺", 
      logo: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=48&h=48&fit=crop&auto=format", 
      color: "#00BE06", 
      isBound: false
    },
    { 
      id: 4, 
      name: "优酷", 
      logo: "https://images.unsplash.com/photo-1611162617263-4ec3060a058e?w=48&h=48&fit=crop&auto=format", 
      color: "#1890FF", 
      isBound: false
    }
  ], [])

  const fetchPlatformStatus = useCallback(async () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      setPlatforms(defaultPlatforms)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      console.log('No auth token found, using default platforms')
      setPlatforms(defaultPlatforms)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/platforms/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch platform status')
      }

      const data = await response.json()
      console.log('Platform status data received:', data)
      const backendPlatforms = data.platforms as PlatformData[]

      // Merge backend data with default platforms
      const updatedPlatforms = defaultPlatforms.map(defaultPlatform => {
        const backendData = backendPlatforms.find(bp => {
          const platformName = bp.platform.toLowerCase()
          const defaultName = defaultPlatform.name.toLowerCase()
          return platformName.includes('bilibili') && defaultName.includes('哔哩哔哩') ||
                 platformName.includes('youku') && defaultName.includes('优酷') ||
                 platformName.includes('tencent') && defaultName.includes('腾讯视频') ||
                 platformName.includes('iqiyi') && defaultName.includes('爱奇艺') ||
                 platformName === defaultName
        })

        if (backendData && backendData.isConnected) {
          try {
            const parsedData: ParsedPlatformData = JSON.parse(backendData.data)
            
            // Handle bilibili data format
            if (parsedData.current_level && parsedData.vipDueDate) {
              const expiryDate = new Date(parseInt(parsedData.vipDueDate)).toISOString().split('T')[0]
              return {
                ...defaultPlatform,
                isBound: true,
                membershipLevel: `等级${parsedData.current_level}`,
                expiryDate
              }
            }
            
            // Handle youku data format
            if (parsedData.is_vip === '1' && parsedData.exptime) {
              return {
                ...defaultPlatform,
                isBound: true,
                membershipLevel: 'VIP会员',
                expiryDate: parsedData.exptime
              }
            }
            
            // Handle tencent data format
            if ((parsedData.is_vip === '1' || parsedData.vip_status === 'active') && (parsedData.exptime || parsedData.expire_time)) {
              return {
                ...defaultPlatform,
                isBound: true,
                membershipLevel: parsedData.vip_type || 'VIP会员',
                expiryDate: parsedData.exptime || parsedData.expire_time
              }
            }
            
            // Handle iqiyi data format
            if ((parsedData.is_vip === '1' || parsedData.vip_status === 'active') && (parsedData.exptime || parsedData.expire_time)) {
              return {
                ...defaultPlatform,
                isBound: true,
                membershipLevel: parsedData.vip_level || 'VIP会员',
                expiryDate: parsedData.exptime || parsedData.expire_time
              }
            }
          } catch (e) {
            console.error('Error parsing platform data:', e)
          }
        }

        return defaultPlatform
      })

      setPlatforms(updatedPlatforms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPlatforms(defaultPlatforms)
    } finally {
      setLoading(false)
    }
  }, [defaultPlatforms])

  useEffect(() => {
    fetchPlatformStatus()
    
    // Subscribe to platform verification events
    const unsubscribe = platformEvents.subscribe(() => {
      console.log('Platform verification event received, refreshing data...')
      fetchPlatformStatus()
    })
    
    return unsubscribe
  }, [fetchPlatformStatus])

  return { platforms, loading, error, refetch: fetchPlatformStatus }
}