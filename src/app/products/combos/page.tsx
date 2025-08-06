"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowRight, Package2 } from "lucide-react"

export default function CombosPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to products page with combo filter after 2 seconds
    const timer = setTimeout(() => {
      router.push('/products?type=combo')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Package2 className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Combos Management Unified</h3>
              <p className="text-gray-600">
                Combos are now managed in the unified Products page for better organization.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Redirecting to Products</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            
            <div className="text-xs text-gray-500 mt-4">
              You'll be redirected to the Products page with Combos filter applied
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}