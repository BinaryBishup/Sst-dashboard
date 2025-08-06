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
import { Upload, X, Loader2, Image as ImageIcon, Plus, Minus } from "lucide-react"
import { useCategories } from "@/lib/hooks/useSupabaseData"
import { productsService, uploadImage } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  onSuccess: () => void
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const { categories } = useCategories()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    delivery_time: "",
    is_customizable: false,
    is_featured: false,
    is_active: true,
    stock_quantity: "",
    max_order_quantity: "",
    tags: "",
  })

  const isEditing = !!product

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        category_id: product.category_id || "",
        delivery_time: product.delivery_time || "",
        is_customizable: product.is_customizable || false,
        is_featured: product.is_featured || false,
        is_active: product.is_active || true,
        stock_quantity: product.stock_quantity?.toString() || "",
        max_order_quantity: product.max_order_quantity?.toString() || "",
        tags: product.tags || "",
      })
      
      // Handle images array
      if (product.images && Array.isArray(product.images)) {
        setProductImages(product.images)
      } else if (product.images && typeof product.images === 'string') {
        // Handle legacy JSON string format
        try {
          const images = JSON.parse(product.images)
          setProductImages(Array.isArray(images) ? images : [])
        } catch (error) {
          console.error('Error parsing product images:', error)
          setProductImages([])
        }
      } else if (product.image_url) {
        // Fallback to single image_url if images array is empty
        setProductImages([product.image_url])
      } else {
        setProductImages([])
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        delivery_time: "",
        is_customizable: false,
        is_featured: false,
        is_active: true,
        stock_quantity: "",
        max_order_quantity: "",
        tags: "",
      })
      setProductImages([])
    }
    setNewImageFiles([])
  }, [product, isOpen])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setNewImageFiles([...newImageFiles, ...files])
    }
  }

  const removeExistingImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index))
  }

  const addImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (url && url.trim()) {
      setProductImages([...productImages, url.trim()])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let allImages = [...productImages]
      
      // Upload new image files if any
      if (newImageFiles.length > 0) {
        setUploading(true)
        for (const file of newImageFiles) {
          const uploadedUrl = await uploadImage(file)
          if (uploadedUrl) {
            allImages.push(uploadedUrl)
          }
        }
        setUploading(false)
      }

      const productData: ProductInsert = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        delivery_time: formData.delivery_time || null,
        is_customizable: formData.is_customizable,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        max_order_quantity: formData.max_order_quantity ? parseInt(formData.max_order_quantity) : null,
        tags: formData.tags || null,
        image_url: allImages.length > 0 ? allImages[0] : null, // First image as main image
        images: allImages.length > 0 ? allImages : null, // Send as array, not JSON string
      }

      if (isEditing && product) {
        await productsService.update(product.id, productData)
      } else {
        await productsService.create(productData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product. Please try again.')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update product information and settings' : 'Create a new product for your menu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Product Images</label>
              <div className="flex space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageUrl}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add URL
                </Button>
              </div>
            </div>

            {/* Existing Images */}
            {productImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-20 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images to Upload */}
            {newImageFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images to Upload</h4>
                <div className="grid grid-cols-4 gap-2">
                  {newImageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-20 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productImages.length === 0 && newImageFiles.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No images added yet</p>
                <p className="text-xs text-gray-400">Upload files or add URLs to get started</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter product name"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Describe your product"
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price (₹) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({...prev, category_id: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Time */}
            <div>
              <label htmlFor="delivery_time" className="block text-sm font-medium mb-2">
                Delivery Time
              </label>
              <input
                id="delivery_time"
                type="text"
                value={formData.delivery_time}
                onChange={(e) => setFormData(prev => ({...prev, delivery_time: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 20-30 mins"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium mb-2">
                Stock Quantity
              </label>
              <input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({...prev, stock_quantity: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Max Order Quantity */}
            <div>
              <label htmlFor="max_order_quantity" className="block text-sm font-medium mb-2">
                Max Order Quantity
              </label>
              <input
                id="max_order_quantity"
                type="number"
                min="1"
                value={formData.max_order_quantity}
                onChange={(e) => setFormData(prev => ({...prev, max_order_quantity: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., 10"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-2">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({...prev, tags: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="spicy, vegetarian, popular (comma-separated)"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_customizable"
                checked={formData.is_customizable}
                onChange={(e) => setFormData(prev => ({...prev, is_customizable: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_customizable" className="text-sm font-medium">
                Allow customization
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({...prev, is_featured: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_featured" className="text-sm font-medium">
                Featured product
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
                Product is active
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
                isEditing ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}