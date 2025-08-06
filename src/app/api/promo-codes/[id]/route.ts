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

    const promoCode = await request.json()
    console.log('Updating promo code:', promoCode)

    // Convert date strings to ISO format and add updated timestamp
    const promoCodeWithUpdates = {
      ...promoCode,
      valid_from: promoCode.valid_from ? new Date(promoCode.valid_from + 'T00:00:00Z').toISOString() : promoCode.valid_from,
      valid_until: promoCode.valid_until ? new Date(promoCode.valid_until + 'T23:59:59Z').toISOString() : promoCode.valid_until,
      updated_at: new Date().toISOString()
    }

    console.log('Processed promo code data:', promoCodeWithUpdates)

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .update(promoCodeWithUpdates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating promo code:', error)
      console.error('Data being updated:', promoCodeWithUpdates)
      return NextResponse.json({ 
        error: 'Failed to update promo code', 
        details: error.message,
        data: promoCodeWithUpdates 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in promo code PUT:', error)
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
      .from('promo_codes')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting promo code:', error)
      return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in promo code DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}