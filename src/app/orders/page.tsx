"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  CheckCircle,
  ChefHat,
  Truck,
  Package,
  XCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Hash,
  DollarSign,
  Printer,
  UserCheck,
  Loader2,
  Bell,
  AlertCircle,
  ShoppingBag,
  Car,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calculator
} from "lucide-react"
import { ordersService, deliveryPartnersService, formatCurrency } from "@/lib/supabase-utils"
import { Database, OrderItem } from "@/lib/database.types"
import { useNewOrderNotification } from "@/hooks/useNewOrderNotification"

// Updated Order type for new simplified schema
type Order = Database['public']['Tables']['orders']['Row'] & {
  profiles?: {
    id: string
    full_name: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
  }
  delivery_partners?: {
    id: string
    name: string | null
    phone: string | null
    vehicle_type: string | null
    is_available: boolean | null
  }
}

type DeliveryPartner = Database['public']['Tables']['delivery_partners']['Row']

const orderStatuses = [
  { 
    key: 'pending', 
    label: 'Pending', 
    icon: Clock, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    cardColor: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    count: 0 
  },
  { 
    key: 'confirmed', 
    label: 'Confirmed', 
    icon: CheckCircle, 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    cardColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    count: 0 
  },
  { 
    key: 'preparing', 
    label: 'Preparing', 
    icon: ChefHat, 
    color: 'bg-orange-100 text-orange-800 border-orange-200', 
    cardColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    count: 0 
  },
  { 
    key: 'out_for_delivery', 
    label: 'Out for Delivery', 
    icon: Truck, 
    color: 'bg-purple-100 text-purple-800 border-purple-200', 
    cardColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    count: 0 
  },
  { 
    key: 'delivered', 
    label: 'Delivered', 
    icon: Package, 
    color: 'bg-green-100 text-green-800 border-green-200', 
    cardColor: 'bg-green-50 border-green-200 hover:bg-green-100',
    count: 0 
  },
  { 
    key: 'cancelled', 
    label: 'Cancelled', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 border-red-200', 
    cardColor: 'bg-red-50 border-red-200 hover:bg-red-100',
    count: 0 
  }
]

const deliveryInstructions = [
  { key: 'avoid-ringing-bell', label: 'Avoid Ringing Bell', icon: Bell },
  { key: 'leave-at-door', label: 'Leave At Door', icon: Package },
  { key: 'avoid-calling', label: 'Avoid Calling', icon: Phone },
  { key: 'leave-with-guard', label: 'Leave With Guard', icon: User }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all') // 'all', 'pos', 'online'
  const [loading, setLoading] = useState(true)
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()

  const { isPlaying, stopNotification, manualPlay, hasPendingOrders } = useNewOrderNotification((orders) => {
    setPendingOrders(orders)
    fetchOrders()
  })

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOrderDetailModalOpen || !selectedOrder) return

      const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrder.id)
      
      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault()
        setSelectedOrder(filteredOrders[currentIndex - 1])
      } else if (event.key === 'ArrowRight' && currentIndex < filteredOrders.length - 1) {
        event.preventDefault()
        setSelectedOrder(filteredOrders[currentIndex + 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOrderDetailModalOpen, selectedOrder, filteredOrders])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ordersService.getAll()
      setOrders(data)
      setFilteredOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to fetch orders. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePartners = async () => {
    try {
      const partners = await deliveryPartnersService.getAll()
      setDeliveryPartners(partners.filter((p: DeliveryPartner) => p.is_available && p.is_active))
    } catch (error) {
      console.error('Error fetching delivery partners:', error)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchAvailablePartners()
    
    // Handle URL query parameters
    const filter = searchParams.get('filter')
    if (filter === 'pos') {
      setOrderTypeFilter('pos')
    }
  }, [searchParams])

  useEffect(() => {
    let filtered = orders

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    // Filter by order type (POS vs Online)
    if (orderTypeFilter === 'pos') {
      filtered = filtered.filter(order => order.pos === true)
    } else if (orderTypeFilter === 'online') {
      filtered = filtered.filter(order => order.pos !== true)
    }

    setFilteredOrders(filtered)
  }, [selectedStatus, orderTypeFilter, orders])

  const getStatusCounts = () => {
    const counts = orderStatuses.map(status => ({
      ...status,
      count: orders.filter(order => order.status === status.key).length
    }))
    return counts
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ordersService.update(orderId, { status: newStatus as any })
      await fetchOrders()
      
      // Update selected order if it's the one being changed
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
      
      if (newStatus === 'confirmed') {
        const updatedOrders = await ordersService.getAll()
        const pending = updatedOrders.filter((o: Order) => o.status === 'pending')
        if (pending.length === 0) {
          stopNotification()
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status')
    }
  }

  const handleAssignDeliveryPartner = async (partnerId: string) => {
    if (!selectedOrder) return

    try {
      setAssigning(true)
      await ordersService.assignDeliveryPartner(selectedOrder.id, partnerId)
      await fetchOrders()
      await fetchAvailablePartners()
      setIsAssignModalOpen(false)
      
      // Update selected order
      const updatedOrder = orders.find(o => o.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }
    } catch (error) {
      console.error('Error assigning delivery partner:', error)
      alert('Error assigning delivery partner')
    } finally {
      setAssigning(false)
    }
  }

  const printInvoice = () => {
    if (!selectedOrder) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const invoiceHtml = generateInvoiceHtml(selectedOrder)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.print()
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsOrderDetailModalOpen(true)
  }

  const statusCounts = getStatusCounts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          
          {/* Pending Orders Alert */}
          {hasPendingOrders && pendingOrders.length > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 animate-pulse">
              <div className="bg-yellow-400 rounded-full p-2 animate-bounce">
                <Bell className="h-5 w-5 text-yellow-900" />
              </div>
              <div>
                <span className="font-semibold text-yellow-900">
                  {pendingOrders.length} New Order{pendingOrders.length > 1 ? 's' : ''}!
                </span>
              </div>
              <div className="flex gap-2">
                {isPlaying ? (
                  <Button size="sm" variant="outline" onClick={stopNotification}>
                    <VolumeX className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={manualPlay}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${selectedStatus === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
            onClick={() => setSelectedStatus('all')}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <ShoppingBag className="h-8 w-8 text-gray-600 mb-2" />
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm font-medium text-gray-600">All Orders</div>
            </CardContent>
          </Card>
          
          {statusCounts.map((status) => {
            const Icon = status.icon
            return (
              <Card 
                key={status.key}
                className={`cursor-pointer transition-all ${
                  selectedStatus === status.key 
                    ? 'ring-2 ring-blue-500 ' + status.cardColor
                    : status.cardColor
                }`}
                onClick={() => setSelectedStatus(status.key)}
              >
                <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                  <Icon className="h-8 w-8 mb-2" />
                  <div className="text-2xl font-bold">{status.count}</div>
                  <div className="text-sm font-medium">{status.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order Type Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={orderTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderTypeFilter('all')}
            >
              All Orders
            </Button>
            <Button
              variant={orderTypeFilter === 'pos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderTypeFilter('pos')}
              className="flex items-center gap-1"
            >
              <Calculator className="h-3 w-3" />
              POS Orders
            </Button>
            <Button
              variant={orderTypeFilter === 'online' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderTypeFilter('online')}
              className="flex items-center gap-1"
            >
              <ShoppingBag className="h-3 w-3" />
              Online Orders
            </Button>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No orders found</p>
            <p className="text-sm">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const status = orderStatuses.find(s => s.key === order.status)
              const StatusIcon = status?.icon || Clock
              
              return (
                <Card 
                  key={order.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: status?.key === 'pending' ? '#f59e0b' : status?.key === 'delivered' ? '#10b981' : '#6b7280' }}
                  onClick={() => openOrderDetails(order)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {order.order_number}
                        </span>
                        {order.pos && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                            <Calculator className="h-3 w-3 mr-1" />
                            POS
                          </Badge>
                        )}
                      </div>
                      <Badge className={status?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Customer Name */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.contact_name}</span>
                      </div>
                      
                      {/* Order Total & Payment Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-lg font-bold">{formatCurrency(order.total_amount)}</span>
                        </div>
                        {order.payment_status && (
                          <Badge className={
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {order.payment_status}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {/* Open Location */}
                        {order.delivery_address && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              const address = typeof order.delivery_address === 'string' 
                                ? order.delivery_address 
                                : (order.delivery_address as any).formatted || 'Delivery Address'
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
                            }}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Location
                          </Button>
                        )}
                        
                        {/* Quick Status Change */}
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => {
                            handleStatusChange(order.id, value)
                          }}
                        >
                          <SelectTrigger 
                            className="flex-1 h-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((status) => {
                              const Icon = status.icon
                              return (
                                <SelectItem key={status.key} value={status.key}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-3 w-3" />
                                    {status.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        
                        {/* Assign Partner */}
                        {(order.status === 'confirmed' || order.status === 'preparing') && !order.delivery_partner_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                              setIsAssignModalOpen(true)
                            }}
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                      
                      {/* Delivery Partner */}
                      {order.delivery_partners && (
                        <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded">
                          <Car className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-800 font-medium">{order.delivery_partners.name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={isOrderDetailModalOpen} onOpenChange={setIsOrderDetailModalOpen}>
        <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Navigation Arrows */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrder?.id)
                      if (currentIndex > 0) {
                        setSelectedOrder(filteredOrders[currentIndex - 1])
                      }
                    }}
                    disabled={!selectedOrder || filteredOrders.findIndex(o => o.id === selectedOrder.id) === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentIndex = filteredOrders.findIndex(o => o.id === selectedOrder?.id)
                      if (currentIndex < filteredOrders.length - 1) {
                        setSelectedOrder(filteredOrders[currentIndex + 1])
                      }
                    }}
                    disabled={!selectedOrder || filteredOrders.findIndex(o => o.id === selectedOrder.id) === filteredOrders.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <DialogTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Order #{selectedOrder?.order_number}
                  {selectedOrder && (
                    <span className="text-sm text-muted-foreground">
                      ({filteredOrders.findIndex(o => o.id === selectedOrder.id) + 1} of {filteredOrders.length})
                    </span>
                  )}
                </DialogTitle>
              </div>
              
              {/* Action Buttons in Header */}
              {selectedOrder && (
                <div className="flex items-center gap-3">
                  {/* Status Change */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Select 
                      value={selectedOrder.status} 
                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((status) => {
                          const Icon = status.icon
                          return (
                            <SelectItem key={status.key} value={status.key}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {status.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assign Partner Button */}
                  {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing') && !selectedOrder.delivery_partner_id && (
                    <Button onClick={() => setIsAssignModalOpen(true)} size="sm">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assign Partner
                    </Button>
                  )}

                  {/* Print Button */}
                  <Button variant="outline" onClick={printInvoice} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedOrder && (
              <OrderDetailsView 
                order={selectedOrder}
                onStatusChange={handleStatusChange}
                onAssignPartner={() => setIsAssignModalOpen(true)}
                onPrintInvoice={printInvoice}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Partner Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
            <DialogDescription>
              Select an available delivery partner for this order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {deliveryPartners.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available delivery partners
              </div>
            ) : (
              deliveryPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssignDeliveryPartner(partner.id)}
                >
                  <div>
                    <div className="font-medium">{partner.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {partner.phone} • {partner.vehicle_type}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function OrderDetailsView({ 
  order, 
  onStatusChange,
  onAssignPartner,
  onPrintInvoice
}: { 
  order: Order
  onStatusChange: (orderId: string, status: string) => void
  onAssignPartner: () => void
  onPrintInvoice: () => void
}) {
  const currentStatus = orderStatuses.find(s => s.key === order.status)
  const StatusIcon = currentStatus?.icon || Clock
  const items = (order.items as unknown as OrderItem[]) || []

  // Get delivery instruction icon
  const matchingInstruction = deliveryInstructions.find(
    instruction => order.special_instructions === instruction.key
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Order Items */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Order Items</h3>
          <Button variant="outline" size="sm">Update</Button>
        </div>
        
        {/* Items Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Items</TableHead>
                <TableHead className="text-center w-[100px]">Type</TableHead>
                <TableHead className="text-center">Price</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx} className="h-auto">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        
                        {/* Variations - Simplified */}
                        {item.variations && Object.keys(item.variations).length > 0 && (
                          <div className="text-sm text-gray-600 mt-1">
                            {Object.entries(item.variations).map(([key, value], idx, arr) => (
                              <span key={key}>
                                <span className="capitalize">{key}:</span> <span className="font-medium">{value.name}</span>
                                {value.price_adjustment > 0 && (
                                  <span className="text-green-600"> (+{formatCurrency(value.price_adjustment)})</span>
                                )}
                                {idx < arr.length - 1 && ' • '}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Cake Name */}
                        {item.special_instructions && (
                          <div className="text-sm bg-yellow-50 text-yellow-800 px-2 py-1 rounded mt-1 inline-block">
                            🍰 "{item.special_instructions}"
                          </div>
                        )}
                        
                        {/* Additional badges */}
                        <div className="flex gap-1 mt-1">
                          {item.is_gift_wrapped && (
                            <span className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded">🎁 Gift</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Type Column with Combo Popover */}
                  <TableCell className="text-center py-4">
                    {item.type === 'combo' ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            🎯 Combo
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px]">
                          <div className="space-y-4">
                            <div className="text-center">
                              <h4 className="font-semibold text-lg text-gray-900">🎯 Combo Details</h4>
                              <p className="text-sm text-gray-600">Items included in this combo</p>
                            </div>
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="font-semibold">Item Name</TableHead>
                                    <TableHead className="text-center font-semibold">Quantity</TableHead>
                                    <TableHead className="text-right font-semibold">Individual Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {item.combo_items?.map((comboItem, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>
                                        <div className="font-medium text-gray-900">{comboItem.name}</div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                          ×{comboItem.quantity}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {formatCurrency(comboItem.total_price)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="text-center pt-2 border-t">
                              <span className="text-sm text-gray-600">
                                Total items: <span className="font-semibold">{item.combo_items?.length || 0}</span>
                              </span>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.type === 'product' ? '🍽️ Product' : 
                         item.type === 'addon' ? '➕ Add-on' : 
                         item.type || 'Product'}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-center py-3 font-medium">{formatCurrency(item.base_price)}</TableCell>
                  <TableCell className="text-center py-3 font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-right py-3 font-semibold">{formatCurrency(item.total_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Totals */}
          <div className="border-t p-4 space-y-2">
            {order.subtotal && (
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.delivery_fee && (
              <div className="flex justify-between text-sm">
                <span>Delivery fee:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-green-600">
              <span>Amount paid:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Customer Info */}
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">Customer</h3>
        </div>
        
        {/* Customer Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">{order.contact_name}</div>
                <div className="text-sm text-muted-foreground">{order.contact_phone}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Info</label>
          <div className="space-y-1 text-sm">
            {order.payment_method && (
              <div className="flex justify-between">
                <span>Method:</span>
                <Badge variant="outline" className="capitalize">{order.payment_method}</Badge>
              </div>
            )}
            {order.payment_status && (
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge className={
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {order.payment_status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        {order.delivery_address && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Delivery Address</label>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
              {typeof order.delivery_address === 'string' 
                ? order.delivery_address 
                : (order.delivery_address as any).formatted || 'Delivery Address'}
            </div>
          </div>
        )}

        {/* Delivery Instructions Icon Only */}
        {matchingInstruction && (
          <div className="flex items-center justify-center p-4 bg-amber-50 rounded-lg">
            <div className="flex flex-col items-center">
              <matchingInstruction.icon className="h-8 w-8 text-amber-600 mb-2" />
              <span className="text-sm font-medium text-amber-800">
                {matchingInstruction.label}
              </span>
            </div>
          </div>
        )}

        {/* Delivery Partner */}
        {order.delivery_partners && (
          <div>
            <label className="text-sm font-medium mb-2 block">Assigned Partner</label>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium text-sm">{order.delivery_partners.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.delivery_partners.phone} • {order.delivery_partners.vehicle_type}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount Paid */}
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="text-sm font-medium mb-1">Amount paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(order.total_amount)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemDisplay({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-4 py-3 border-b last:border-b-0">
      {item.image_url && (
        <img 
          src={item.image_url} 
          alt={item.name}
          className="w-16 h-16 object-cover rounded-md"
        />
      )}
      
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{item.name}</span>
          
          {/* Product Type Badge */}
          {item.type && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {item.type === 'combo' && '🎯'}
              {item.type === 'addon' && '➕'}
              {item.type === 'product' && '🍽️'}
              {item.type}
            </Badge>
          )}
          
          {/* Gift Wrap */}
          {item.is_gift_wrapped && (
            <Badge className="bg-pink-100 text-pink-800 border-pink-200">
              🎁 Gift Wrap
            </Badge>
          )}
        </div>

        {/* Variations */}
        {item.variations && Object.keys(item.variations).length > 0 && (
          <div className="bg-gray-50 rounded-md p-2 mt-2">
            <div className="text-xs font-semibold text-gray-700 mb-1">Customizations:</div>
            {Object.entries(item.variations).map(([key, value]) => (
              <div key={key} className="text-xs text-gray-600 ml-2">
                <span className="font-medium capitalize">{key}:</span> {value.name}
                {value.price_adjustment > 0 && (
                  <span className="text-green-600"> (+{formatCurrency(value.price_adjustment)})</span>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground mt-2">
          Quantity: {item.quantity} × {formatCurrency(item.base_price)}
          {item.is_gift_wrapped && (
            <span className="ml-2 text-pink-600 font-medium">
              • 🎁 Gift Wrapped
            </span>
          )}
        </div>
        
        {item.special_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
            <div className="text-sm font-medium text-yellow-900 flex items-center gap-2">
              🍰 Name on Cake:
            </div>
            <div className="text-lg font-semibold text-yellow-800 mt-1 bg-yellow-100 px-2 py-1 rounded">
              "{item.special_instructions}"
            </div>
          </div>
        )}

        {/* Combo Items */}
        {item.combo_items && Array.isArray(item.combo_items) && item.combo_items.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
            <div className="text-sm font-medium text-purple-900 mb-2">
              🎯 Combo Items:
            </div>
            <div className="space-y-1">
              {item.combo_items.map((comboItem, idx) => (
                <div key={idx} className="text-xs text-purple-800 flex justify-between">
                  <span>• {comboItem.name} ({comboItem.quantity}x)</span>
                  <span>{formatCurrency(comboItem.total_price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-right">
        <div className="font-semibold">
          {formatCurrency(item.total_price)}
        </div>
      </div>
    </div>
  )
}

function generateInvoiceHtml(order: Order): string {
  const items = (order.items as unknown as OrderItem[]) || []
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - Order ${order.order_number}</title>
      <style>
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; }
        }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          margin: 0 auto;
          padding: 5mm;
        }
        .header { 
          text-align: center; 
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .header h1 { 
          font-size: 18px; 
          margin: 0;
          font-weight: bold;
        }
        .header h2 { 
          font-size: 14px; 
          margin: 5px 0;
          font-weight: normal;
        }
        .section { 
          margin: 10px 0;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .section:last-child { border-bottom: none; }
        .row { 
          display: flex; 
          justify-content: space-between;
          margin: 3px 0;
        }
        .item-row {
          margin: 5px 0;
        }
        .item-name {
          font-weight: bold;
        }
        .item-details {
          font-size: 11px;
          margin-left: 10px;
        }
        .total-section {
          border-top: 2px solid #000;
          margin-top: 10px;
          padding-top: 10px;
        }
        .total-row {
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
        }
        .address {
          font-size: 11px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SST BAKERY</h1>
        <h2>www.sstbakery.com</h2>
        <div style="font-size: 11px;">Tax Invoice</div>
      </div>
      
      <div class="section">
        <div class="row">
          <span>Order #:</span>
          <span>${order.order_number}</span>
        </div>
        <div class="row">
          <span>Date:</span>
          <span>${order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { 
            dateStyle: 'short', 
            timeStyle: 'short' 
          }) : ''}</span>
        </div>
        <div class="row">
          <span>Status:</span>
          <span>${order.status.toUpperCase()}</span>
        </div>
      </div>

      <div class="section">
        <div style="font-weight: bold; margin-bottom: 5px;">Customer Details:</div>
        <div>${order.contact_name}</div>
        <div>Ph: ${order.contact_phone}</div>
        ${order.delivery_address ? `
          <div class="address">
            ${typeof order.delivery_address === 'string' 
              ? order.delivery_address 
              : (order.delivery_address as any).formatted || 'Delivery Address'}
          </div>
        ` : ''}
      </div>

      <div class="section">
        <div style="font-weight: bold; margin-bottom: 5px;">Order Items:</div>
        ${items.map((item) => {
          return `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              ${item.is_gift_wrapped ? `<div class="item-details">🎁 Gift Wrapped</div>` : ''}
              ${item.variations ? Object.entries(item.variations).map(([key, value]) => 
                `<div class="item-details">${key}: ${value.name}${value.price_adjustment > 0 ? ` (+₹${value.price_adjustment.toFixed(2)})` : ''}</div>`
              ).join('') : ''}
              <div class="row">
                <span class="item-details">${item.quantity} x ₹${item.base_price.toFixed(2)}</span>
                <span>₹${item.total_price.toFixed(2)}</span>
              </div>
              ${item.special_instructions ? `<div class="item-details"><strong>Cake Name: ${item.special_instructions}</strong></div>` : ''}
            </div>
          `
        }).join('')}
      </div>

      <div class="total-section">
        ${order.subtotal ? `
          <div class="row">
            <span>Subtotal:</span>
            <span>₹${order.subtotal.toFixed(2)}</span>
          </div>
        ` : ''}
        ${order.tax_amount ? `
          <div class="row">
            <span>Tax:</span>
            <span>₹${order.tax_amount.toFixed(2)}</span>
          </div>
        ` : ''}
        ${order.delivery_fee ? `
          <div class="row">
            <span>Delivery:</span>
            <span>₹${order.delivery_fee.toFixed(2)}</span>
          </div>
        ` : ''}
        ${order.discount_amount ? `
          <div class="row">
            <span>Discount:</span>
            <span>-₹${order.discount_amount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="row total-row">
          <span>TOTAL:</span>
          <span>₹${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      ${order.payment_method ? `
        <div class="section">
          <div class="row">
            <span>Payment:</span>
            <span>${order.payment_method}</span>
          </div>
        </div>
      ` : ''}

      ${order.delivery_partners ? `
        <div class="section">
          <div style="font-weight: bold; margin-bottom: 5px;">Delivery Partner:</div>
          <div>${order.delivery_partners.name}</div>
          <div>Ph: ${order.delivery_partners.phone}</div>
          <div>${order.delivery_partners.vehicle_type}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div style="margin: 10px 0;">Thank you for your order!</div>
        <div>www.sstbakery.com</div>
        <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;">
          <strong>Customer Copy</strong>
        </div>
      </div>
    </body>
    </html>
  `
}