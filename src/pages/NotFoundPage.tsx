'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl mb-4">404</h1>
        <p className="mb-6">Page not found</p>
        <Button asChild variant="link">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage 