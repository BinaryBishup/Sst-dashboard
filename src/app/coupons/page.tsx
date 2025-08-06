"use client"

import React, { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  Search,
  Loader2
} from "lucide-react"
import { usePromoCodes } from "@/lib/hooks/useSupabaseData"
import { PromoCodeModal } from "@/components/modals/PromoCodeModal"
import { promoCodesService, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type PromoCode = Database['public']['Tables']['promo_codes']['Row']

const getPromoStatus = (promoCode: PromoCode) => {
  if (!promoCode.is_active) return "Disabled"
  const now = new Date()
  const validFrom = new Date(promoCode.valid_from)
  const validTo = new Date(promoCode.valid_until)
  
  if (now < validFrom) return "Scheduled"
  if (now > validTo) return "Expired"
  
  if (promoCode.usage_limit && promoCode.times_used && promoCode.times_used >= promoCode.usage_limit) {
    return "Exhausted"
  }
  
  return "Active"
}

const statusStyles = {
  Active: "bg-green-100 text-green-800",
  Expired: "bg-gray-100 text-gray-800",
  Disabled: "bg-red-100 text-red-800",
  Scheduled: "bg-blue-100 text-blue-800",
  Exhausted: "bg-yellow-100 text-yellow-800",
}

const getDiscountDisplay = (promoCode: PromoCode) => {
  if (promoCode.discount_type === 'percentage') {
    return `${promoCode.discount_value}%`
  } else if (promoCode.discount_type === 'fixed') {
    return formatCurrency(promoCode.discount_value)
  } else {
    return 'Free Shipping'
  }
}

const formatDateRange = (from: string, to: string) => {
  const fromDate = new Date(from).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  const toDate = new Date(to).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fromDate} - ${toDate}`
}

export default function CouponsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null)
  const { promoCodes, loading, error, refetch } = usePromoCodes()

  const filteredPromoCodes = promoCodes.filter(promoCode => 
    promoCode.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (promoCode.description && promoCode.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddPromoCode = () => {
    setEditingPromoCode(null)
    setIsModalOpen(true)
  }

  const handleEditPromoCode = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode)
    setIsModalOpen(true)
  }

  const handleDeletePromoCode = async (promoCode: PromoCode) => {
    if (confirm(`Are you sure you want to delete "${promoCode.code}"?`)) {
      try {
        await promoCodesService.delete(promoCode.id)
        refetch()
      } catch (error) {
        console.error('Error deleting promo code:', error)
        alert('Error deleting promo code. Please try again.')
      }
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  const togglePromoCodeStatus = async (promoCode: PromoCode) => {
    try {
      await promoCodesService.update(promoCode.id, { is_active: !promoCode.is_active })
      refetch()
    } catch (error) {
      console.error('Error toggling promo code status:', error)
      alert('Error updating promo code status. Please try again.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading promo codes</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  } 

  const activePromoCodesCount = promoCodes.filter(pc => getPromoStatus(pc) === 'Active').length
  const totalRedemptions = promoCodes.reduce((sum, pc) => sum + (pc.times_used || 0), 0)
  const totalSavings = promoCodes.reduce((sum, pc) => {
    const used = pc.times_used || 0
    const avgSaving = pc.discount_type === 'percentage' ? 50 : pc.discount_value // Approximate
    return sum + (used * avgSaving)
  }, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <Button onClick={handleAddPromoCode}>
            <Plus className="mr-2 h-4 w-4" />
            Create Promo Code
          </Button>
        </div>


        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle>Promo Code List</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search promo codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromoCodes.map((promoCode) => {
                  const status = getPromoStatus(promoCode)
                  const usageText = promoCode.usage_limit 
                    ? `${promoCode.times_used || 0}/${promoCode.usage_limit}`
                    : `${promoCode.times_used || 0}`
                  
                  return (
                    <TableRow key={promoCode.id}>
                      <TableCell className="font-mono font-medium">
                        {promoCode.code}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {promoCode.description || "No description"}
                      </TableCell>
                      <TableCell>{getDiscountDisplay(promoCode)}</TableCell>
                      <TableCell>{usageText}</TableCell>
                      <TableCell className="text-sm">{formatDateRange(promoCode.valid_from, promoCode.valid_until)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => togglePromoCodeStatus(promoCode)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${statusStyles[status as keyof typeof statusStyles]}`}
                        >
                          {status}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditPromoCode(promoCode)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeletePromoCode(promoCode)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <PromoCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        promoCode={editingPromoCode}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}