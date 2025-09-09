// API route for processing individual files in a batch - handles queued processing with rate limiting
import { NextRequest, NextResponse } from 'next/server'
import { createAPIClient, authenticateAPIRequest } from '@/lib/supabase-api'
import { classifyTransaction } from '@/lib/transaction-classifier'

// Rate limiting: Process one file every 2 seconds to avoid hitting OpenRouter limits
const PROCESSING_DELAY = 2000

// Engine selection logic based on file characteristics
function selectEngine(file: File): 'mistral-ocr' | 'pdf-text' {
  // For now, use mistral-ocr for all files
  // TODO: Implement logic to detect scanned vs digital PDFs
  // - Check file size (scanned PDFs are typically larger)
  // - Check if PDF contains selectable text
  // - Use pdf-text for digital receipts, mistral-ocr for scanned
  return 'mistral-ocr'
}

export async function POST(request: NextRequest) {
  console.log('🚀 File Processing API called')
  console.log('🔍 Request URL:', request.url)
  console.log('🔍 Request method:', request.method)
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const batchId = formData.get('batchId') as string
    const format = formData.get('format') as string

    console.log('📁 File received:', {
      name: file?.name,
      type: file?.type,
      size: file?.size,
      batchId,
      format
    })

    // Validate inputs
    if (!file || !batchId || !format) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, batchId, format' 
      }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'File must be a PDF' 
      }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
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

    // Verify batch ownership and status, and get account name
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select(`
        id, 
        status, 
        account_id,
        accounts!inner(user_id, name)
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

    // Check subscription status again (double-check for paid users only)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.subscription_status !== 'active') {
      return NextResponse.json({ 
        error: 'Active subscription required for batch processing' 
      }, { status: 403 })
    }

    // Add processing delay to avoid rate limits
    console.log('⏳ Waiting for rate limit delay...')
    await new Promise(resolve => setTimeout(resolve, PROCESSING_DELAY))

    // Convert file to base64 for OpenRouter API
    console.log('🔄 Converting file to base64...')
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Select appropriate engine
    const engine = selectEngine(file)
    const llmModel = 'anthropic/claude-3.5-sonnet'
    
    console.log('🤖 Using engine:', engine, 'with LLM:', llmModel)

    // Prepare the prompt based on format
    const formatInstructions = format === '4-column' 
      ? 'Format: Date (DD/MM/YYYY), Description, Credit (blank), Debit (positive amounts)'
      : 'Format: Date (MM/DD/YYYY), Description (vendor + memo), Amount (negative for expenses)'

    const prompt = `Extract receipt data from this PDF and return ONLY a JSON object with the following fields:
- date: ${format === '4-column' ? 'DD/MM/YYYY format' : 'MM/DD/YYYY format'}
- vendor: Company/store name
- amount: Numeric value only (no currency symbols)
- description: Brief description of purchase

${formatInstructions}

Return ONLY valid JSON, no other text. If any field cannot be determined, use "Unknown" as the value.`

    // Call OpenRouter API
    console.log('📤 Sending request to OpenRouter...')
    const requestBody = {
      model: llmModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:application/pdf;base64,${base64}`
              }
            }
          ]
        }
      ],
      plugins: [
        {
          id: 'file-parser',
          pdf: {
            engine: engine
          }
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    }
    
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pdf-to-quickbooks.vercel.app',
        'X-Title': 'PDF to QuickBooks'
      },
      body: JSON.stringify(requestBody)
    })
    
    console.log('📥 OpenRouter response status:', openRouterResponse.status)

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text()
      console.error('❌ OpenRouter API error:', errorData)
      return NextResponse.json({ 
        error: 'Failed to process PDF with AI service' 
      }, { status: 500 })
    }

    const openRouterData = await openRouterResponse.json()
    const extractedText = openRouterData.choices?.[0]?.message?.content

    if (!extractedText) {
      console.log('❌ No extracted text found')
      return NextResponse.json({ 
        error: 'No data extracted from PDF' 
      }, { status: 500 })
    }

    // Parse the JSON response
    let extractedData
    try {
      console.log('🔍 Parsing JSON from response...')
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
        console.log('✅ Parsed data:', extractedData)
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse extracted data' 
      }, { status: 500 })
    }

    // Validate and clean the extracted data
    const cleanedData: any = {
      date: extractedData.date || 'Unknown',
      vendor: extractedData.vendor || 'Unknown',
      amount: extractedData.amount || '0',
      description: extractedData.description || 'Unknown'
    }

    // Classify transaction type (income vs expense)
    console.log('🔍 Classifying transaction type...')
    try {
      const classification = await classifyTransaction({
        vendor: cleanedData.vendor,
        description: cleanedData.description,
        amount: cleanedData.amount,
        accountName: batch.accounts[0]?.name || 'Unknown Account'
      })
      
      // Add classification to the data
      cleanedData.transaction_type = classification.transaction_type
      cleanedData.classification_confidence = classification.confidence
      cleanedData.classification_reasoning = classification.reasoning
      
      console.log('✅ Transaction classified:', classification)
    } catch (classificationError) {
      console.error('❌ Classification failed:', classificationError)
      // Default to expense
      cleanedData.transaction_type = 'expense'
      cleanedData.classification_confidence = 0.3
      cleanedData.classification_reasoning = 'Classification failed - defaulting to expense'
    }

    // Calculate confidence score (simplified for now)
    const confidenceScore = 0.85 // TODO: Implement actual confidence calculation

    // Create extraction record
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .insert({
        batch_id: batchId,
        filename: file.name,
        extracted_data: cleanedData,
        engine_used: engine,
        confidence_score: confidenceScore
      })
      .select()
      .single()

    if (extractionError) {
      console.error('Extraction creation error:', extractionError)
      return NextResponse.json({ 
        error: 'Failed to save extraction data' 
      }, { status: 500 })
    }

    console.log('✅ File processed successfully:', extraction.id)

    return NextResponse.json({
      success: true,
      extractionId: extraction.id,
      data: cleanedData
    })

  } catch (error) {
    console.error('💥 File processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
