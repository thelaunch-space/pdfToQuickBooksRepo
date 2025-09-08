// API route for creating batch processing records - handles batch creation and validation
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, authenticateAPIRequest } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  console.log('🚀 Batch Processing API called')
  console.log('🔍 Request URL:', request.url)
  console.log('🔍 Request method:', request.method)
  console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const { accountId, fileCount, totalPages, csvFormat } = await request.json()

    console.log('📋 Batch data received:', {
      accountId,
      fileCount,
      totalPages,
      csvFormat
    })

    // Validate required fields
    if (!accountId || !fileCount || !totalPages || !csvFormat) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ 
        error: 'Missing required fields: accountId, fileCount, totalPages, csvFormat' 
      }, { status: 400 })
    }

    // Validate file count (max 10)
    if (fileCount > 10) {
      console.log('❌ File count exceeds limit:', fileCount)
      return NextResponse.json({ 
        error: 'Maximum 10 files allowed per batch' 
      }, { status: 400 })
    }

    // Validate CSV format
    if (!['3-column', '4-column'].includes(csvFormat)) {
      console.log('❌ Invalid CSV format:', csvFormat)
      return NextResponse.json({ 
        error: 'Invalid CSV format. Must be 3-column or 4-column' 
      }, { status: 400 })
    }

    // Get user from Authorization header
    console.log('🔐 Getting user from Authorization header...')
    const authHeader = request.headers.get('Authorization')
    console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing')
    
    const { user, error: authError } = await authenticateAPIRequest(authHeader)
    
    console.log('👤 Auth result:', {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError
    })
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Please sign in to continue' 
      }, { status: 401 })
    }

    // Create supabase instance for database operations (service role bypasses RLS)
    const supabase = createAPIClient()
    
    // Verify account ownership with single query
    console.log('🏢 Verifying account ownership for account:', accountId)
    console.log('👤 User ID:', user.id)
    
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, user_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    console.log('🏢 Account verification result:', {
      account,
      error: accountError
    })

    if (accountError || !account) {
      console.log('❌ Account not found or access denied')
      return NextResponse.json({ 
        error: 'The selected account could not be found. Please refresh the page and try again.' 
      }, { status: 403 })
    }

    // Check subscription status
    console.log('💳 Checking subscription status for user:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, monthly_usage')
      .eq('id', user.id)
      .single()

    console.log('💳 Profile check result:', {
      profile,
      error: profileError
    })

    if (profileError || !profile) {
      console.log('❌ Profile not found')
      return NextResponse.json({ 
        error: 'Profile not found' 
      }, { status: 404 })
    }

    if (profile.subscription_status !== 'active') {
      console.log('❌ Subscription not active:', profile.subscription_status)
      return NextResponse.json({ 
        error: 'Active subscription required for batch processing' 
      }, { status: 403 })
    }

    // Check usage limit using the database function
    console.log('📊 Checking usage limit for user:', user.id, 'additional pages:', totalPages)
    const { data: canProcess, error: limitError } = await supabase
      .rpc('check_usage_limit', {
        user_uuid: user.id,
        additional_pages: totalPages
      })

    console.log('📊 Usage limit check result:', {
      canProcess,
      error: limitError
    })

    if (limitError) {
      console.error('❌ Usage limit check error:', limitError)
      return NextResponse.json({ 
        error: 'Failed to check usage limit' 
      }, { status: 500 })
    }

    if (!canProcess) {
      console.log('❌ Usage limit exceeded')
      return NextResponse.json({ 
        error: 'This batch would exceed your monthly limit of 1500 pages' 
      }, { status: 400 })
    }

    // Create batch record
    console.log('📝 Creating batch record...')
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        account_id: accountId,
        file_count: fileCount,
        total_pages: totalPages,
        csv_format: csvFormat,
        status: 'processing'
      })
      .select()
      .single()

    console.log('📝 Batch creation result:', {
      batch,
      error: batchError
    })

    if (batchError) {
      console.error('❌ Batch creation error:', batchError)
      return NextResponse.json({ 
        error: 'Failed to create batch' 
      }, { status: 500 })
    }

    console.log('✅ Batch created successfully:', batch.id)

    return NextResponse.json({
      success: true,
      batchId: batch.id
    })

  } catch (error) {
    console.error('💥 Batch processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
