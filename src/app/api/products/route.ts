import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories!products_category_id_fkey (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      .insert(product)
      .select()
    
    if (error) throw error

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}