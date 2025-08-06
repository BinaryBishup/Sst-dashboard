import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query for the new simplified orders table
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          phone,
          email,
          avatar_url
        ),
        delivery_partners:delivery_partner_id (
          id,
          name,
          phone,
          vehicle_type,
          is_available
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 })
    }

    console.log('Orders fetched:', orders?.length || 0)
    return NextResponse.json(orders || [])
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
    
    // Validate required fields for new schema
    if (!orderData.order_number) {
      orderData.order_number = `SST${Date.now()}`
    }

    if (!orderData.contact_name) {
      return NextResponse.json(
        { error: 'contact_name is required' }, 
        { status: 400 }
      )
    }

    if (!orderData.contact_phone) {
      return NextResponse.json(
        { error: 'contact_phone is required' }, 
        { status: 400 }
      )
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'items array is required and must not be empty' }, 
        { status: 400 }
      )
    }

    if (!orderData.total_amount || orderData.total_amount <= 0) {
      return NextResponse.json(
        { error: 'total_amount is required and must be greater than 0' }, 
        { status: 400 }
      )
    }

    // Set default status if not provided
    if (!orderData.status) {
      orderData.status = 'pending'
    }

    // Log the order data for debugging
    console.log('Creating order with simplified schema:', JSON.stringify(orderData, null, 2))

    // Insert the order into the new simplified table
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          phone,
          email,
          avatar_url
        ),
        delivery_partners:delivery_partner_id (
          id,
          name,
          phone,
          vehicle_type,
          is_available
        )
      `)
      .single()
    
    if (orderError) {
      console.error('Error creating order:', orderError)
      console.error('Order data that caused error:', JSON.stringify(orderData, null, 2))
      return NextResponse.json({
        error: 'Failed to create order',
        details: orderError.message
      }, { status: 500 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}