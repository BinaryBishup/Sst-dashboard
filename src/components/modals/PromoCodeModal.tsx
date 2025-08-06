"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { promoCodesService } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type PromoCode = Database['public']['Tables']['promo_codes']['Row']
type PromoCodeInsert = Database['public']['Tables']['promo_codes']['Insert']

interface PromoCodeModalProps {
  isOpen: boolean
  onClose: () => void
  promoCode?: PromoCode | null
  onSuccess: () => void
}

export function PromoCodeModal({ isOpen, onClose, promoCode, onSuccess }: PromoCodeModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    maximum_discount: "",
    valid_from: "",
    valid_to: "",
    usage_limit: "",
    is_active: true,
  })

  const isEditing = !!promoCode

  useEffect(() => {
    if (promoCode) {
      setFormData({
        code: promoCode.code,
        description: promoCode.description || "",
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value.toString(),
        maximum_discount: promoCode.maximum_discount?.toString() || "",
        valid_from: promoCode.valid_from ? new Date(promoCode.valid_from).toISOString().split('T')[0] : "",
        valid_to: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().split('T')[0] : "",
        usage_limit: promoCode.usage_limit?.toString() || "",
        is_active: promoCode.is_active || true,
      })
    } else {
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        maximum_discount: "",
        valid_from: "",
        valid_to: "",
        usage_limit: "",
        is_active: true,
      })
    }
  }, [promoCode, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const promoCodeData: PromoCodeInsert = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        maximum_discount: formData.maximum_discount ? parseFloat(formData.maximum_discount) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_to, // Map valid_to to valid_until
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active,
        times_used: isEditing ? undefined : 0, // Only set to 0 for new promo codes
      }

      if (isEditing && promoCode) {
        await promoCodesService.update(promoCode.id, promoCodeData)
      } else {
        await promoCodesService.create(promoCodeData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving promo code:', error)
      alert('Error saving promo code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Promo Code' : 'Create New Promo Code'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update promo code details' : 'Set up a new discount promo code for your customers'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Promo Code *
              </label>
              <input
                id="code"
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData(prev => ({...prev, code: e.target.value.toUpperCase()}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                placeholder="e.g., SAVE20"
              />
            </div>
            <div>
              <label htmlFor="discount_type" className="block text-sm font-medium mb-2">
                Discount Type *
              </label>
              <select
                id="discount_type"
                required
                value={formData.discount_type}
                onChange={(e) => setFormData(prev => ({...prev, discount_type: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Describe the promo code offer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="discount_value" className="block text-sm font-medium mb-2">
                Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.discount_value}
                onChange={(e) => setFormData(prev => ({...prev, discount_value: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
              />
            </div>
            <div>
              <label htmlFor="maximum_discount" className="block text-sm font-medium mb-2">
                Maximum Discount (₹)
              </label>
              <input
                id="maximum_discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.maximum_discount}
                onChange={(e) => setFormData(prev => ({...prev, maximum_discount: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="valid_from" className="block text-sm font-medium mb-2">
                Valid From *
              </label>
              <input
                id="valid_from"
                type="date"
                required
                value={formData.valid_from}
                onChange={(e) => setFormData(prev => ({...prev, valid_from: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="valid_to" className="block text-sm font-medium mb-2">
                Valid To *
              </label>
              <input
                id="valid_to"
                type="date"
                required
                value={formData.valid_to}
                onChange={(e) => setFormData(prev => ({...prev, valid_to: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="usage_limit" className="block text-sm font-medium mb-2">
              Usage Limit
            </label>
            <input
              id="usage_limit"
              type="number"
              min="1"
              value={formData.usage_limit}
              onChange={(e) => setFormData(prev => ({...prev, usage_limit: e.target.value}))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Leave empty for unlimited uses"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Promo code is active
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Promo Code' : 'Create Promo Code'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}