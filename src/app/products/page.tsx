"use client"

import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  Loader2
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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string, value: string} | null>(null)
  const { products, loading, error, refetch } = useProducts()
  const { categories } = useCategories()

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = !selectedCategory || 
      product.category_id === selectedCategory ||
      (product as any).categories?.id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your restaurant menu items
            </p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
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
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
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

                      {/* Stock Status with Quick Toggle */}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stockStyles[stockStatus as keyof typeof stockStyles]}`}>
                            {stockStatus}
                          </span>
                          {product.stock_quantity !== null && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleStock(product)}
                              className="h-6 px-2 text-xs"
                            >
                              {product.stock_quantity === 0 ? 'Stock In' : 'Stock Out'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
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