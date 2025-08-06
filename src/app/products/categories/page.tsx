"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Edit,
  Trash2,
  Pizza,
  Coffee,
  Salad,
  Sandwich,
  IceCream,
  Soup,
  Loader2,
  Package
} from "lucide-react"
import { useCategories, useProducts } from "@/lib/hooks/useSupabaseData"
import { CategoryModal } from "@/components/modals/CategoryModal"
import { categoriesService } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Category = Database['public']['Tables']['categories']['Row']

const getIconForCategory = (name: string) => {
  const lowercaseName = name.toLowerCase()
  if (lowercaseName.includes('pizza')) return Pizza
  if (lowercaseName.includes('burger')) return Sandwich
  if (lowercaseName.includes('salad')) return Salad
  if (lowercaseName.includes('drink') || lowercaseName.includes('beverage')) return Coffee
  if (lowercaseName.includes('dessert') || lowercaseName.includes('ice')) return IceCream
  if (lowercaseName.includes('soup')) return Soup
  return Package
}

const getColorForIndex = (index: number) => {
  const colors = [
    "bg-red-100 text-red-600",
    "bg-yellow-100 text-yellow-600", 
    "bg-green-100 text-green-600",
    "bg-blue-100 text-blue-600",
    "bg-pink-100 text-pink-600",
    "bg-orange-100 text-orange-600",
    "bg-purple-100 text-purple-600",
    "bg-indigo-100 text-indigo-600"
  ]
  return colors[index % colors.length]
}

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { categories, loading: categoriesLoading, error: categoriesError, refetch } = useCategories()
  const { products } = useProducts()

  // Count products per category
  const categoryProductCounts = categories.map(category => {
    const productCount = products.filter(product => 
      product.category_id === category.id || product.category === category.name
    ).length
    return { ...category, productCount }
  })

  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await categoriesService.delete(category.id)
        refetch()
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Error deleting category. Please try again.')
      }
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  if (categoriesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (categoriesError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading categories</p>
            <p className="text-sm text-gray-500">{categoriesError}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoryProductCounts.map((category, index) => {
            const IconComponent = getIconForCategory(category.name)
            const colorClass = getColorForIndex(index)
            
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {category.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCategory(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCategory(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className={`relative p-3 rounded-lg ${colorClass} overflow-hidden`}>
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="h-8 w-8 object-cover rounded absolute inset-0 w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <IconComponent className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{category.productCount}</p>
                      <p className="text-sm text-muted-foreground">Products</p>
                      {!category.is_active && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 mt-1">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}