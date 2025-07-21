import type { Metadata } from 'next'
import '../src/index.css'
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Web3Provider } from "@/providers/web3-provider"

export const metadata: Metadata = {
  title: 'RWA Member',
  description: 'Real World Assets Membership Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  )
}