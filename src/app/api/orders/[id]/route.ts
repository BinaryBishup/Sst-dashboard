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

    // Get order details from the new simplified table
    const { data: order, error: orderError } = await supabaseAdmin
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
      .eq('id', params.id)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }

    // Since items are now stored as JSONB in the order itself,
    // we don't need separate queries for order_items
    return NextResponse.json({
      order: order,
      items: order.items || [] // Items are stored directly in the order
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