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
import { combosService, uploadImage, formatCurrency } from "@/lib/supabase-utils"
import { useProducts } from "@/lib/hooks/useSupabaseData"
import { Database } from "@/lib/database.types"

type Json = Database['public']['Tables']['combos']['Row']['products']

type Combo = Database['public']['Tables']['combos']['Row']
type ComboInsert = Database['public']['Tables']['combos']['Insert']
type Product = Database['public']['Tables']['products']['Row']

interface ComboProduct {
  product_id: string
  quantity: number
  price: number
}

interface ComboModalProps {
  isOpen: boolean
  onClose: () => void
  combo?: Combo | null
  onSuccess: () => void
}

export function ComboModal({ isOpen, onClose, combo, onSuccess }: ComboModalProps) {
  const { products } = useProducts()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    original_price: "",
    discounted_price: "",
    display_order: "",
    max_order_quantity: "",
    is_active: true,
  })

  const [comboProducts, setComboProducts] = useState<ComboProduct[]>([])

  const isEditing = !!combo

  useEffect(() => {
    if (combo) {
      setFormData({
        name: combo.name,
        description: combo.description || "",
        original_price: combo.original_price.toString(),
        discounted_price: combo.discounted_price.toString(),
        display_order: combo.display_order?.toString() || "",
        max_order_quantity: combo.max_order_quantity?.toString() || "",
        is_active: combo.is_active || true,
      })
      setImagePreview(combo.image_url || "")
      
      // Parse existing products from combo.products JSON
      if (combo.products) {
        try {
          const existingProducts = Array.isArray(combo.products) 
            ? combo.products as unknown as ComboProduct[]
            : JSON.parse(combo.products as string) as ComboProduct[]
          setComboProducts(existingProducts)
        } catch (error) {
          console.error('Error parsing combo products:', error)
          setComboProducts([])
        }
      } else {
        setComboProducts([])
      }
    } else {
      setFormData({
        name: "",
        description: "",
        original_price: "",
        discounted_price: "",
        display_order: "",
        max_order_quantity: "",
        is_active: true,
      })
      setImagePreview("")
      setComboProducts([])
    }
    setImageFile(null)
  }, [combo, isOpen])

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

  const getAvailableProducts = () => {
    const addedProductIds = comboProducts.map(cp => cp.product_id)
    return products.filter(p => !addedProductIds.includes(p.id))
  }

  const addProduct = () => {
    const availableProducts = getAvailableProducts()
    if (availableProducts.length > 0) {
      const firstProduct = availableProducts[0]
      setComboProducts([...comboProducts, {
        product_id: firstProduct.id,
        quantity: 1,
        price: firstProduct.price
      }])
    }
  }

  const removeProduct = (index: number) => {
    setComboProducts(comboProducts.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: keyof ComboProduct, value: string | number) => {
    const updated = [...comboProducts]
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value)
      if (selectedProduct) {
        updated[index] = {
          ...updated[index],
          product_id: value as string,
          price: selectedProduct.price
        }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: field === 'quantity' ? parseInt(value as string) : parseFloat(value as string)
      }
    }
    setComboProducts(updated)
  }

  const calculateTotalPrice = () => {
    return comboProducts.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Auto-suggest original price based on total product value
  const suggestedOriginalPrice = calculateTotalPrice()
  
  const autoFillOriginalPrice = () => {
    if (suggestedOriginalPrice > 0) {
      setFormData(prev => ({
        ...prev, 
        original_price: suggestedOriginalPrice.toString()
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = combo?.image_url || ""
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true)
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
        setUploading(false)
      }

      const comboData: ComboInsert = {
        name: formData.name,
        description: formData.description || null,
        original_price: parseFloat(formData.original_price),
        discounted_price: parseFloat(formData.discounted_price),
        display_order: formData.display_order ? parseInt(formData.display_order) : null,
        max_order_quantity: formData.max_order_quantity ? parseInt(formData.max_order_quantity) : null,
        is_active: formData.is_active,
        image_url: imageUrl || null,
        products: comboProducts.length > 0 ? comboProducts as unknown as Json : null,
      }

      if (isEditing && combo) {
        await combosService.update(combo.id, comboData)
      } else {
        await combosService.create(comboData)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving combo:', error)
      alert('Error saving combo. Please try again.')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const savings = formData.original_price && formData.discounted_price 
    ? parseFloat(formData.original_price) - parseFloat(formData.discounted_price)
    : 0

  const savingsPercent = formData.original_price && savings > 0
    ? ((savings / parseFloat(formData.original_price)) * 100).toFixed(1)
    : 0

  const totalPrice = calculateTotalPrice()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Combo' : 'Create New Combo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update combo deal information and pricing' : 'Create a new combo deal with discounted pricing'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Combo Image</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="combo-image-upload"
                />
                <label
                  htmlFor="combo-image-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Combo Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Combo Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g., Family Feast Combo"
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
                placeholder="Describe what's included in this combo"
              />
            </div>

            {/* Original Price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="original_price" className="block text-sm font-medium">
                  Original Price (₹) *
                </label>
                {suggestedOriginalPrice > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={autoFillOriginalPrice}
                    className="text-xs h-6 px-2"
                  >
                    Use {formatCurrency(suggestedOriginalPrice)}
                  </Button>
                )}
              </div>
              <input
                id="original_price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.original_price}
                onChange={(e) => setFormData(prev => ({...prev, original_price: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.00"
              />
              {suggestedOriginalPrice > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {formatCurrency(suggestedOriginalPrice)} (based on products)
                </p>
              )}
            </div>

            {/* Discounted Price */}
            <div>
              <label htmlFor="discounted_price" className="block text-sm font-medium mb-2">
                Discounted Price (₹) *
              </label>
              <input
                id="discounted_price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.discounted_price}
                onChange={(e) => setFormData(prev => ({...prev, discounted_price: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0.00"
              />
            </div>

            {/* Savings Display */}
            {savings > 0 && (
              <div className="md:col-span-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800">
                  Savings: {formatCurrency(savings)} ({savingsPercent}% off)
                </div>
              </div>
            )}

            {/* Display Order */}
            <div>
              <label htmlFor="display_order" className="block text-sm font-medium mb-2">
                Display Order
              </label>
              <input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({...prev, display_order: e.target.value}))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
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
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Active Checkbox */}
            <div className="md:col-span-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Combo is active
              </label>
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Combo Products</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
                disabled={getAvailableProducts().length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {comboProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products added yet. Click "Add Product" to get started.</p>
                {products.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">No products available. Please create products first.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {comboProducts.map((item, index) => {
                  const selectedProduct = products.find(p => p.id === item.product_id)
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      {/* Product Image */}
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {(() => {
                          let imageUrl = null
                          if (selectedProduct?.images) {
                            try {
                              const images = Array.isArray(selectedProduct.images) 
                                ? selectedProduct.images 
                                : JSON.parse(selectedProduct.images as string)
                              imageUrl = images?.[0]
                            } catch (e) {
                              imageUrl = selectedProduct.image_url
                            }
                          } else {
                            imageUrl = selectedProduct?.image_url
                          }
                          
                          return imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={selectedProduct?.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null
                        })()}
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <select
                          value={item.product_id}
                          onChange={(e) => updateProduct(index, 'product_id', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {/* Show current product even if it would be filtered out */}
                          {selectedProduct && (
                            <option key={selectedProduct.id} value={selectedProduct.id}>
                              {selectedProduct.name} - {formatCurrency(selectedProduct.price)}
                            </option>
                          )}
                          {/* Show available products */}
                          {getAvailableProducts().map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="w-20">
                        <label className="block text-xs text-gray-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateProduct(index, 'price', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="text-sm font-medium text-gray-700 w-20 text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProduct(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}

                {totalPrice > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-800">
                      Total Product Value: {formatCurrency(totalPrice)}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                isEditing ? 'Update Combo' : 'Create Combo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}