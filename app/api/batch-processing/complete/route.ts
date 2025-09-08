// API route for completing batch processing - updates batch status and usage tracking
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, authenticateAPIRequest } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  console.log('🚀 Batch Complete API called')
  
  try {
    const { batchId } = await request.json()

    console.log('📋 Completing batch:', batchId)

    if (!batchId) {
      return NextResponse.json({ 
        error: 'Missing batchId' 
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

    // Create supabase instance for database operations (service role bypasses RLS)
    const supabase = createAPIClient()

    // Verify batch ownership
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id, 
        total_pages, 
        status,
        account_id,
        accounts!inner(user_id)
      `)
      .eq('id', batchId)
      .eq('accounts.user_id', user.id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ 
        error: 'Batch not found or access denied' 
      }, { status: 403 })
    }

    if (batch.status !== 'processing') {
      return NextResponse.json({ 
        error: 'Batch is not in processing status' 
      }, { status: 400 })
    }

    // Check if all extractions are complete
    const { data: extractions, error: extractionsError } = await supabase
      .from('extractions')
      .select('id')
      .eq('batch_id', batchId)

    if (extractionsError) {
      console.error('Error fetching extractions:', extractionsError)
      return NextResponse.json({ 
        error: 'Failed to check extraction status' 
      }, { status: 500 })
    }

    // Update batch status to completed
    const { error: updateError } = await supabase
      .from('batches')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', batchId)

    if (updateError) {
      console.error('Error updating batch status:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update batch status' 
      }, { status: 500 })
    }

    // Update monthly usage
    const { error: usageError } = await supabase
      .rpc('update_monthly_usage', {
        user_uuid: user.id,
        pages_used: batch.total_pages
      })

    if (usageError) {
      console.error('Error updating usage:', usageError)
      // Don't fail the request, just log the error
      console.warn('Usage tracking failed, but batch completed successfully')
    }

    console.log('✅ Batch completed successfully:', batchId)
    console.log('📊 Updated usage:', batch.total_pages, 'pages')

    return NextResponse.json({
      success: true,
      message: 'Batch processing completed successfully',
      extractionsCount: extractions?.length || 0,
      pagesProcessed: batch.total_pages
    })

  } catch (error) {
    console.error('💥 Batch completion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
