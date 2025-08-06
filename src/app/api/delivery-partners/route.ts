import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_partners')
      .select('*')
      .order('name', { ascending: true, nullsFirst: false })

    if (error) {
      console.error('Error fetching delivery partners:', error)
      return NextResponse.json({ error: 'Failed to fetch delivery partners' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in delivery partners GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const deliveryPartner = await request.json()

    const { data, error } = await supabaseAdmin
      .from('delivery_partners')
      .insert([deliveryPartner])
      .select()
      .single()

    if (error) {
      console.error('Error creating delivery partner:', error)
      return NextResponse.json({ error: 'Failed to create delivery partner' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in delivery partners POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}