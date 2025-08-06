import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const addon = await request.json()
    
    const { data, error } = await supabaseAdmin
      .from('cart_addons')
      .insert(addon)
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0] || data)
  } catch (error) {
    console.error('Error creating addon:', error)
    return NextResponse.json({ error: 'Failed to create addon' }, { status: 500 })
  }
}