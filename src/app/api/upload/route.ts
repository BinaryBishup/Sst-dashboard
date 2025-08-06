import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = (formData.get('bucket') as string) || 'images'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `public/${fileName}`

    console.log('Uploading to bucket:', bucket, 'path:', filePath)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Storage upload failed', details: error }, { status: 500 })
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('Generated public URL:', publicUrl)

    return NextResponse.json({ 
      url: publicUrl,
      path: filePath,
      bucket: bucket,
      success: true 
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ 
      error: 'Failed to upload image', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}