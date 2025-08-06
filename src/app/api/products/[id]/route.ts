import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const product = await request.json()
    
    // Convert images array to PostgreSQL array format if needed
    if (product.images && Array.isArray(product.images)) {
      // Keep as array - Supabase should handle this automatically
    } else if (typeof product.images === 'string') {
      // If it's a JSON string, parse it to array
      try {
        product.images = JSON.parse(product.images)
      } catch (e) {
        product.images = null
      }
    }
    
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(product)
      .eq('id', params.id)
      .select()
    
    if (error) throw error

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}