"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  Banknote,
  Printer,
  Calculator,
  User,
  Phone,
  MapPin,
  Percent,
  X,
  Check,
  ScanLine,
  History
} from "lucide-react"
import Link from "next/link"
import { useProducts, useCategories } from "@/lib/hooks/useSupabaseData"
import { formatCurrency } from "@/lib/supabase-utils"
import { Database } from "@/lib/database.types"
import { supabase } from "@/lib/supabase"

type Product = Database['public']['Tables']['products']['Row']
type CartItem = {
  product: Product
  quantity: number
  selectedAttributes?: {type: string, name: string, extraCost: number}[]
  notes?: string
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Phone },
]

const TAX_RATE = 0.18 // 18% GST

export default function POSPage() {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [discountPercent, setDiscountPercent] = useState(0)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: ""
  })
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [amountReceived, setAmountReceived] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isBarcodeMode, setIsBarcodeMode] = useState(false)
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)

  // Filter products for POS (only active products)
  const activeProducts = products.filter(product => 
    product.is_active && 
    (selectedCategory === "all" || product.category_id === selectedCategory) &&
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => {
    const basePrice = item.product.price * item.quantity
    const attributesPrice = (item.selectedAttributes || []).reduce((attrSum, attr) => 
      attrSum + (attr.extraCost * item.quantity), 0)
    return sum + basePrice + attributesPrice
  }, 0)

  const discountAmount = (subtotal * discountPercent) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * TAX_RATE
  const totalAmount = taxableAmount + taxAmount

  // Add to cart
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      updateCartItemQuantity(product.id, existingItem.quantity + quantity)
    } else {
      setCart([...cart, { product, quantity }])
    }
  }

  // Handle barcode scan
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) return

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode.trim())
        .eq('is_active', true)
        .single()

      if (error || !product) {
        alert(`Product with barcode ${barcode} not found`)
        setBarcodeInput("")
        return
      }

      // Handle multiple scans for quantity
      if (lastScannedBarcode === barcode && scanCount > 0) {
        const newScanCount = scanCount + 1
        setScanCount(newScanCount)
        addToCart(product as Product, 1)
        
        // Clear scan count after 2 seconds
        setTimeout(() => {
          setLastScannedBarcode(null)
          setScanCount(0)
        }, 2000)
      } else {
        setLastScannedBarcode(barcode)
        setScanCount(1)
        addToCart(product as Product, 1)
        
        // Clear scan count after 2 seconds
        setTimeout(() => {
          setLastScannedBarcode(null)
          setScanCount(0)
        }, 2000)
      }

      setBarcodeInput("")
    } catch (error) {
      console.error('Error scanning barcode:', error)
      alert('Error scanning barcode')
      setBarcodeInput("")
    }
  }

  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setDiscountPercent(0)
    setCustomerInfo({ name: "", phone: "", address: "" })
  }

  // Process payment
  const processPayment = async () => {
    try {
      // Generate order number
      const orderNumber = `POS${Date.now()}`

      // Transform cart items to match orders table structure
      const orderItems = cart.map(item => ({
        id: item.product.id,
        type: item.product.product_type || 'product',
        name: item.product.name,
        image_url: item.product.image_url,
        quantity: item.quantity,
        base_price: item.product.price,
        total_price: item.product.price * item.quantity,
        variations: item.selectedAttributes ? 
          item.selectedAttributes.reduce((acc, attr) => ({
            ...acc,
            [attr.type]: {
              name: attr.name,
              price_adjustment: attr.extraCost
            }
          }), {}) : undefined,
        special_instructions: item.notes
      }))

      // Create order in orders table
      const orderData = {
        order_number: orderNumber,
        contact_name: customerInfo.name || 'POS Customer',
        contact_phone: customerInfo.phone || '',
        items: orderItems,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'delivered' as const, // POS orders are immediately completed
        payment_method: paymentMethod,
        payment_status: 'completed',
        pos: true, // Mark as POS order
        delivery_partner_id: null,
        delivery_notes: null,
        delivery_address: null,
        special_instructions: null,
        estimated_delivery_time: null
      }

      const { error } = await supabase
        .from('orders')
        .insert([orderData])

      if (error) {
        console.error('Database error:', error)
        throw new Error('Failed to save order to database')
      }

      // Print receipt
      printReceipt({ ...orderData, orderNumber })
      
      // Clear cart
      clearCart()
      setIsPaymentDialogOpen(false)
      setAmountReceived("")
      
      alert(`Payment processed successfully! Order #${orderNumber}`)
    } catch (error) {
      console.error('Payment processing failed:', error)
      alert('Payment failed. Please try again.')
    }
  }

  // Print receipt (thermal printer)
  const printReceipt = (orderData: any) => {
    // In a real implementation, this would send commands to a thermal printer
    const receiptContent = `
===============================
        SST BAKERY
===============================
Order #: ${orderData.orderNumber || orderData.order_number}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
-------------------------------
${cart.map(item => `
${item.product.name}
Qty: ${item.quantity} x ₹${item.product.price}
                    ₹${item.product.price * item.quantity}
`).join('')}
-------------------------------
Subtotal:           ₹${subtotal.toFixed(2)}
Discount (${discountPercent}%):     -₹${discountAmount.toFixed(2)}
Tax (18%):          ₹${taxAmount.toFixed(2)}
-------------------------------
TOTAL:              ₹${totalAmount.toFixed(2)}
-------------------------------
Payment: ${paymentMethod.toUpperCase()}
${paymentMethod === 'cash' ? `Received: ₹${amountReceived}\nChange: ₹${(parseFloat(amountReceived) - totalAmount).toFixed(2)}` : ''}
-------------------------------
Customer: ${customerInfo.name}
Phone: ${customerInfo.phone}
-------------------------------
Thank you for your visit!
Visit us again!
===============================
    `
    
    // For demo purposes, open in new window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; width: 300px; margin: 0; padding: 10px; }
              pre { white-space: pre-wrap; font-size: 12px; }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
            <script>window.print(); window.onafterprint = function(){ window.close(); }</script>
          </body>
        </html>
      `)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            clearCart()
            break
          case 'p':
            e.preventDefault()
            if (cart.length > 0) setIsPaymentDialogOpen(true)
            break
          case 'f':
            e.preventDefault()
            document.getElementById('search-input')?.focus()
            break
          case '1':
            e.preventDefault()
            setPaymentMethod('cash')
            break
          case '2':
            e.preventDefault()
            setPaymentMethod('card')
            break
          case '3':
            e.preventDefault()
            setPaymentMethod('upi')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart])

  const changeAmount = amountReceived ? parseFloat(amountReceived) - totalAmount : 0

  return (
    <DashboardLayout>
      <div className="h-full flex gap-4 p-4 max-h-screen overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
              <Link href="/orders?filter=pos">
                <Button variant="outline" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Order History
                </Button>
              </Link>
            </div>
            
            {/* Category Filter */}
            <div className="flex gap-4 mb-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barcode Scanner */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Scan barcode or type to search..."
                  value={isBarcodeMode ? barcodeInput : searchQuery}
                  onChange={(e) => {
                    if (isBarcodeMode) {
                      setBarcodeInput(e.target.value)
                    } else {
                      setSearchQuery(e.target.value)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isBarcodeMode && barcodeInput) {
                      handleBarcodeInput(barcodeInput)
                    }
                  }}
                  className="pl-10"
                />
                {lastScannedBarcode && scanCount > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Scan #{scanCount}
                  </div>
                )}
              </div>
              <Button
                variant={isBarcodeMode ? "default" : "outline"}
                onClick={() => setIsBarcodeMode(!isBarcodeMode)}
                className="flex items-center gap-2"
              >
                <ScanLine className="h-4 w-4" />
                {isBarcodeMode ? 'Barcode' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl">
                          {product.product_type === 'combo' ? '🎁' : 
                           product.product_type === 'addon' ? '⚡' : '🍰'}
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(product.price)}</p>
                    {product.is_featured && (
                      <Badge variant="secondary" className="mt-1 text-xs">Featured</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Cart is empty</p>
                    <p className="text-sm">Add items to get started</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Info */}
              {cart.length > 0 && (
                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Customer Details</span>
                  </div>
                  <Input
                    placeholder="Customer name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="h-8"
                  />
                  <Input
                    placeholder="Phone number"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="h-8"
                  />
                </div>
              )}

              {/* Discount */}
              {cart.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="Discount %"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="h-8"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Tax (18%):</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={() => setIsPaymentDialogOpen(true)}
                disabled={cart.length === 0}
                className="w-full mt-4 h-12 text-lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay {cart.length > 0 && formatCurrency(totalAmount)} (Ctrl+P)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon
                  return (
                    <Button
                      key={method.value}
                      variant={paymentMethod === method.value ? "default" : "outline"}
                      onClick={() => setPaymentMethod(method.value)}
                      className="flex flex-col gap-1 h-16"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{method.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold mb-2">
                <span>Total Amount:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Received</label>
                  <Input
                    type="number"
                    placeholder="Enter amount received"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="text-lg"
                    min={totalAmount}
                    step="0.01"
                  />
                  {amountReceived && parseFloat(amountReceived) >= totalAmount && (
                    <div className="text-green-600 font-medium">
                      Change: {formatCurrency(changeAmount)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={processPayment}
                disabled={paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < totalAmount)}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 bg-white p-2 rounded shadow-md">
        <div>Shortcuts: Ctrl+N (New), Ctrl+P (Pay), Ctrl+F (Search)</div>
        <div>Ctrl+1 (Cash), Ctrl+2 (Card), Ctrl+3 (UPI)</div>
      </div>
    </DashboardLayout>
  )
}