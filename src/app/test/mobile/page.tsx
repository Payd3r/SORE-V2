'use client'

import LazyLoader from '@/components/utils/LazyLoader'

export default function MobileTestPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mobile Optimization Test Page</h1>
      <LazyLoader componentPath="components/Mobile/MobileOptimizationTest" />
    </div>
  )
} 