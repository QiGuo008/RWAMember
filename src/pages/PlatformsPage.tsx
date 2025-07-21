'use client'

import Header from "@/components/Header"
import Navigation from "@/components/Navigation"
import { PlatformVerification } from "@/components/PlatformVerification"
import { useIsMobile } from "@/hooks/use-mobile"

const PlatformsPage = () => {
  const isMobile = useIsMobile()
  
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Header />
      <div className="flex pt-16">
        <Navigation />
        
        <div className={`flex-1 ${!isMobile ? "ml-56" : ""}`}>
          <div className="container mx-auto px-4 py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <PlatformVerification />
            </div>
          </div>
        </div>
      </div>
      
      {isMobile && <div className="h-16"></div>}
    </div>
  )
}

export default PlatformsPage