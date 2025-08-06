"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Package2,
  ShoppingBag,
  Filter,
  ChefHat,
  Utensils,
  Gift,
  Settings
} from "lucide-react"
import { useProducts, useCategories } from "@/lib/hooks/useSupabaseData"
import { ProductModal } from "@/components/modals/ProductModal"
import { productsService, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Product = Database['public']['Tables']['products']['Row']

const getStockStatus = (product: any) => {
  if (!product.is_active) return "Inactive"
  if (product.stock_quantity === null) return "Available"
  if (product.stock_quantity === 0) return "Out of Stock"
  if (product.stock_quantity <= 5) return "Low Stock"
  return "In Stock"
}

const stockStyles = {
  "In Stock": "bg-green-100 text-green-800",
  "Low Stock": "bg-yellow-100 text-yellow-800",
  "Out of Stock": "bg-red-100 text-red-800",
  "Inactive": "bg-gray-100 text-gray-800",
  "Available": "bg-blue-100 text-blue-800",
}

const productTypes = [
  { value: 'product', label: 'Products', icon: ChefHat, emoji: '🍰' },
  { value: 'combo', label: 'Combos', icon: Gift, emoji: '🎁' },
  { value: 'addon', label: 'Add-ons', icon: Settings, emoji: '⚡' }
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string, value: string} | null>(null)
  const { products, loading, error, refetch } = useProducts()
  const { categories } = useCategories()

  // Handle URL query parameters
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam && ['product', 'combo', 'addon'].includes(typeParam)) {
      setSelectedType(typeParam)
    }
  }, [searchParams])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || 
      product.category_id === selectedCategory ||
      (product as any).categories?.id === selectedCategory
    
    const matchesType = selectedType === "all" || 
      product.product_type === selectedType ||
      (!product.product_type && selectedType === "product")
    
    return matchesSearch && matchesCategory && matchesType
  })

  // Get counts for each type
  const getTypeCounts = () => {
    return {
      all: products.length,
      product: products.filter(p => !p.product_type || p.product_type === 'product').length,
      combo: products.filter(p => p.product_type === 'combo').length,
      addon: products.filter(p => p.product_type === 'addon').length
    }
  }

  const typeCounts = getTypeCounts()

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await productsService.delete(product.id)
        refetch()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Error deleting product. Please try again.')
      }
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  const updateProductField = async (productId: string, field: string, value: any) => {
    try {
      await productsService.update(productId, { [field]: value })
      refetch()
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Error updating ${field}. Please try again.`)
    }
  }

  const handleInlineEdit = (productId: string, field: string, currentValue: string) => {
    setEditingField({ id: productId, field, value: currentValue })
  }

  const saveInlineEdit = async () => {
    if (!editingField) return
    
    const { id, field, value } = editingField
    let processedValue: any = value

    // Process value based on field type
    if (field === 'price') {
      processedValue = parseFloat(value)
      if (isNaN(processedValue) || processedValue < 0) {
        alert('Please enter a valid price')
        return
      }
    } else if (field === 'stock_quantity') {
      processedValue = value === '' ? null : parseInt(value)
      if (processedValue !== null && (isNaN(processedValue) || processedValue < 0)) {
        alert('Please enter a valid stock quantity')
        return
      }
    }

    await updateProductField(id, field, processedValue)
    setEditingField(null)
  }

  const cancelInlineEdit = () => {
    setEditingField(null)
  }

  const toggleStock = async (product: Product) => {
    const newStock = product.stock_quantity === 0 ? 10 : 0
    await updateProductField(product.id, 'stock_quantity', newStock)
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
            <p className="text-red-600 mb-2">Error loading products</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Type Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${selectedType === 'all' ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            <CardContent className="p-6 text-center">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{typeCounts.all}</div>
              <div className="text-sm font-medium text-gray-600">All Items</div>
            </CardContent>
          </Card>
          
          {productTypes.map((type) => {
            const Icon = type.icon
            const count = typeCounts[type.value as keyof typeof typeCounts]
            const isSelected = selectedType === type.value
            return (
              <Card 
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' : ''
                }`}
                onClick={() => setSelectedType(type.value)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-2">{type.emoji}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                  <div className="text-sm font-medium text-gray-600">{type.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle>Product List</CardTitle>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const productType = product.product_type || 'product'
                  const typeConfig = productTypes.find(t => t.value === productType)
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {(() => {
                              // Try to get first image from images array, fallback to image_url
                              let imageUrl = null
                              if (product.images) {
                                try {
                                  const images = Array.isArray(product.images) 
                                    ? product.images 
                                    : JSON.parse(product.images as string)
                                  imageUrl = images?.[0]
                                } catch (e) {
                                  imageUrl = product.image_url
                                }
                              } else {
                                imageUrl = product.image_url
                              }
                              
                              return imageUrl ? (
                                <img 
                                  src={imageUrl} 
                                  alt={product.name}
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
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description || "No description"}
                            </div>
                            {product.is_featured && (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 mt-1">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* Type Column */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{typeConfig?.emoji || '🍽️'}</span>
                          <span className="text-sm font-medium text-gray-700">
                            {typeConfig?.label || 'Product'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>{product.category || (product as any).categories?.name || "Uncategorized"}</TableCell>
                      
                      {/* Inline Price Editing */}
                      <TableCell className="font-medium">
                        {editingField?.id === product.id && editingField?.field === 'price' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingField.value}
                              onChange={(e) => setEditingField({...editingField, value: e.target.value})}
                              className="w-20 px-2 py-1 text-sm border rounded focus:border-primary focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit()
                                if (e.key === 'Escape') cancelInlineEdit()
                              }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit}>✓</Button>
                            <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>✗</Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={() => handleInlineEdit(product.id, 'price', product.price.toString())}
                          >
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </TableCell>

                      {/* Inline Stock Editing */}
                      <TableCell>
                        {editingField?.id === product.id && editingField?.field === 'stock_quantity' ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              value={editingField.value}
                              onChange={(e) => setEditingField({...editingField, value: e.target.value})}
                              className="w-16 px-2 py-1 text-sm border rounded focus:border-primary focus:outline-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveInlineEdit()
                                if (e.key === 'Escape') cancelInlineEdit()
                              }}
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveInlineEdit}>✓</Button>
                            <Button size="sm" variant="ghost" onClick={cancelInlineEdit}>✗</Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={() => handleInlineEdit(product.id, 'stock_quantity', product.stock_quantity?.toString() || '')}
                          >
                            {product.stock_quantity ?? 'Unlimited'}
                          </span>
                        )}
                      </TableCell>

                      {/* Active Toggle */}
                      <TableCell>
                        <button
                          onClick={() => updateProductField(product.id, 'is_active', !product.is_active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            product.is_active ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </TableCell>
                      
                      {/* Featured Toggle */}
                      <TableCell>
                        <button
                          onClick={() => updateProductField(product.id, 'is_featured', !product.is_featured)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                            product.is_featured ? 'bg-yellow-500' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.is_featured ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </TableCell>
                      
                      {/* Online Ordering Toggle */}
                      <TableCell>
                        <button
                          onClick={() => updateProductField(product.id, 'online_ordering', !(product as any).online_ordering)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                            (product as any).online_ordering ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            (product as any).online_ordering ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product)} className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
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

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}