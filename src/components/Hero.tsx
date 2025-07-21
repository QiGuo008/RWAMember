import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

const Hero = () => {
  const isMobile = useIsMobile()
  
  return (
    <div className="gradient-bg py-12 md:py-20 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              共享闲置会员资源
              <br />
              <span className="text-[#F59E0B]">最大化</span>价值
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              轻松共享您的视频平台VIP会员，获取额外收益，
              或以低成本享受多平台高级内容。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="btn-orange">开始共享</Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                寻找会员
              </Button>
            </div>
          </div>
          
          {!isMobile && (
            <div className="relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400 rounded-full opacity-20 blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1586899028174-e7098604235b?w=800&h=600&fit=crop" 
                alt="Streaming services illustration" 
                className="rounded-lg shadow-lg relative z-10 mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Hero