import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const deliveryPartner = await request.json()

    const { data, error } = await supabaseAdmin
      .from('delivery_partners')
      .update(deliveryPartner)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating delivery partner:', error)
      return NextResponse.json({ error: 'Failed to update delivery partner' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in delivery partner PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { error } = await supabaseAdmin
      .from('delivery_partners')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting delivery partner:', error)
      return NextResponse.json({ error: 'Failed to delete delivery partner' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delivery partner DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}