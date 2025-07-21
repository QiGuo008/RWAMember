"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface PlatformCardProps {
  name: string
  logo: string
  color: string
  isBound: boolean
  membershipLevel?: string
  expiryDate?: string
  onClick: () => void
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  name,
  logo,
  color,
  isBound,
  membershipLevel,
  expiryDate,
  onClick,
}) => {
  return (
    <div className="platform-card flex flex-col">
      <div className="flex items-center mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: color }}
        >
          <img src={logo} alt={name} className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-medium">{name}</h3>
          {isBound && membershipLevel && (
            <Badge variant="outline" className="text-xs">
              {membershipLevel}
            </Badge>
          )}
        </div>
      </div>
      
      {isBound ? (
        <div className="mt-2">
          <div className="text-sm text-muted-foreground mb-2">
            有效期至: {expiryDate}
          </div>
          <div className="flex justify-between">
            <Badge variant="secondary" className="flex items-center">
              <Check className="w-3 h-3 mr-1" /> 已绑定
            </Badge>
            <Button variant="outline" size="sm" onClick={onClick}>
              管理
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onClick}
          >
            绑定账号
          </Button>
        </div>
      )}
    </div>
  )
}

export default PlatformCard