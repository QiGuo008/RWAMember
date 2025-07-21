'use client'

import Header from "@/components/Header"
import Navigation from "@/components/Navigation"
import { useIsMobile } from "@/hooks/use-mobile"

const PlatformsPage = () => {
  const isMobile = useIsMobile()
  
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      <div className="flex">
        <Navigation />
        
        <div className={`flex-1 ${!isMobile ? "ml-56" : ""}`}>
          <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
              <h1 className="text-2xl font-bold mb-4">平台绑定</h1>
              <p className="text-lg text-muted-foreground mb-8">
                这个功能即将上线，敬请期待！
              </p>
              <div className="w-40 h-40 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <span className="text-primary text-5xl">🚀</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isMobile && <div className="h-16"></div>}
    </div>
  )
}

export default PlatformsPage