import { Search, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useIsMobile } from "@/hooks/use-mobile"
import { Link } from "react-router-dom"

const Header = () => {
  const isMobile = useIsMobile()

  return (
    <header className="border-b border-border py-3 px-4 bg-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xl font-bold text-primary">
            会员<span className="text-[#F59E0B]">RWA</span>共享平台
          </Link>
        </div>
        
        {!isMobile && (
          <div className="flex-1 max-w-md mx-10">
            <div className="relative">
              <Input
                type="text"
                placeholder="搜索会员共享..."
                className="pl-8"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {!isMobile && <span>登录 / 注册</span>}
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header