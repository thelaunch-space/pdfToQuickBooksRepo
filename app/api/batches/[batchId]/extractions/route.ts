// API route for fetching extractions from a completed batch - used by review/edit interface
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, authenticateAPIRequest } from '@/lib/supabase-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  console.log('🚀 Batch Extractions API called')
  console.log('📋 Batch ID:', params.batchId)
  
  try {
    const batchId = params.batchId

    if (!batchId) {
      return NextResponse.json({ 
        error: 'Missing batchId parameter' 
      }, { status: 400 })
    }

    // Get user from Authorization header
    console.log('🔐 Getting user from Authorization header...')
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing')
    
    const { user, error: authError } = await authenticateAPIRequest(authHeader)
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create supabase instance for database operations
    const supabase = createAPIClient()

    // Verify batch ownership and get batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id, 
        status,
        csv_format,
        account_id,
        accounts!inner(
          id,
          user_id, 
          name
        )
      `)
      .eq('id', batchId)
      .eq('accounts.user_id', user.id)
      .single()

    if (batchError || !batch) {
      console.log('❌ Batch not found or access denied:', batchError)
      return NextResponse.json({ 
        error: 'Batch not found or access denied' 
      }, { status: 403 })
    }

    // Only allow access to completed batches
    if (batch.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Batch is not completed yet' 
      }, { status: 400 })
    }

    // Fetch all extractions for this batch
    const { data: extractions, error: extractionsError } = await supabase
      .from('extractions')
      .select(`
        id,
        filename,
        extracted_data,
        confidence_score,
        engine_used,
        created_at
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (extractionsError) {
      console.error('❌ Error fetching extractions:', extractionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch extractions' 
      }, { status: 500 })
    }

    console.log('✅ Successfully fetched extractions:', {
      batchId,
      extractionsCount: extractions?.length || 0,
      csvFormat: batch.csv_format,
      accountName: batch.accounts.name
    })

    return NextResponse.json({
      success: true,
      batch: {
        id: batch.id,
        csv_format: batch.csv_format,
        account_name: batch.accounts.name
      },
      extractions: extractions || []
    })

  } catch (error) {
    console.error('💥 Batch extractions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
