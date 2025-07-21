'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import Header from "@/components/Header"
import Navigation from "@/components/Navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface Rental {
  id: string
  sharedMembershipId: string
  renterAddress: string
  pricePaid: number
  durationDays: number
  startsAt: string
  expiresAt: string
  status: string
  sharedMembership: SharedMembership
}

const MarketPage = () => {
  const isMobile = useIsMobile()
  const { address } = useAccount()
  const [sharedMemberships, setSharedMemberships] = useState<SharedMembership[]>([])
  const [userRentals, setUserRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  // Platform display names and colors
  const platformInfo = {
    bilibili: { name: '哔哩哔哩', color: 'bg-pink-500', icon: '📺' },
    youku: { name: '优酷', color: 'bg-blue-500', icon: '🎬' },
    tencent: { name: '腾讯视频', color: 'bg-green-500', icon: '🎥' },
    iqiyi: { name: '爱奇艺', color: 'bg-orange-500', icon: '📱' }
  }

  const fetchSharedMemberships = async () => {
    try {
      const response = await fetch('/api/share')
      const data = await response.json()
      setSharedMemberships(data.sharedMemberships || [])
    } catch (error) {
      console.error('Error fetching shared memberships:', error)
    }
  }

  const fetchUserRentals = async () => {
    if (!address) return
    
    try {
      const response = await fetch(`/api/rent?address=${address}`)
      const data = await response.json()
      setUserRentals(data.rentals || [])
    } catch (error) {
      console.error('Error fetching user rentals:', error)
    }
  }

  const handleRentMembership = async (membershipId: string) => {
    if (!address) {
      alert('请先连接钱包')
      return
    }

    try {
      // In a real implementation, this would trigger a Monad transaction
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      
      const response = await fetch('/api/rent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sharedMembershipId: membershipId,
          renterAddress: address,
          transactionHash: mockTxHash
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('租借成功！')
        fetchSharedMemberships()
        fetchUserRentals()
      } else {
        alert(`租借失败: ${data.error}`)
      }
    } catch (error) {
      console.error('Error renting membership:', error)
      alert('租借失败，请稍后重试')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSharedMemberships(), fetchUserRentals()])
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
              <h1 className="text-3xl font-bold mb-2">共享市场</h1>
              <p className="text-muted-foreground">
                租借其他用户的会员权益，价格固定 0.1 MON / 1天
              </p>
            </div>

            <Tabs defaultValue="marketplace" className="space-y-6">
              <TabsList>
                <TabsTrigger value="marketplace">市场</TabsTrigger>
                <TabsTrigger value="my-rentals">我的租借</TabsTrigger>
              </TabsList>

              <TabsContent value="marketplace">
                <div className="grid gap-6">
                  {sharedMemberships.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="w-24 h-24 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                          <span className="text-3xl">🏪</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">暂无共享会员</h3>
                        <p className="text-muted-foreground">
                          还没有用户分享会员权益，快去验证平台并分享吧！
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sharedMemberships.map((membership) => {
                        const platform = platformInfo[membership.platform as keyof typeof platformInfo]
                        return (
                          <Card key={membership.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${platform?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white`}>
                                  {platform?.icon || '📱'}
                                </div>
                                <div>
                                  <CardTitle className="text-lg">
                                    {platform?.name || membership.platform}
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground">
                                    {membership.platformData.vipStatus}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span>过期时间</span>
                                  <span>{membership.platformData.expiryDate}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>租借次数</span>
                                  <span>{membership.timesShared}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <div>
                                    <Badge variant="secondary" className="text-xs">
                                      {membership.priceMon} MON / {membership.durationDays}天
                                    </Badge>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleRentMembership(membership.id)}
                                    disabled={membership.ownerId === address}
                                  >
                                    {membership.ownerId === address ? '自己的分享' : '租借'}
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
              </TabsContent>

              <TabsContent value="my-rentals">
                <div className="grid gap-6">
                  {userRentals.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="w-24 h-24 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                          <span className="text-3xl">📦</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">暂无租借记录</h3>
                        <p className="text-muted-foreground">
                          您还没有租借过任何会员权益
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {userRentals.map((rental) => {
                        const platform = platformInfo[rental.sharedMembership.platform as keyof typeof platformInfo]
                        const isActive = rental.status === 'active' && new Date(rental.expiresAt) > new Date()
                        return (
                          <Card key={rental.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 ${platform?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center text-white`}>
                                    {platform?.icon || '📱'}
                                  </div>
                                  <div>
                                    <h3 className="font-medium">
                                      {platform?.name || rental.sharedMembership.platform}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      支付了 {rental.pricePaid} MON
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={isActive ? 'default' : 'secondary'}>
                                    {isActive ? '活跃' : '已过期'}
                                  </Badge>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    到期时间: {new Date(rental.expiresAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {isMobile && <div className="h-16"></div>}
    </div>
  )
}

export default MarketPage