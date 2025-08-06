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
import { deliveryPartnersService, uploadImage } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type DeliveryPartner = Database['public']['Tables']['delivery_partners']['Row']
type DeliveryPartnerInsert = Database['public']['Tables']['delivery_partners']['Insert']

interface DeliveryPartnerModalProps {
  isOpen: boolean
  onClose: () => void
  deliveryPartner?: DeliveryPartner | null
  onSuccess: () => void
}

export function DeliveryPartnerModal({ isOpen, onClose, deliveryPartner, onSuccess }: DeliveryPartnerModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar_url: "",
    vehicle_type: "bike",
    vehicle_number: "",
    current_location: "",
    is_available: true,
    is_active: true,
  })

  const isEditing = !!deliveryPartner

  useEffect(() => {
    if (deliveryPartner) {
      setFormData({
        name: deliveryPartner.name || "",
        email: deliveryPartner.email || "",
        phone: deliveryPartner.phone || "",
        avatar_url: deliveryPartner.avatar_url || "",
        vehicle_type: deliveryPartner.vehicle_type || "bike",
        vehicle_number: deliveryPartner.vehicle_number || "",
        current_location: deliveryPartner.current_location || "",
        is_available: deliveryPartner.is_available || true,
        is_active: deliveryPartner.is_active || true,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        avatar_url: "",
        vehicle_type: "bike",
        vehicle_number: "",
        current_location: "",
        is_available: true,
        is_active: true,
      })
    }
  }, [deliveryPartner, isOpen])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const imageUrl = await uploadImage(file, 'images')
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const partnerData: DeliveryPartnerInsert = {
        name: formData.name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        avatar_url: formData.avatar_url || null,
        vehicle_type: formData.vehicle_type || null,
        vehicle_number: formData.vehicle_number || null,
        current_location: formData.current_location || null,
        is_available: formData.is_available,
        is_active: formData.is_active,
        rating: 5.0, // Default rating for new partners
        total_deliveries: 0, // Start with 0 deliveries
      }

      if (isEditing && deliveryPartner) {
        await deliveryPartnersService.update(deliveryPartner.id, partnerData)
      } else {
        await deliveryPartnersService.create(partnerData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving delivery partner:', error)
      alert('Error saving delivery partner. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update delivery partner information' : 'Register a new member to your delivery team'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="john.doe@example.com"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              {formData.avatar_url && (
                <div className="flex-shrink-0">
                  <img 
                    src={formData.avatar_url} 
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                  disabled={uploading}
                />
                {uploading && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
            {formData.avatar_url && (
              <div className="mt-2">
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({...prev, avatar_url: e.target.value}))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Or enter photo URL directly"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicle_type" className="block text-sm font-medium mb-2">
                Vehicle Type
              </label>
              <select
                id="vehicle_type"
                value={formData.vehicle_type}
                onChange={(e) => setFormData(prev => ({...prev, vehicle_type: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="bike">Bike</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>
            <div>
              <label htmlFor="vehicle_number" className="block text-sm font-medium mb-2">
                Vehicle Number
              </label>
              <input
                id="vehicle_number"
                type="text"
                value={formData.vehicle_number}
                onChange={(e) => setFormData(prev => ({...prev, vehicle_number: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., MH12AB1234"
              />
            </div>
          </div>

          <div>
            <label htmlFor="current_location" className="block text-sm font-medium mb-2">
              Current Location/Zone
            </label>
            <input
              id="current_location"
              type="text"
              value={formData.current_location}
              onChange={(e) => setFormData(prev => ({...prev, current_location: e.target.value}))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="e.g., Downtown, Uptown, etc."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_available"
                checked={formData.is_available}
                onChange={(e) => setFormData(prev => ({...prev, is_available: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_available" className="text-sm font-medium">
                Currently available for deliveries
              </label>
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
                Partner is active
              </label>
            </div>
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
                isEditing ? 'Update Partner' : 'Add Partner'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}