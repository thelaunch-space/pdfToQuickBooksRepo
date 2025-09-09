// API route for CSV export functionality - generates and downloads CSV files in QuickBooks format
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, authenticateAPIRequest } from '@/lib/supabase-api'

// CSV format generation functions
function generate3ColumnCSV(extractions: any[], batchProcessedAt: string): string {
  const rows: string[] = []
  
  extractions.forEach(extraction => {
    const data = extraction.extracted_data
    
    // Skip rows with missing amount
    if (!data.amount || data.amount === '0' || data.amount === 'Unknown') {
      console.warn(`Skipping extraction ${extraction.id} - missing or zero amount`)
      return
    }
    
    // Format date (MM/DD/YYYY)
    let date = data.date
    if (!date || date === 'Unknown') {
      // Fallback to batch processed date
      const batchDate = new Date(batchProcessedAt)
      date = `${String(batchDate.getMonth() + 1).padStart(2, '0')}/${String(batchDate.getDate()).padStart(2, '0')}/${batchDate.getFullYear()}`
    }
    
    // Format description (vendor - description)
    let description = ''
    if (data.vendor && data.vendor !== 'Unknown') {
      if (data.description && data.description !== 'Unknown') {
        description = `${data.vendor} - ${data.description}`
      } else {
        description = data.vendor
      }
    } else if (data.description && data.description !== 'Unknown') {
      description = data.description
    } else {
      // Fallback to filename or generic description
      description = extraction.filename || 'Receipt'
    }
    
    // Format amount based on transaction type
    const amountString = String(data.amount || '0')
    const amount = parseFloat(amountString.replace(/[$,\s]/g, ''))
    if (isNaN(amount)) {
      console.warn(`Skipping extraction ${extraction.id} - invalid amount: ${data.amount}`)
      return
    }
    
    // Determine amount sign based on transaction type
    const transactionType = data.transaction_type || 'expense' // Default to expense for backward compatibility
    const formattedAmount = transactionType === 'income' ? amount : -amount
    
    // Create CSV row: Date, Description, Amount (positive for income, negative for expense)
    const csvRow = `"${date}","${description.replace(/"/g, '""')}","${formattedAmount}"`
    rows.push(csvRow)
  })
  
  return rows.join('\n')
}

function generate4ColumnCSV(extractions: any[], batchProcessedAt: string): string {
  const rows: string[] = []
  
  extractions.forEach(extraction => {
    const data = extraction.extracted_data
    
    // Skip rows with missing amount
    if (!data.amount || data.amount === '0' || data.amount === 'Unknown') {
      console.warn(`Skipping extraction ${extraction.id} - missing or zero amount`)
      return
    }
    
    // Format date (DD/MM/YYYY)
    let date = data.date
    if (!date || date === 'Unknown') {
      // Fallback to batch processed date
      const batchDate = new Date(batchProcessedAt)
      date = `${String(batchDate.getDate()).padStart(2, '0')}/${String(batchDate.getMonth() + 1).padStart(2, '0')}/${batchDate.getFullYear()}`
    }
    
    // Format description (vendor - description)
    let description = ''
    if (data.vendor && data.vendor !== 'Unknown') {
      if (data.description && data.description !== 'Unknown') {
        description = `${data.vendor} - ${data.description}`
      } else {
        description = data.vendor
      }
    } else if (data.description && data.description !== 'Unknown') {
      description = data.description
    } else {
      // Fallback to filename or generic description
      description = extraction.filename || 'Receipt'
    }
    
    // Format amount based on transaction type
    const amountString = String(data.amount || '0')
    const amount = parseFloat(amountString.replace(/[$,\s]/g, ''))
    if (isNaN(amount)) {
      console.warn(`Skipping extraction ${extraction.id} - invalid amount: ${data.amount}`)
      return
    }
    
    // Determine Credit/Debit based on transaction type
    const transactionType = data.transaction_type || 'expense' // Default to expense for backward compatibility
    const creditAmount = transactionType === 'income' ? amount : ''
    const debitAmount = transactionType === 'expense' ? amount : ''
    
    // Create CSV row: Date, Description, Credit (for income), Debit (for expense)
    const csvRow = `"${date}","${description.replace(/"/g, '""')}","${creditAmount}","${debitAmount}"`
    rows.push(csvRow)
  })
  
  return rows.join('\n')
}

function generateFilename(accountName: string, processedAt: string, csvFormat: string): string {
  // Sanitize account name
  const sanitizedAccountName = accountName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  // Format date as YYYY-MM-DD
  const date = new Date(processedAt)
  const dateString = date.toISOString().split('T')[0]
  
  // Format string: QuickBooks_[AccountName]_[YYYY-MM-DD]_[Format].csv
  return `QuickBooks_${sanitizedAccountName}_${dateString}_${csvFormat}.csv`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  console.log('🚀 CSV Export API called')
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
    console.log('🔍 Querying batch with user ID:', user.id)
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id, 
        status,
        csv_format,
        processed_at,
        account_id,
        accounts!inner(user_id)
      `)
      .eq('id', batchId)
      .eq('accounts.user_id', user.id)
      .single()

    console.log('📊 Batch query result:', { batch, batchError })

    if (batchError || !batch) {
      console.log('❌ Batch not found or access denied:', batchError)
      return NextResponse.json({ 
        error: 'Batch not found or access denied' 
      }, { status: 403 })
    }

    // Check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return NextResponse.json({ 
        error: 'User profile not found' 
      }, { status: 404 })
    }

    if (profile.subscription_status !== 'active') {
      console.log('❌ Subscription check failed:', profile.subscription_status)
      return NextResponse.json({ 
        error: 'Active subscription required for CSV export' 
      }, { status: 403 })
    }

    // Only allow export of completed batches
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
        extracted_data
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (extractionsError) {
      console.error('❌ Error fetching extractions:', extractionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch extractions' 
      }, { status: 500 })
    }

    if (!extractions || extractions.length === 0) {
      return NextResponse.json({ 
        error: 'No extractions found for this batch' 
      }, { status: 404 })
    }

    // Generate CSV content based on format
    let csvContent: string
    if (batch.csv_format === '3-column') {
      csvContent = generate3ColumnCSV(extractions, batch.processed_at)
    } else {
      csvContent = generate4ColumnCSV(extractions, batch.processed_at)
    }

    // Get account name for filename
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', batch.account_id)
      .single()
    
    const accountName = account?.name || 'Unknown'
    const filename = generateFilename(accountName, batch.processed_at, batch.csv_format)

    console.log('✅ Successfully generated CSV:', {
      batchId,
      extractionsCount: extractions.length,
      csvFormat: batch.csv_format,
      accountName: accountName,
      filename
    })

    // Return CSV file with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('💥 CSV export error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
