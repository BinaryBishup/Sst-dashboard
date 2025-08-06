import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const category = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(category)
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}