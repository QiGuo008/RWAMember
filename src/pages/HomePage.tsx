import { useState } from "react"
import { Users, TrendingUp, CreditCard, CircleDollarSign } from "lucide-react"
import Header from "@/components/Header"
import Navigation from "@/components/Navigation"
import Hero from "@/components/Hero"
import PlatformCard from "@/components/PlatformCard"
import MembershipCard from "@/components/MembershipCard"
import StatsCard from "@/components/StatsCard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

function HomePage() {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState("all")

  // Sample data for platforms
  const platforms = [
    { 
      id: 1, 
      name: "哔哩哔哩", 
      logo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=48&h=48&fit=crop&auto=format", 
      color: "#FB7299", 
      isBound: true, 
      membershipLevel: "大会员",
      expiryDate: "2026-03-30"
    },
    { 
      id: 2, 
      name: "腾讯视频", 
      logo: "https://images.unsplash.com/photo-1611162616305-c69b3267e129?w=48&h=48&fit=crop&auto=format", 
      color: "#FF6022", 
      isBound: true, 
      membershipLevel: "超级VIP",
      expiryDate: "2025-12-15"
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
  ]

  // Sample data for shared memberships
  const sharedMemberships = [
    {
      id: 1,
      platformName: "哔哩哔哩",
      platformLogo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=48&h=48&fit=crop&auto=format",
      platformColor: "#FB7299",
      price: 15.99,
      rating: 4.8,
      totalRatings: 235,
      duration: "1个月",
      availability: "available" as const
    },
    {
      id: 2,
      platformName: "腾讯视频",
      platformLogo: "https://images.unsplash.com/photo-1611162616305-c69b3267e129?w=48&h=48&fit=crop&auto=format",
      platformColor: "#FF6022",
      price: 19.99,
      rating: 4.6,
      totalRatings: 158,
      duration: "1个月",
      availability: "limited" as const
    },
    {
      id: 3,
      platformName: "爱奇艺",
      platformLogo: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=48&h=48&fit=crop&auto=format",
      platformColor: "#00BE06",
      price: 12.99,
      rating: 4.5,
      totalRatings: 98,
      duration: "1个月",
      availability: "busy" as const
    },
    {
      id: 4,
      platformName: "优酷",
      platformLogo: "https://images.unsplash.com/photo-1611162617263-4ec3060a058e?w=48&h=48&fit=crop&auto=format",
      platformColor: "#1890FF",
      price: 14.99,
      rating: 4.7,
      totalRatings: 124,
      duration: "1个月",
      availability: "available" as const
    }
  ]

  // Sample statistics data
  const statsData = [
    {
      title: "活跃会员用户",
      value: "12,458",
      icon: Users,
      description: "较上周",
      trend: { value: 12, isPositive: true }
    },
    {
      title: "今日共享次数",
      value: "358",
      icon: TrendingUp,
      description: "较昨日",
      trend: { value: 8, isPositive: true }
    },
    {
      title: "绑定平台总数",
      value: "24,789",
      icon: CreditCard,
      description: "较上月",
      trend: { value: 32, isPositive: true }
    },
    {
      title: "平台交易总额",
      value: "¥198,356",
      icon: CircleDollarSign,
      description: "较上月",
      trend: { value: 18, isPositive: true }
    }
  ]

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      <div className="flex">
        <Navigation />
        
        <div className={`flex-1 ${!isMobile ? "ml-56" : ""}`}>
          <Hero />
          
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsData.map((stat, index) => (
                <StatsCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  description={stat.description}
                  trend={stat.trend}
                />
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="section-title">热门共享会员</h2>
                    <Button variant="outline">查看全部</Button>
                  </div>
                  
                  <Tabs defaultValue="all" className="mb-6">
                    <TabsList className="mb-4">
                      <TabsTrigger value="all" onClick={() => setActiveTab("all")}>
                        全部
                      </TabsTrigger>
                      <TabsTrigger value="video" onClick={() => setActiveTab("video")}>
                        视频平台
                      </TabsTrigger>
                      <TabsTrigger value="music" onClick={() => setActiveTab("music")}>
                        音乐平台
                      </TabsTrigger>
                      <TabsTrigger value="reading" onClick={() => setActiveTab("reading")}>
                        阅读平台
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sharedMemberships.map(membership => (
                        <MembershipCard
                          key={membership.id}
                          platformName={membership.platformName}
                          platformLogo={membership.platformLogo}
                          platformColor={membership.platformColor}
                          price={membership.price}
                          rating={membership.rating}
                          totalRatings={membership.totalRatings}
                          duration={membership.duration}
                          availability={membership.availability}
                        />
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="video">
                      <div className="text-center py-8 text-muted-foreground">
                        暂时只展示全部分类，其他分类即将推出
                      </div>
                    </TabsContent>
                    <TabsContent value="music">
                      <div className="text-center py-8 text-muted-foreground">
                        暂时只展示全部分类，其他分类即将推出
                      </div>
                    </TabsContent>
                    <TabsContent value="reading">
                      <div className="text-center py-8 text-muted-foreground">
                        暂时只展示全部分类，其他分类即将推出
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="section-title">我的平台</h2>
                  <div className="space-y-4">
                    {platforms.map(platform => (
                      <PlatformCard
                        key={platform.id}
                        name={platform.name}
                        logo={platform.logo}
                        color={platform.color}
                        isBound={platform.isBound}
                        membershipLevel={platform.membershipLevel}
                        expiryDate={platform.expiryDate}
                        onClick={() => console.log(`Clicked on platform: ${platform.name}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm mt-8">
              <h2 className="section-title">共享指南</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-border rounded-lg p-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-primary text-xl font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">绑定您的平台账号</h3>
                  <p className="text-muted-foreground">
                    简单几步绑定您的平台账号，系统将自动验证您的会员状态。
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-primary text-xl font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">设置共享选项</h3>
                  <p className="text-muted-foreground">
                    设置共享价格、时间段和可用性，灵活控制您的共享选项。
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-primary text-xl font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2">获取共享收益</h3>
                  <p className="text-muted-foreground">
                    当其他用户使用您的会员时，您将获得相应的共享收益。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add padding at the bottom for mobile navigation */}
      {isMobile && <div className="h-16"></div>}
    </div>
  )
}

export default HomePage