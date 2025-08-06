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
import { Upload, X, Loader2, Image as ImageIcon, Plus, Minus, Package2, ShoppingBag, Search, ChefHat, Gift, Settings } from "lucide-react"
import { useCategories, useProducts } from "@/lib/hooks/useSupabaseData"
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
  const { products } = useProducts()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [comboItems, setComboItems] = useState<{product_id: string, quantity: number, name: string}[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [attributes, setAttributes] = useState<{type: string, name: string, extraCost: number}[]>([])
  
  // Common attribute suggestions
  const attributeSuggestions = [
    { type: 'Size', name: 'Small', extraCost: 0 },
    { type: 'Size', name: 'Medium', extraCost: 2 },
    { type: 'Size', name: 'Large', extraCost: 5 },
    { type: 'Flavor', name: 'Chocolate', extraCost: 0 },
    { type: 'Flavor', name: 'Vanilla', extraCost: 0 },
    { type: 'Flavor', name: 'Strawberry', extraCost: 1 },
    { type: 'Topping', name: 'Extra Cream', extraCost: 3 },
    { type: 'Topping', name: 'Nuts', extraCost: 2 },
    { type: 'Topping', name: 'Sprinkles', extraCost: 1 },
    { type: 'Crust', name: 'Thin', extraCost: 0 },
    { type: 'Crust', name: 'Thick', extraCost: 2 },
    { type: 'Spice Level', name: 'Mild', extraCost: 0 },
    { type: 'Spice Level', name: 'Medium', extraCost: 0 },
    { type: 'Spice Level', name: 'Hot', extraCost: 0 },
    { type: 'Temperature', name: 'Hot', extraCost: 0 },
    { type: 'Temperature', name: 'Cold', extraCost: 0 },
  ]
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    delivery_time: "",
    is_customizable: false,
    require_image: false,
    require_name: false,
    stock_quantity: "",
    max_order_quantity: "",
    tags: "",
    product_type: "product",
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
        require_image: (product as any).require_image || false,
        require_name: (product as any).require_name || false,
        stock_quantity: product.stock_quantity?.toString() || "",
        max_order_quantity: product.max_order_quantity?.toString() || "",
        tags: product.tags || "",
        product_type: product.product_type || "product",
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

      // Handle combo items
      if (product.combo_items) {
        try {
          const items = typeof product.combo_items === 'string' 
            ? JSON.parse(product.combo_items) 
            : product.combo_items
          setComboItems(Array.isArray(items) ? items : [])
        } catch (error) {
          console.error('Error parsing combo items:', error)
          setComboItems([])
        }
      } else {
        setComboItems([])
      }

      // Handle attributes
      if (product.attributes) {
        try {
          const attrs = typeof product.attributes === 'string' 
            ? JSON.parse(product.attributes) 
            : product.attributes
          setAttributes(Array.isArray(attrs) ? attrs : [])
        } catch (error) {
          console.error('Error parsing attributes:', error)
          setAttributes([])
        }
      } else {
        setAttributes([])
      }
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        delivery_time: "",
        is_customizable: false,
        require_image: false,
        require_name: false,
        stock_quantity: "",
        max_order_quantity: "",
        tags: "",
        product_type: "product",
      })
      setProductImages([])
      setComboItems([])
      setAttributes([])
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

  const addComboItem = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct && !comboItems.find(item => item.product_id === productId)) {
      setComboItems([...comboItems, {
        product_id: productId,
        quantity: 1,
        name: selectedProduct.name
      }])
    }
  }

  const removeComboItem = (productId: string) => {
    setComboItems(comboItems.filter(item => item.product_id !== productId))
  }

  const updateComboItemQuantity = (productId: string, quantity: number) => {
    setComboItems(comboItems.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    ))
  }

  const filteredProductsForCombo = products.filter(p => 
    p.product_type === 'product' && 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    p.id !== product?.id // Don't allow adding self to combo
  )

  const addAttribute = (suggestion?: {type: string, name: string, extraCost: number}) => {
    if (suggestion) {
      if (!attributes.find(attr => attr.type === suggestion.type && attr.name === suggestion.name)) {
        setAttributes([...attributes, suggestion])
      }
    } else {
      // Add custom attribute
      setAttributes([...attributes, { type: '', name: '', extraCost: 0 }])
    }
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttribute = (index: number, field: 'type' | 'name' | 'extraCost', value: string | number) => {
    setAttributes(attributes.map((attr, i) => 
      i === index ? { ...attr, [field]: value } : attr
    ))
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
        // delivery_time: formData.delivery_time || null, // Temporarily disabled until schema is updated
        is_customizable: formData.is_customizable,
        require_image: formData.require_image,
        require_name: formData.require_name,
        is_featured: isEditing ? product?.is_featured || false : false, // Keep existing value when editing
        is_active: isEditing ? product?.is_active ?? true : true, // Auto-set to true for new products
        online_ordering: isEditing ? (product as any)?.online_ordering ?? true : true, // Auto-set to true for new products
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        max_order_quantity: formData.max_order_quantity ? parseInt(formData.max_order_quantity) : null,
        tags: formData.tags || null,
        product_type: formData.product_type,
        combo_items: formData.product_type === 'combo' && comboItems.length > 0 ? comboItems as any : null,
        attributes: attributes.length > 0 ? attributes as any : null,
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
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update product information and settings' : 'Create a new product for your menu'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Product Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, product_type: 'product' }))}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  formData.product_type === 'product'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🍰</div>
                <div className="font-medium">Product</div>
                <div className="text-xs text-gray-500">Regular menu item</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, product_type: 'combo' }))}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  formData.product_type === 'combo'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🎁</div>
                <div className="font-medium">Combo</div>
                <div className="text-xs text-gray-500">Bundle of products</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, product_type: 'addon' }))}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  formData.product_type === 'addon'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">⚡</div>
                <div className="font-medium">Add-on</div>
                <div className="text-xs text-gray-500">Extra service/item</div>
              </button>
            </div>
          </div>

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

            {/* Delivery Time - Temporarily hidden until database schema is updated */}
            {false && (
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
            )}


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

          {/* Combo Items Selection */}
          {formData.product_type === 'combo' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-blue-900">Combo Items</label>
                <span className="text-xs text-blue-700">Select products to include in this combo</span>
              </div>
              
              {/* Search products */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Selected combo items */}
              {comboItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Items ({comboItems.length})</h4>
                  {comboItems.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-white rounded-md border">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateComboItemQuantity(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateComboItemQuantity(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeComboItem(item.product_id)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available products to add */}
              {searchQuery && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700">Available Products</h4>
                  {filteredProductsForCombo.length > 0 ? (
                    filteredProductsForCombo.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addComboItem(product.id)}
                        disabled={comboItems.some(item => item.product_id === product.id)}
                        className="w-full text-left p-2 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">₹{product.price}</div>
                        </div>
                        {comboItems.some(item => item.product_id === product.id) ? (
                          <span className="text-green-600 text-sm">Added</span>
                        ) : (
                          <Plus className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">No products found</p>
                  )}
                </div>
              )}

              {comboItems.length === 0 && !searchQuery && (
                <div className="text-center py-8 border-2 border-dashed border-blue-300 rounded-lg">
                  <Package2 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">No items in combo yet</p>
                  <p className="text-xs text-blue-500">Search and add products to create your combo</p>
                </div>
              )}
            </div>
          )}

          {/* Attributes Section - For customizable products */}
          {formData.is_customizable && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-green-900">Product Attributes</label>
                <span className="text-xs text-green-700">Add customization options</span>
              </div>

              {/* Quick Add Suggestions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Add</h4>
                <div className="flex flex-wrap gap-2">
                  {attributeSuggestions.slice(0, 8).map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => addAttribute(suggestion)}
                      disabled={attributes.some(attr => attr.type === suggestion.type && attr.name === suggestion.name)}
                      className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion.type}: {suggestion.name} {suggestion.extraCost > 0 && `(+₹${suggestion.extraCost})`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAttribute()}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded-full hover:bg-blue-200"
                  >
                    + Custom
                  </button>
                </div>
              </div>

              {/* Selected Attributes */}
              {attributes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Attributes ({attributes.length})</h4>
                  {attributes.map((attribute, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-white rounded-md border">
                      <input
                        type="text"
                        placeholder="Type (e.g., Size)"
                        value={attribute.type}
                        onChange={(e) => updateAttribute(index, 'type', e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                      />
                      <input
                        type="text"
                        placeholder="Name (e.g., Large)"
                        value={attribute.name}
                        onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                      />
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">+₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={attribute.extraCost}
                          onChange={(e) => updateAttribute(index, 'extraCost', parseFloat(e.target.value) || 0)}
                          className="w-16 text-sm border border-gray-200 rounded px-2 py-1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {attributes.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-lg">
                  <Settings className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-600">No attributes added yet</p>
                  <p className="text-xs text-green-500">Add size, flavor, or other customization options</p>
                </div>
              )}
            </div>
          )}

          {/* Stock Management - Only for products and add-ons */}
          {(formData.product_type === 'product' || formData.product_type === 'addon') && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Stock Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stock_quantity_section" className="block text-sm font-medium mb-2">
                    Stock Quantity
                  </label>
                  <input
                    id="stock_quantity_section"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData(prev => ({...prev, stock_quantity: e.target.value}))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label htmlFor="max_order_quantity_section" className="block text-sm font-medium mb-2">
                    Max Order Quantity
                  </label>
                  <input
                    id="max_order_quantity_section"
                    type="number"
                    min="1"
                    value={formData.max_order_quantity}
                    onChange={(e) => setFormData(prev => ({...prev, max_order_quantity: e.target.value}))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Product Settings */}
          <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Product Settings</h3>
            
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
              <span className="text-xs text-gray-500 ml-2">Enable if this product has size, flavor, or other options</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_image"
                checked={formData.require_image}
                onChange={(e) => setFormData(prev => ({...prev, require_image: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_image" className="text-sm font-medium">
                Require image upload
              </label>
              <span className="text-xs text-gray-500 ml-2">Customers must upload image when ordering this item</span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="require_name"
                checked={formData.require_name}
                onChange={(e) => setFormData(prev => ({...prev, require_name: e.target.checked}))}
                className="rounded border-gray-300"
              />
              <label htmlFor="require_name" className="text-sm font-medium">
                Require name/text input
              </label>
              <span className="text-xs text-gray-500 ml-2">Customers must provide custom text (e.g., cake message)</span>
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