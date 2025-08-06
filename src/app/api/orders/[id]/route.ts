import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', params.id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 })
    }

    // Get product IDs to fetch product details
    const productIds = orderItems
      ?.map(item => item.product_id)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index) // unique IDs

    // Fetch products if there are product IDs
    let products: any[] = []
    if (productIds && productIds.length > 0) {
      const { data: productData } = await supabaseAdmin
        .from('products')
        .select('id, name, description, image_url, images')
        .in('id', productIds)
      
      products = productData || []
    }

    // Map products to order items
    const enrichedOrderItems = orderItems?.map(item => ({
      ...item,
      product: products.find(p => p.id === item.product_id) || null
    })) || []

    // Fetch related profile if user_id exists
    let profile = null
    if (order.user_id) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url')
        .eq('id', order.user_id)
        .single()
      
      profile = profileData
    }

    // Fetch delivery partner if assigned_partner_id exists
    let deliveryPartner = null
    if (order.assigned_partner_id) {
      const { data: partnerData } = await supabaseAdmin
        .from('delivery_partners')
        .select('id, name, phone, vehicle_type, is_available')
        .eq('id', order.assigned_partner_id)
        .single()
      
      deliveryPartner = partnerData
    }

    // Combine order with related data
    const orderWithRelations = {
      ...order,
      profiles: profile,
      delivery_partners: deliveryPartner
    }

    return NextResponse.json({
      order: orderWithRelations,
      items: enrichedOrderItems
    })
  } catch (error) {
    console.error('Error in order GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const updates = await request.json()
    console.log('Updating order:', params.id, updates)

    // Add updated timestamp
    const orderWithUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(orderWithUpdates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json({ 
        error: 'Failed to update order', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in order PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}