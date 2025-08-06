import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Helper function to get or create a guest user
async function getOrCreateGuestUser(): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const GUEST_EMAIL = 'guest@fooddelivery.com'
  
  // Try to find existing guest user
  const { data: existingGuest } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', GUEST_EMAIL)
    .single()

  if (existingGuest) {
    return existingGuest.id
  }

  // Create guest user if doesn't exist
  const { data: newGuest, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      email: GUEST_EMAIL,
      full_name: 'Guest User',
      phone: null
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating guest user:', error)
    throw error
  }

  return newGuest.id
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // First, let's just get the orders
    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found')
      return NextResponse.json([])
    }

    // Get unique user IDs and partner IDs
    const userIds = Array.from(new Set(orders.map(order => order.user_id).filter(Boolean)))
    const partnerIds = Array.from(new Set(orders.map(order => order.assigned_partner_id).filter(Boolean)))

    // Fetch profiles if there are user IDs
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url')
        .in('id', userIds)
      
      profiles = profileData || []
    }

    // Fetch delivery partners if there are partner IDs
    let partners: any[] = []
    if (partnerIds.length > 0) {
      const { data: partnerData } = await supabaseAdmin
        .from('delivery_partners')
        .select('id, name, phone, vehicle_type, is_available')
        .in('id', partnerIds)
      
      partners = partnerData || []
    }

    // Map the data together
    const ordersWithRelations = orders.map(order => ({
      ...order,
      profiles: profiles.find(p => p.id === order.user_id) || null,
      delivery_partners: partners.find(p => p.id === order.assigned_partner_id) || null
    }))

    console.log('Orders fetched with relations:', ordersWithRelations.length)
    return NextResponse.json(ordersWithRelations)
  } catch (error) {
    console.error('Error in orders GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const orderData = await request.json()
    
    // Handle guest orders by assigning a default guest user_id if none provided
    if (!orderData.user_id) {
      // Create or get a guest user ID
      const guestUserId = await getOrCreateGuestUser()
      orderData.user_id = guestUserId
    }

    // Validate required fields
    if (!orderData.total || orderData.total <= 0) {
      return NextResponse.json(
        { error: 'total amount is required and must be greater than 0' }, 
        { status: 400 }
      )
    }

    // Generate order number if not provided
    if (!orderData.order_number) {
      orderData.order_number = `SST${Date.now()}`
    }

    // Set default status if not provided
    if (!orderData.status) {
      orderData.status = 'pending'
    }

    // Log the order data for debugging
    console.log('Creating order with data:', JSON.stringify(orderData, null, 2))

    // Insert the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      console.error('Order data that caused error:', JSON.stringify(orderData, null, 2))
      
      // If user_id constraint error, suggest using guest user approach
      if (orderError.code === '23502' && orderError.message.includes('user_id')) {
        return NextResponse.json({
          error: 'user_id is required. For guest orders, either provide a user_id or modify the database to allow null values.',
          details: orderError.message
        }, { status: 400 })
      }
      
      throw orderError
    }

    // If order items are provided, insert them
    if (orderData.items && Array.isArray(orderData.items)) {
      const orderItems = orderData.items.map((item: any) => ({
        ...item,
        order_id: order.id
      }))

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Rollback: delete the created order
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        throw itemsError
      }
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}