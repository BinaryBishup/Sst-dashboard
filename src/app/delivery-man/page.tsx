"use client"

import { useState, useEffect } from "react"
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
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Star,
  Truck,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Edit,
  Trash2
} from "lucide-react"
import { DeliveryPartnerModal } from "@/components/modals/DeliveryPartnerModal"
import { deliveryPartnersService } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"

type DeliveryPartner = Database['public']['Tables']['delivery_partners']['Row']

const getPartnerStatus = (partner: DeliveryPartner) => {
  if (!partner.is_active) return "Inactive"
  if (partner.is_available) return "Available" 
  return "Busy"
}

const statusStyles = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Available: "bg-green-100 text-green-800",
  Busy: "bg-orange-100 text-orange-800",
}

export default function DeliveryManPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null)
  const [partners, setPartners] = useState<DeliveryPartner[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const data = await deliveryPartnersService.getAll()
      setPartners(data)
    } catch (error) {
      console.error('Error fetching delivery partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const handleEdit = (partner: DeliveryPartner) => {
    setSelectedPartner(partner)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedPartner(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this delivery partner?')) {
      try {
        await deliveryPartnersService.delete(id)
        fetchPartners()
      } catch (error) {
        console.error('Error deleting delivery partner:', error)
        alert('Error deleting delivery partner')
      }
    }
  }

  const handleModalSuccess = () => {
    fetchPartners()
    setIsModalOpen(false)
    setSelectedPartner(null)
  }

  const filteredPartners = partners.filter(partner =>
    partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.phone?.includes(searchQuery) ||
    partner.current_location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activePartners = partners.filter(p => p.is_active).length
  const availablePartners = partners.filter(p => p.is_active && p.is_available).length
  const avgRating = partners.length > 0 
    ? (partners.reduce((sum, p) => sum + (p.rating || 0), 0) / partners.length).toFixed(1)
    : "0.0"
  const totalDeliveries = partners.reduce((sum, p) => sum + (p.total_deliveries || 0), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Staff</h1>
          <Button onClick={handleAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Delivery Person
          </Button>
        </div>


        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Delivery Staff List</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search delivery partners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Vehicle & Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading delivery partners...
                    </TableCell>
                  </TableRow>
                ) : filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No delivery partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {partner.avatar_url ? (
                            <img
                              src={partner.avatar_url}
                              alt={partner.name || 'Partner'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm sm:text-base">{partner.name || 'No Name'}</div>
                            <div className="text-xs sm:hidden text-muted-foreground">
                              {partner.phone || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact - hidden on mobile */}
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1">
                          {partner.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                              {partner.phone}
                            </div>
                          )}
                          {partner.email && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Mail className="mr-1 h-3 w-3" />
                              {partner.email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Vehicle & Status - hidden on small screens */}
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Truck className="w-3 h-3 text-muted-foreground" />
                            <span className="capitalize text-sm">{partner.vehicle_type || 'N/A'}</span>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[getPartnerStatus(partner) as keyof typeof statusStyles]}`}>
                            {getPartnerStatus(partner)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex space-x-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(partner)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(partner.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DeliveryPartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deliveryPartner={selectedPartner}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  )
}