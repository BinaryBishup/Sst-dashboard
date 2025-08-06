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
  Loader2,
  Package2,
} from "lucide-react"
import { useCombos } from "@/lib/hooks/useSupabaseData"
import { ComboModal } from "@/components/modals/ComboModal"
import { combosService, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Combo = Database['public']['Tables']['combos']['Row']

export default function CombosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null)
  const [editingField, setEditingField] = useState<{id: string, field: string, value: string} | null>(null)
  const { combos, loading, error, refetch } = useCombos()

  const handleAddCombo = () => {
    setEditingCombo(null)
    setIsModalOpen(true)
  }

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo)
    setIsModalOpen(true)
  }

  const handleDeleteCombo = async (combo: Combo) => {
    if (confirm(`Are you sure you want to delete "${combo.name}"?`)) {
      try {
        await combosService.delete(combo.id)
        refetch()
      } catch (error) {
        console.error('Error deleting combo:', error)
        alert('Error deleting combo. Please try again.')
      }
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  const updateComboField = async (comboId: string, field: string, value: any) => {
    try {
      await combosService.update(comboId, { [field]: value })
      refetch()
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      alert(`Error updating ${field}. Please try again.`)
    }
  }

  const toggleStatus = async (combo: Combo) => {
    await updateComboField(combo.id, 'is_active', !combo.is_active)
  }

  const handleInlineEdit = (comboId: string, field: string, currentValue: string) => {
    setEditingField({ id: comboId, field, value: currentValue })
  }

  const saveInlineEdit = async () => {
    if (!editingField) return
    
    const { id, field, value } = editingField
    let processedValue: any = value

    if (field === 'max_order_quantity') {
      processedValue = value === '' ? null : parseInt(value)
      if (processedValue !== null && (isNaN(processedValue) || processedValue < 1)) {
        alert('Please enter a valid quantity (minimum 1)')
        return
      }
    }

    await updateComboField(id, field, processedValue)
    setEditingField(null)
  }

  const cancelInlineEdit = () => {
    setEditingField(null)
  }

  const filteredCombos = combos.filter(combo => 
    combo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <p className="text-red-600 mb-2">Error loading combos</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Combos</h2>
            <p className="text-muted-foreground">
              Manage product bundles and discounted meal combinations
            </p>
          </div>
          <Button onClick={handleAddCombo}>
            <Plus className="mr-2 h-4 w-4" />
            Create Combo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle>Combo List</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search combos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combo</TableHead>
                    <TableHead>Original Price</TableHead>
                    <TableHead>Discounted Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Max Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombos.map((combo) => {
                    return (
                      <TableRow key={combo.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                              {combo.image_url ? (
                                <img 
                                  src={combo.image_url} 
                                  alt={combo.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <Package2 className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{combo.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {combo.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(combo.original_price)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(combo.discounted_price)}</TableCell>
                        
                        {/* Inline Max Quantity Editing */}
                        <TableCell className="hidden sm:table-cell">
                          {editingField?.id === combo.id && editingField?.field === 'max_order_quantity' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
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
                              onClick={() => handleInlineEdit(combo.id, 'max_order_quantity', combo.max_order_quantity?.toString() || '')}
                            >
                              {combo.max_order_quantity || "Unlimited"}
                            </span>
                          )}
                        </TableCell>
                        
                        {/* Inline Status Toggle */}
                        <TableCell>
                          <button
                            onClick={() => toggleStatus(combo)}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${
                              combo.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {combo.is_active ? "Active" : "Inactive"}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditCombo(combo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteCombo(combo)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <ComboModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        combo={editingCombo}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}