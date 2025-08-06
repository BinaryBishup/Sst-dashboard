import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const addon = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('cart_addons')
      .update(addon)
      .eq('id', parseInt(params.id))
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('Error updating addon:', error)
    return NextResponse.json({ error: 'Failed to update addon' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { error } = await supabaseAdmin
      .from('cart_addons')
      .delete()
      .eq('id', parseInt(params.id))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting addon:', error)
    return NextResponse.json({ error: 'Failed to delete addon' }, { status: 500 })
  }
}