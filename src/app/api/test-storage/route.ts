import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    // List buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({ error: 'Failed to list buckets', details: bucketsError }, { status: 500 })
    }

    // List files in images bucket
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('images')
      .list('public', {
        limit: 10,
        offset: 0
      })

    if (filesError) {
      console.error('Error listing files:', filesError)
      return NextResponse.json({ error: 'Failed to list files', details: filesError }, { status: 500 })
    }

    // Test public URL generation
    const testUrl = supabaseAdmin.storage
      .from('images')
      .getPublicUrl('public/test.jpg')

    return NextResponse.json({
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      files: files?.slice(0, 5),
      testUrl: testUrl.data.publicUrl,
      message: 'Storage test completed'
    })
  } catch (error) {
    console.error('Error testing storage:', error)
    return NextResponse.json({ error: 'Storage test failed', details: error }, { status: 500 })
  }
}