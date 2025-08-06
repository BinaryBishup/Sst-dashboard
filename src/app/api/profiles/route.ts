import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in profiles GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}