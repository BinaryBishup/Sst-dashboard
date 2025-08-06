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
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { addonsService, uploadImage, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Addon = Database['public']['Tables']['cart_addons']['Row']
type AddonInsert = Database['public']['Tables']['cart_addons']['Insert']

interface AddonModalProps {
  isOpen: boolean
  onClose: () => void
  addon?: Addon | null
  onSuccess: () => void
}

export function AddonModal({ isOpen, onClose, addon, onSuccess }: AddonModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    status: true,
  })

  const isEditing = !!addon

  useEffect(() => {
    if (addon) {
      setFormData({
        name: addon.name || "",
        price: addon.price?.toString() || "",
        status: addon.status || true,
      })
      setImagePreview(addon.image_url || "")
    } else {
      setFormData({
        name: "",
        price: "",
        status: true,
      })
      setImagePreview("")
    }
    setImageFile(null)
  }, [addon, isOpen])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = addon?.image_url || ""
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
        setUploading(false)
      }

      const addonData: AddonInsert = {
        name: formData.name || null,
        price: formData.price ? parseFloat(formData.price) : null,
        status: formData.status,
        image_url: imageUrl || null,
      }

      if (isEditing && addon) {
        await addonsService.update(addon.id, addonData)
      } else {
        await addonsService.create(addonData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving addon:', error)
      alert('Error saving add-on. Please try again.')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Add-on' : 'Add New Add-on'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update add-on information and settings' : 'Create a new add-on option for your products'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add-on Image</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="addon-image-upload"
                />
                <label
                  htmlFor="addon-image-upload"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </label>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => {
                      setImagePreview("")
                      setImageFile(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Add-on Name */}
            <div>
              <label htmlFor="addonName" className="block text-sm font-medium mb-2">
                Add-on Name *
              </label>
              <input
                id="addonName"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter add-on name"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="addonPrice" className="block text-sm font-medium mb-2">
                Price (₹)
              </label>
              <input
                id="addonPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.00 (Leave empty for free)"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for free add-ons</p>
            </div>

            {/* Price Preview */}
            {formData.price && parseFloat(formData.price) > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">
                  Price: {formatCurrency(parseFloat(formData.price))}
                </div>
              </div>
            )}

            {/* Status Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="status"
                checked={formData.status}
                onChange={(e) => setFormData(prev => ({...prev, status: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="status" className="text-sm font-medium">
                Add-on is active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                isEditing ? 'Update Add-on' : 'Create Add-on'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}