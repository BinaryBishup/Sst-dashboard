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
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Loader2,
  Image as ImageIcon
} from "lucide-react"
import { useAddons } from "@/lib/hooks/useSupabaseData"
import { AddonModal } from "@/components/modals/AddonModal"
import { addonsService, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type Addon = Database['public']['Tables']['cart_addons']['Row']

export default function AddonsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { addons, loading, error, refetch } = useAddons()

  const filteredAddons = addons.filter(addon => 
    addon.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddAddon = () => {
    setEditingAddon(null)
    setIsModalOpen(true)
  }

  const handleEditAddon = (addon: Addon) => {
    setEditingAddon(addon)
    setIsModalOpen(true)
  }

  const handleDeleteAddon = async (addon: Addon) => {
    if (confirm(`Are you sure you want to delete "${addon.name}"?`)) {
      try {
        await addonsService.delete(addon.id)
        refetch()
      } catch (error) {
        console.error('Error deleting addon:', error)
        alert('Error deleting add-on. Please try again.')
      }
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  const toggleAddonStatus = async (addon: Addon) => {
    try {
      await addonsService.update(addon.id, { status: !addon.status })
      refetch()
    } catch (error) {
      console.error('Error toggling addon status:', error)
      alert('Error updating addon status. Please try again.')
    }
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
            <p className="text-red-600 mb-2">Error loading add-ons</p>
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
            <h2 className="text-3xl font-bold tracking-tight">Add-ons</h2>
            <p className="text-muted-foreground">
              Manage additional options for your products
            </p>
          </div>
          <Button onClick={handleAddAddon}>
            <Plus className="mr-2 h-4 w-4" />
            Add Add-on
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle>Add-on List</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search add-ons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Add-on</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddons.map((addon) => (
                  <TableRow key={addon.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {addon.image_url ? (
                            <img 
                              src={addon.image_url} 
                              alt={addon.name || "Add-on"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <Plus className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="font-medium">{addon.name || "Unnamed Add-on"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {addon.price ? formatCurrency(addon.price) : "Free"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleAddonStatus(addon)}
                        className={`transition-colors hover:opacity-80 ${
                          addon.status ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"
                        }`}
                      >
                        {addon.status ? (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Inactive
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditAddon(addon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAddon(addon)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addon={editingAddon}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}

