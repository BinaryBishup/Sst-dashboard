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

    const profile = await request.json()
    console.log('Updating profile:', profile)

    // Add updated timestamp
    const profileWithUpdates = {
      ...profile,
      updated_at: new Date().toISOString()
    }

    console.log('Processed profile data:', profileWithUpdates)

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(profileWithUpdates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      console.error('Data being updated:', profileWithUpdates)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: error.message,
        data: profileWithUpdates 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in profile PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}