"use client"

import { useState, useEffect } from "react"
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
  Volume2,
  VolumeX
} from "lucide-react"
import { ordersService, deliveryPartnersService, formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"
import { useNewOrderNotification } from "@/hooks/useNewOrderNotification"

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

type OrderItem = Database['public']['Tables']['order_items']['Row']
type DeliveryPartner = Database['public']['Tables']['delivery_partners']['Row']

const orderStatuses = [
  { key: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800', cardColor: 'bg-yellow-50 border-yellow-200' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-800', cardColor: 'bg-blue-50 border-blue-200' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'bg-orange-100 text-orange-800', cardColor: 'bg-orange-50 border-orange-200' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-purple-100 text-purple-800', cardColor: 'bg-purple-50 border-purple-200' },
  { key: 'delivered', label: 'Delivered', icon: Package, color: 'bg-green-100 text-green-800', cardColor: 'bg-green-50 border-green-200' },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800', cardColor: 'bg-red-50 border-red-200' }
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  
  // Use the new order notification hook
  const { isPlaying, stopNotification, manualPlay, hasPendingOrders } = useNewOrderNotification((orders) => {
    setPendingOrders(orders)
    // Refresh orders list when pending orders change
    if (selectedStatus === 'all' || selectedStatus === 'pending') {
      fetchOrders(selectedStatus)
    }
  })

  const fetchOrders = async (status?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ordersService.getAll(status === 'all' ? undefined : status)
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to fetch orders. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setOrderLoading(true)
      const { order, items } = await ordersService.getById(orderId)
      setSelectedOrder(order)
      setOrderItems(items)
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setOrderLoading(false)
    }
  }

  const fetchAvailablePartners = async () => {
    try {
      const partners = await deliveryPartnersService.getAll()
      // Only show partners that are available AND active
      setDeliveryPartners(partners.filter((p: DeliveryPartner) => p.is_available && p.is_active))
    } catch (error) {
      console.error('Error fetching delivery partners:', error)
    }
  }

  useEffect(() => {
    fetchOrders(selectedStatus)
  }, [selectedStatus])

  useEffect(() => {
    fetchAvailablePartners()
  }, [])

  const getStatusCounts = () => {
    const counts = orderStatuses.reduce((acc, status) => {
      acc[status.key] = orders.filter(order => order.status === status.key).length
      return acc
    }, {} as Record<string, number>)
    counts.all = orders.length
    return counts
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await ordersService.update(orderId, { status: newStatus as any })
      await fetchOrders(selectedStatus)
      if (selectedOrder?.id === orderId) {
        await fetchOrderDetails(orderId)
      }
      
      // Check if we still have pending orders after this update
      if (newStatus === 'confirmed') {
        // Fetch updated pending orders to check if notification should stop
        const updatedOrders = await ordersService.getAll('pending')
        if (!updatedOrders || updatedOrders.length === 0) {
          stopNotification()
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error updating order status')
    }
  }
  
  const confirmAllPendingOrders = async () => {
    // Confirm all pending orders
    for (const order of pendingOrders) {
      await handleStatusChange(order.id, 'confirmed')
    }
  }

  const handleAssignDeliveryPartner = async (partnerId: string) => {
    if (!selectedOrder) return

    try {
      setAssigning(true)
      await ordersService.assignDeliveryPartner(selectedOrder.id, partnerId)
      await fetchOrders(selectedStatus)
      await fetchOrderDetails(selectedOrder.id)
      await fetchAvailablePartners()
      setIsAssignModalOpen(false)
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

    const invoiceHtml = generateInvoiceHtml(selectedOrder, orderItems)
    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.print()
  }

  const statusCounts = getStatusCounts()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-muted-foreground">
            Track and manage all orders in real-time
          </p>
        </div>

        {/* Pending Orders Alert Banner */}
        {hasPendingOrders && pendingOrders.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 rounded-full p-2 animate-bounce">
                  <Clock className="h-6 w-6 text-yellow-900" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    {pendingOrders.length} Pending Order{pendingOrders.length > 1 ? 's' : ''}!
                  </h3>
                  <p className="text-yellow-800">
                    {pendingOrders.map((order, idx) => (
                      <span key={order.id}>
                        #{order.order_number || order.id.slice(-8)}
                        {idx < pendingOrders.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isPlaying ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopNotification}
                    className="border-yellow-600 text-yellow-900 hover:bg-yellow-100"
                  >
                    <VolumeX className="h-4 w-4 mr-1" />
                    Mute Sound
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={manualPlay}
                    className="border-yellow-600 text-yellow-900 hover:bg-yellow-100"
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    Play Sound
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedStatus('pending')}
                >
                  View Pending Orders
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={confirmAllPendingOrders}
                >
                  Confirm All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-7">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${selectedStatus === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.all}</div>
            </CardContent>
          </Card>

          {orderStatuses.map((status) => {
            const Icon = status.icon
            return (
              <Card 
                key={status.key}
                className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                  selectedStatus === status.key ? 'ring-2 ring-primary' : ''
                } ${status.cardColor}`}
                onClick={() => setSelectedStatus(status.key)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${status.color.split(' ')[1]}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statusCounts[status.key]}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-5">
          {/* Orders List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders List</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No orders found
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {orders.map((order) => {
                      const status = orderStatuses.find(s => s.key === order.status)
                      const StatusIcon = status?.icon || Clock
                      
                      return (
                        <div
                          key={order.id}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium text-sm">
                                  {order.order_number || order.id.slice(-8)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {order.profiles?.full_name || 'Unknown User'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="font-semibold">
                                  {formatCurrency(order.total)}
                                </span>
                                <Badge className={status?.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status?.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            {order.created_at && new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Details</CardTitle>
                  {selectedOrder && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={printInvoice}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                      </Button>
                      {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'preparing') && !selectedOrder.assigned_partner_id && (
                        <Button
                          size="sm"
                          onClick={() => setIsAssignModalOpen(true)}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign Partner
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {orderLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !selectedOrder ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Select an order to view details
                  </div>
                ) : (
                  <OrderDetailsView 
                    order={selectedOrder} 
                    items={orderItems}
                    onStatusChange={handleStatusChange}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
  items, 
  onStatusChange 
}: { 
  order: Order
  items: OrderItem[]
  onStatusChange: (orderId: string, status: string) => void
}) {
  const currentStatus = orderStatuses.find(s => s.key === order.status)
  const StatusIcon = currentStatus?.icon || Clock

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-xl font-semibold">
              Order {order.order_number || order.id.slice(-8)}
            </h3>
          </div>
          <Badge className={currentStatus?.color}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {currentStatus?.label}
          </Badge>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">
            {formatCurrency(order.total)}
          </div>
          <div className="text-sm text-muted-foreground">
            {order.created_at && new Date(order.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{order.profiles?.full_name || 'Unknown User'}</span>
            </div>
            {order.profiles?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.profiles.phone}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-sm">
                    {typeof order.delivery_address === 'string' 
                      ? order.delivery_address 
                      : (order.delivery_address as any).formatted || JSON.stringify(order.delivery_address)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const address = typeof order.delivery_address === 'string' 
                      ? order.delivery_address 
                      : (order.delivery_address as any).formatted || JSON.stringify(order.delivery_address)
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={order.status} 
              onValueChange={(value) => onStatusChange(order.id, value)}
            >
              <SelectTrigger>
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
          </CardContent>
        </Card>
      </div>

      {/* Delivery Partner Info */}
      {order.delivery_partners && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assigned Delivery Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{order.delivery_partners.name}</div>
                <div className="text-sm text-muted-foreground">
                  {order.delivery_partners.phone} • {order.delivery_partners.vehicle_type}
                </div>
              </div>
              <Badge className={order.delivery_partners.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {order.delivery_partners.is_available ? 'Available' : 'Busy'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item: any) => {
              let product = null
              let customChargeData = null
              let addonsData = null
              
              try {
                // Handle product_snapshot - it might be a string or already an object
                if (typeof item.product_snapshot === 'string') {
                  product = JSON.parse(item.product_snapshot)
                } else if (item.product_snapshot) {
                  product = item.product_snapshot
                }
                
                // Handle custom_charge_data similarly
                if (typeof item.custom_charge_data === 'string') {
                  customChargeData = JSON.parse(item.custom_charge_data)
                } else if (item.custom_charge_data) {
                  customChargeData = item.custom_charge_data
                }
                
                // Handle addons JSONB column
                if (typeof item.addons === 'string') {
                  addonsData = JSON.parse(item.addons)
                } else if (item.addons) {
                  addonsData = item.addons
                }
              } catch (e) {
                console.error('Error parsing item data:', e, item)
              }
              
              
              // Use product from API if available, otherwise fallback to snapshot
              const actualProduct = item.product || product
              
              // Extract product details from various possible structures
              const productName = actualProduct?.name || 
                               actualProduct?.product_name || 
                               product?.name ||
                               product?.product_name || 
                               customChargeData?.product?.name ||
                               customChargeData?.productName ||
                               'Unknown Product'
              
              const productImage = actualProduct?.image_url || 
                                 actualProduct?.images?.[0] || 
                                 product?.image_url ||
                                 product?.images?.[0] || 
                                 customChargeData?.product?.image_url
              
              return (
                <div key={item.id} className="flex gap-4 py-3 border-b last:border-b-0">
                  {/* Product Image */}
                  {productImage && (
                    <img 
                      src={productImage} 
                      alt={productName}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{productName}</span>
                      {/* Gift Wrap Badge */}
                      {item.gift_wrap === true && (
                        <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                          🎁 Gift Wrap
                        </Badge>
                      )}
                    </div>
                    
                    {/* Show product type */}
                    {product?.type && (
                      <div className="text-xs text-muted-foreground">
                        Type: {product.type}
                      </div>
                    )}
                    
                    {/* Show message if it's a product with message */}
                    {product?.message && customChargeData?.message && (
                      <div className="text-sm text-blue-600 mt-1">
                        Message: "{customChargeData.message}"
                      </div>
                    )}
                    
                    {/* Show addons from new column */}
                    {addonsData && Array.isArray(addonsData) && addonsData.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Add-ons:</span>
                        <div className="ml-4 text-xs space-y-1">
                          {addonsData.map((addon: any, idx: number) => (
                            <div key={idx}>
                              • {addon.name} {addon.quantity > 1 ? `(${addon.quantity}x)` : ''} - {formatCurrency(addon.price * (addon.quantity || 1))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show addons from custom charge data if new column is empty */}
                    {!addonsData && customChargeData?.addons && customChargeData.addons.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Add-ons: {customChargeData.addons.map((addon: any) => addon.name).join(', ')}
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground mt-1">
                      Quantity: {item.quantity} × {formatCurrency(item.price)}
                      {item.gift_wrap && (
                        <span className="ml-2 text-pink-600 font-medium">
                          • 🎁 Gift Wrapped
                        </span>
                      )}
                    </div>
                    
                    {item.special_instructions && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Note: {item.special_instructions}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Order Summary */}
          <div className="border-t pt-3 mt-3 space-y-2">
            {order.subtotal && (
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.tax && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.delivery_fee && (
              <div className="flex justify-between text-sm">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.reward_discount && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Reward Discount:</span>
                <span>-{formatCurrency(order.reward_discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function generateInvoiceHtml(order: Order, items: OrderItem[]): string {
  // Thermal printer friendly format (typically 80mm width)
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - Order ${order.order_number || order.id.slice(-8)}</title>
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
          <span>${order.order_number || order.id.slice(-8)}</span>
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
        <div>${order.profiles?.full_name || 'Walk-in Customer'}</div>
        ${order.profiles?.phone ? `<div>Ph: ${order.profiles.phone}</div>` : ''}
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
        ${items.map((item: any) => {
          let product = null
          let customData = null
          let addonsData = null
          try {
            if (typeof item.product_snapshot === 'string') {
              product = JSON.parse(item.product_snapshot)
            } else if (item.product_snapshot) {
              product = item.product_snapshot
            }
            if (typeof item.custom_charge_data === 'string') {
              customData = JSON.parse(item.custom_charge_data)
            } else if (item.custom_charge_data) {
              customData = item.custom_charge_data
            }
            if (typeof item.addons === 'string') {
              addonsData = JSON.parse(item.addons)
            } else if (item.addons) {
              addonsData = item.addons
            }
          } catch (e) {
            console.error('Error parsing invoice item:', e)
          }
          
          const actualProduct = item.product || product
          const productName = actualProduct?.name || product?.name || product?.product_name || customData?.product?.name || 'Item'
          
          return `
            <div class="item-row">
              <div class="item-name">${productName}</div>
              ${item.gift_wrap ? `<div class="item-details">🎁 Gift Wrapped</div>` : ''}
              ${customData?.message ? `<div class="item-details">Message: "${customData.message}"</div>` : ''}
              ${addonsData && Array.isArray(addonsData) && addonsData.length > 0 ? 
                `<div class="item-details">Add-ons: ${addonsData.map((a: any) => 
                  `${a.name}${a.quantity > 1 ? ` (${a.quantity}x)` : ''}`
                ).join(', ')}</div>` : 
                (customData?.addons && customData.addons.length > 0 ? 
                  `<div class="item-details">Add-ons: ${customData.addons.map((a: any) => a.name).join(', ')}</div>` : '')}
              <div class="row">
                <span class="item-details">${item.quantity} x ₹${item.price.toFixed(2)}</span>
                <span>₹${(item.quantity * item.price).toFixed(2)}</span>
              </div>
              ${item.special_instructions ? `<div class="item-details">Note: ${item.special_instructions}</div>` : ''}
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
        ${order.tax ? `
          <div class="row">
            <span>Tax:</span>
            <span>₹${order.tax.toFixed(2)}</span>
          </div>
        ` : ''}
        ${order.delivery_fee ? `
          <div class="row">
            <span>Delivery:</span>
            <span>₹${order.delivery_fee.toFixed(2)}</span>
          </div>
        ` : ''}
        ${order.reward_discount ? `
          <div class="row">
            <span>Discount:</span>
            <span>-₹${order.reward_discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="row total-row">
          <span>TOTAL:</span>
          <span>₹${order.total.toFixed(2)}</span>
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