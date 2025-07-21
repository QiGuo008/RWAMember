"use client"

import { Home, CreditCard, Users, Settings } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { icon: Home, label: "首页", href: "/" },
  { icon: CreditCard, label: "平台绑定", href: "/platforms" },
  { icon: Users, label: "共享市场", href: "/market" },
  { icon: Settings, label: "设置", href: "/settings" },
]

const Navigation = () => {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center py-1 px-3 rounded-md",
                pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    )
  }
  
  return (
    <nav className="hidden md:block bg-white border-r border-border h-[calc(100vh-60px)] w-56 fixed">
      <div className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation