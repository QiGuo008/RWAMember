'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Header from "@/components/Header"
import Navigation from "@/components/Navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SharedMembership {
  id: string
  ownerId: string
  platform: string
  priceMon: number
  durationDays: number
  isActive: boolean
  timesShared: number
  maxShares: number
  createdAt: string
  platformData: {
    platform: string
    vipStatus: string
    expiryDate: string
  }
}

const ManagePage = () => {
  const isMobile = useIsMobile()
  const { address } = useAccount()
  const [sharedMemberships, setSharedMemberships] = useState<SharedMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  // Platform display names and colors
  const platformInfo = {
    bilibili: { name: '哔哩哔哩', color: 'bg-pink-500', icon: '📺' },
    youku: { name: '优酷', color: 'bg-blue-500', icon: '🎬' },
    tencent: { name: '腾讯视频', color: 'bg-green-500', icon: '🎥' },
    iqiyi: { name: '爱奇艺', color: 'bg-orange-500', icon: '📱' }
  }

  const fetchMySharedMemberships = async () => {
    if (!address) return
    
    try {
      const response = await fetch(`/api/share?owner=${address}`)
      const data = await response.json()
      setSharedMemberships(data.sharedMemberships || [])
    } catch (error) {
      console.error('Error fetching shared memberships:', error)
    }
  }

  const handleToggleShare = async (membershipId: string, currentStatus: boolean) => {
    setActionLoading(prev => ({ ...prev, [membershipId]: true }))

    try {
      const response = await fetch(`/api/share/${membershipId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          isActive: !currentStatus
        })
      })

      if (response.ok) {
        fetchMySharedMemberships()
      } else {
        const data = await response.json()
        alert(`操作失败: ${data.error}`)
      }
    } catch (error) {
      console.error('Error toggling share:', error)
      alert('操作失败，请稍后重试')
    } finally {
      setActionLoading(prev => ({ ...prev, [membershipId]: false }))
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchMySharedMemberships()
      setLoading(false)
    }
    
    loadData()
  }, [address])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Header />
        <div className="flex pt-16">
          <Navigation />
          <div className={`flex-1 ${!isMobile ? "ml-56" : ""}`}>
            <div className="container mx-auto px-4 py-12">
              <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p>加载中...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      <div className="flex pt-16">
        <Navigation />
        
        <div className={`flex-1 ${!isMobile ? "ml-56" : ""}`}>
          <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">共享管理</h1>
              <p className="text-muted-foreground">
                管理您分享的会员权益
              </p>
            </div>

            <div className="grid gap-6">
              {sharedMemberships.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                      <span className="text-3xl">📤</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">暂无分享记录</h3>
                    <p className="text-muted-foreground">
                      您还没有分享任何会员权益到市场
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sharedMemberships.map((membership) => {
                    const platform = platformInfo[membership.platform as keyof typeof platformInfo]
                    const isActionLoading = actionLoading[membership.id]
                    return (
                      <Card key={membership.id} className={membership.isActive ? '' : 'opacity-60'}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${platform?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white`}>
                              {platform?.icon || '📱'}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {platform?.name || membership.platform}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {membership.platformData.vipStatus}
                              </p>
                            </div>
                            <Badge variant={membership.isActive ? 'default' : 'secondary'}>
                              {membership.isActive ? '活跃' : '已停止'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">价格:</span>
                                <br />
                                <span className="font-medium">{membership.priceMon} MON</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">时长:</span>
                                <br />
                                <span className="font-medium">{membership.durationDays} 天</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">租借次数:</span>
                                <br />
                                <span className="font-medium">{membership.timesShared}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">创建时间:</span>
                                <br />
                                <span className="font-medium">{new Date(membership.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="text-sm text-muted-foreground mb-2">
                                VIP 到期: {membership.platformData.expiryDate}
                              </div>
                              <Button
                                onClick={() => handleToggleShare(membership.id, membership.isActive)}
                                disabled={isActionLoading}
                                variant={membership.isActive ? 'destructive' : 'default'}
                                size="sm"
                                className="w-full"
                              >
                                {isActionLoading 
                                  ? '处理中...' 
                                  : membership.isActive 
                                    ? '停止分享' 
                                    : '恢复分享'
                                }
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isMobile && <div className="h-16"></div>}
    </div>
  )
}

export default ManagePage