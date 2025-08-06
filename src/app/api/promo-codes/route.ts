import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching promo codes:', error)
      return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in promo codes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const promoCode = await request.json()
    console.log('Creating promo code:', promoCode)

    // Convert date strings to ISO format and add timestamps
    const promoCodeWithTimestamp = {
      ...promoCode,
      valid_from: promoCode.valid_from ? new Date(promoCode.valid_from + 'T00:00:00Z').toISOString() : promoCode.valid_from,
      valid_until: promoCode.valid_until ? new Date(promoCode.valid_until + 'T23:59:59Z').toISOString() : promoCode.valid_until,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert([promoCodeWithTimestamp])
      .select()
      .single()

    if (error) {
      console.error('Error creating promo code:', error)
      console.error('Promo code data:', promoCodeWithTimestamp)
      return NextResponse.json({ 
        error: 'Failed to create promo code', 
        details: error.message,
        data: promoCodeWithTimestamp 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in promo codes POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}