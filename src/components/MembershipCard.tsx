"use client"

import { Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface MembershipCardProps {
  platformName: string
  platformLogo: string
  platformColor: string
  price: number
  rating: number
  totalRatings: number
  duration: string
  availability: "available" | "busy" | "limited"
  onClick?: () => void
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  platformName,
  platformLogo,
  platformColor,
  price,
  rating,
  totalRatings,
  duration,
  availability,
  onClick,
}) => {
  const router = useRouter()
  
  const availabilityMap = {
    available: { label: "可用", variant: "outline", className: "border-green-500 text-green-600" },
    busy: { label: "繁忙", variant: "outline", className: "border-red-500 text-red-600" },
    limited: { label: "有限", variant: "outline", className: "border-orange-500 text-orange-600" },
  }
  
  const availabilityInfo = availabilityMap[availability]
  
  const handlePurchaseClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push('/market')
    }
  }
  
  return (
    <div className="membership-card">
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: platformColor }}
        >
          <img src={platformLogo} alt={platformName} className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-medium">{platformName}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B] mr-1" />
            <span>{rating.toFixed(1)}</span>
            <span className="mx-1">·</span>
            <span>{totalRatings}人评价</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-sm">
          <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
          <span>{duration}</span>
        </div>
        <Badge 
          variant="outline" 
          className={availabilityInfo.className}
        >
          {availabilityInfo.label}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-lg font-bold text-primary">
          ¥{price.toFixed(2)}
        </div>
        <Button 
          className="btn-orange"
          onClick={handlePurchaseClick}
        >
          立即购买
        </Button>
      </div>
    </div>
  )
}

export default MembershipCard