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
import { categoriesService, uploadImage } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category?: Category | null
  onSuccess: () => void
}

export function CategoryModal({ isOpen, onClose, category, onSuccess }: CategoryModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: "",
    is_active: true,
  })

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug || "",
        description: category.description || "",
        display_order: category.display_order?.toString() || "",
        is_active: category.is_active || true,
      })
      setImagePreview(category.image_url || "")
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        display_order: "",
        is_active: true,
      })
      setImagePreview("")
    }
    setImageFile(null)
  }, [category, isOpen])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

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
      let imageUrl = category?.image_url || ""
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
        setUploading(false)
      }

      const categoryData: CategoryInsert = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
        is_active: formData.is_active,
        image_url: imageUrl || null,
      }

      if (isEditing && category) {
        await categoriesService.update(category.id, categoryData)
      } else {
        await categoriesService.create(categoryData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error saving category. Please try again.')
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
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update category information and settings' : 'Create a new category to organize your products'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Image</label>
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
                  id="category-image-upload"
                />
                <label
                  htmlFor="category-image-upload"
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
            {/* Category Name */}
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium mb-2">
                Category Name *
              </label>
              <input
                id="categoryName"
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter category name"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="categorySlug" className="block text-sm font-medium mb-2">
                URL Slug
              </label>
              <input
                id="categorySlug"
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({...prev, slug: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="category-slug"
              />
              <p className="text-xs text-gray-500 mt-1">Used in URLs. Leave empty to auto-generate.</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="categoryDesc" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="categoryDesc"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe this category"
              />
            </div>

            {/* Display Order */}
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium mb-2">
                Display Order
              </label>
              <input
                id="displayOrder"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({...prev, display_order: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Category is active
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
                isEditing ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}